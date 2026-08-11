import { addDays, differenceInDays, format } from "date-fns";
import {
  median,
  mean,
  min,
  max,
  quantile,
  quantileRank,
  linearRegression as ssLinearRegression,
  rSquared as ssRSquared,
  sampleStandardDeviation,
  sampleSkewness,
  cumulativeStdNormalProbability,
} from "simple-statistics";
import {
  fitDistributions,
  bootstrap,
  monteCarloPredict,
  computeHazardFunction,
  detectChangepoints,
  computeEntropy,
  computeAutocorrelation,
  testPoissonProcess,
  computeRiskScore,
  buildForecastEnsemble,
} from "./advanced-stats.js";
import { OrgStructure } from "./org-structure.js";
import { Manager } from "./manager.js";
import { today, type Context } from "./context.js";
import type { TimeSpan } from "./time-span.js";
import type {
  DescriptiveStats,
  Predictions,
  PredictionCi,
  LognormalParams,
  DistributionFit,
  BootstrapResult,
  MonteCarloResult,
  HazardPoint,
  Changepoint,
  EntropyAnalysis,
  AutocorrelationResult,
  PoissonTestResult,
  RiskScore,
  ForecastEnsemble,
} from "./types.js";

/**
 * The analytics engine. Performs statistical and predictive analysis
 * on reorg and manager tenure data.
 *
 * All durations are in **days** (not seconds like the Ruby version).
 */
export class Cruncher {
  private _reorgDurations: number[] | null = null;
  private _managerDurations: number[] | null = null;
  private _reorgStats: DescriptiveStats | null = null;
  private _managerStats: DescriptiveStats | null = null;
  private _orgStructures: OrgStructure[] | null = null;
  private _managers: Manager[] | null = null;

  constructor(private ctx: Context) {}

  private get orgStructures(): OrgStructure[] {
    return (this._orgStructures ??= OrgStructure.all(this.ctx));
  }

  private get managers(): Manager[] {
    return (this._managers ??= Manager.all(this.ctx));
  }

  /** Durations of completed org structures (excluding first and current) in days */
  get reorgDurations(): number[] {
    return (this._reorgDurations ??= this.orgStructures
      .slice(1, -1)
      .map((s) => s.duration));
  }

  /** Durations of completed manager stints (excluding current) in days */
  get managerDurations(): number[] {
    return (this._managerDurations ??= this.managers
      .slice(0, -1)
      .map((m) => m.stintDuration));
  }

  /** Descriptive statistics on an array of durations (days) */
  descriptiveStats(durations: number[]): DescriptiveStats {
    if (durations.length === 0) {
      return {
        number: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        q1: 0,
        q3: 0,
        standardDeviation: 0,
        skewness: null,
        coefficientOfVariation: 0,
      };
    }
    const m = mean(durations);
    const sd = durations.length >= 2 ? sampleStandardDeviation(durations) : 0;
    return {
      number: durations.length,
      min: min(durations),
      max: max(durations),
      mean: m,
      median: median(durations),
      q1: quantile(durations, 0.25),
      q3: quantile(durations, 0.75),
      standardDeviation: sd,
      skewness: durations.length >= 3 ? sampleSkewness(durations) : null,
      coefficientOfVariation: m > 0 ? sd / m : 0,
    };
  }

  get reorgStats(): DescriptiveStats {
    return (this._reorgStats ??= this.descriptiveStats(this.reorgDurations));
  }

  get managerStats(): DescriptiveStats {
    return (this._managerStats ??= this.descriptiveStats(
      this.managerDurations,
    ));
  }

  get tenure(): number {
    return this.ctx.hubberTenure;
  }

  // --- Predictions ---

  predictions(stats: DescriptiveStats, baseDate: Date): Predictions {
    return {
      min: addDays(baseDate, Math.round(stats.min)),
      max: addDays(baseDate, Math.round(stats.max)),
      mean: addDays(baseDate, Math.round(stats.mean)),
      median: addDays(baseDate, Math.round(stats.median)),
      q1: addDays(baseDate, Math.round(stats.q1)),
      q3: addDays(baseDate, Math.round(stats.q3)),
    };
  }

  get lastReorg(): OrgStructure {
    return this.orgStructures[this.orgStructures.length - 1];
  }

  get lastManagerChange(): Manager {
    return this.managers[this.managers.length - 1];
  }

  get reorgPredictions(): Predictions {
    return this.predictions(this.reorgStats, this.lastReorg.startDate);
  }

  get managerPredictions(): Predictions {
    return this.predictions(
      this.managerStats,
      this.lastManagerChange.startDate,
    );
  }

  // --- Current state ---

  get daysSinceLastReorg(): number {
    return differenceInDays(today(), this.lastReorg.startDate);
  }

  get daysSinceLastManagerChange(): number {
    return differenceInDays(today(), this.lastManagerChange.startDate);
  }

  get reorgOverdue(): boolean {
    return this.daysSinceLastReorg > this.reorgStats.median;
  }

  get managerOverdue(): boolean {
    return this.daysSinceLastManagerChange > this.managerStats.median;
  }

  // --- Date counting ---

  dateCount(timeSpans: TimeSpan[], formatStr: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const ts of timeSpans) {
      const key = format(ts.startDate, formatStr);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }

  // --- Log-normal distribution ---

  lognormalParams(durations: number[]): LognormalParams | null {
    if (durations.length < 3) return null;

    const logDays = durations.map((d) => Math.log(Math.max(d, 1)));
    const mu = mean(logDays);
    const sigma = sampleStandardDeviation(logDays);

    return { mu, sigma, n: logDays.length };
  }

  normalCdf(x: number): number {
    return cumulativeStdNormalProbability(x);
  }

  lognormalCdf(days: number, mu: number, sigma: number): number {
    if (days <= 0) return 0;
    return this.normalCdf((Math.log(days) - mu) / sigma);
  }

  // --- Probabilities ---

  probabilityWithin(
    durations: number[],
    daysSinceLast: number,
    daysAhead: number,
  ): number {
    if (durations.length === 0) return 100;

    const params = this.lognormalParams(durations);
    if (params) {
      return this.parametricProbability(params, daysSinceLast, daysAhead);
    }
    return this.empiricalProbability(durations, daysSinceLast, daysAhead);
  }

  parametricProbability(
    params: LognormalParams,
    daysSinceLast: number,
    daysAhead: number,
  ): number {
    const x = daysSinceLast;
    const t = daysSinceLast + daysAhead;

    const survivalAtX = 1.0 - this.lognormalCdf(x, params.mu, params.sigma);
    if (survivalAtX < 1e-10) return 100;

    const failureInWindow =
      this.lognormalCdf(t, params.mu, params.sigma) -
      this.lognormalCdf(x, params.mu, params.sigma);
    return Math.min(
      100,
      Math.max(0, Math.round((failureInWindow / survivalAtX) * 100)),
    );
  }

  empiricalProbability(
    durations: number[],
    daysSinceLast: number,
    daysAhead: number,
  ): number {
    const survived = daysSinceLast;
    const threshold = daysSinceLast + daysAhead;

    const survivors = durations.filter((d) => d > survived).length;
    if (survivors === 0) return 100;

    const eventsInWindow = durations.filter(
      (d) => d > survived && d <= threshold,
    ).length;
    return Math.round((eventsInWindow / survivors) * 100);
  }

  get reorgProbabilities(): Map<number, number> {
    const dsl = this.daysSinceLastReorg;
    return new Map(
      [30, 60, 90, 180].map((days) => [
        days,
        this.probabilityWithin(this.reorgDurations, dsl, days),
      ]),
    );
  }

  get managerProbabilities(): Map<number, number> {
    const dsl = this.daysSinceLastManagerChange;
    return new Map(
      [30, 60, 90, 180].map((days) => [
        days,
        this.probabilityWithin(this.managerDurations, dsl, days),
      ]),
    );
  }

  // --- Weighted average (exponential decay) ---

  weightedAverageDuration(durations: number[]): number {
    if (durations.length === 0) return 0;

    const n = durations.length;
    const halfLife = Math.max(n / 2, 1);
    const weights = Array.from({ length: n }, (_, i) =>
      Math.pow(2, (i - n + 1) / halfLife),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    return (
      durations.reduce((sum, d, i) => sum + d * weights[i], 0) / totalWeight
    );
  }

  get weightedReorgPrediction(): Date {
    const avg = this.weightedAverageDuration(this.reorgDurations);
    return addDays(this.lastReorg.startDate, Math.round(avg));
  }

  get weightedManagerPrediction(): Date {
    const avg = this.weightedAverageDuration(this.managerDurations);
    return addDays(this.lastManagerChange.startDate, Math.round(avg));
  }

  // --- Trend analysis (using simple-statistics) ---

  linearRegression(
    x: number[],
    y: number[],
  ): { slope: number; intercept: number; rSquared: number } | null {
    if (x.length < 3) return null;
    const data: [number, number][] = x.map((xi, i) => [xi, y[i]]);
    const result = ssLinearRegression(data);
    if (!isFinite(result.m) || !isFinite(result.b)) return null;
    const rSq = ssRSquared(data, (xi) => result.m * xi + result.b);
    return {
      slope: Math.round(result.m * 10) / 10,
      intercept: result.b,
      rSquared: Math.round(rSq * 1000) / 1000,
    };
  }

  trendSlope(durations: number[]): number | null {
    const n = durations.length;
    if (n < 3) return null;
    const x = Array.from({ length: n }, (_, i) => i);
    return this.linearRegression(x, durations)?.slope ?? null;
  }

  get reorgTrend(): number | null {
    return this.trendSlope(this.reorgDurations);
  }

  get managerTrend(): number | null {
    return this.trendSlope(this.managerDurations);
  }

  timeWeightedTrendSlope(timeSpans: TimeSpan[]): number | null {
    if (timeSpans.length < 3) return null;

    const firstDate = timeSpans[0].startDate;
    const x = timeSpans.map(
      (s) => differenceInDays(s.startDate, firstDate) / 365.25,
    );
    const y = timeSpans.map((s) => s.stintDuration);

    return this.linearRegression(x, y)?.slope ?? null;
  }

  get reorgTimeWeightedTrend(): number | null {
    return this.timeWeightedTrendSlope(this.orgStructures.slice(1, -1));
  }

  get managerTimeWeightedTrend(): number | null {
    return this.timeWeightedTrendSlope(this.managers.slice(0, -1));
  }

  trendPrediction(durations: number[], baseDate: Date): Date | null {
    const n = durations.length;
    if (n < 3) return null;

    const x = Array.from({ length: n }, (_, i) => i);
    const reg = this.linearRegression(x, durations);
    if (!reg) return null;

    const nextDays = Math.max(reg.intercept + reg.slope * n, 30);
    return addDays(baseDate, Math.round(nextDays));
  }

  get reorgTrendPrediction(): Date | null {
    return this.trendPrediction(this.reorgDurations, this.lastReorg.startDate);
  }

  get managerTrendPrediction(): Date | null {
    return this.trendPrediction(
      this.managerDurations,
      this.lastManagerChange.startDate,
    );
  }

  // --- Confidence intervals ---

  predictionCi(
    durations: number[],
    baseDate: Date,
    level: number = 1.28,
  ): PredictionCi | null {
    const params = this.lognormalParams(durations);
    if (!params) return null;

    const se = params.sigma / Math.sqrt(params.n);
    const lowDays = Math.exp(params.mu - level * se);
    const highDays = Math.exp(params.mu + level * se);

    return {
      low: addDays(baseDate, Math.round(lowDays)),
      high: addDays(baseDate, Math.round(highDays)),
    };
  }

  get reorgPredictionCi(): PredictionCi | null {
    return this.predictionCi(this.reorgDurations, this.lastReorg.startDate);
  }

  get managerPredictionCi(): PredictionCi | null {
    return this.predictionCi(
      this.managerDurations,
      this.lastManagerChange.startDate,
    );
  }

  // --- Rates ---

  get reorgRate(): number {
    const years = this.ctx.hubberTenure / 365.25;
    const reorgs = this.orgStructures.length - 1;
    return Math.round((reorgs / years) * 10) / 10;
  }

  get managerChurnRate(): number {
    const years = this.ctx.hubberTenure / 365.25;
    const uniqueManagers = new Set(this.managers.map((m) => m.login)).size;
    return Math.round((uniqueManagers / years) * 10) / 10;
  }

  rollingRate(timeSpans: TimeSpan[], years: number = 3): number {
    const cutoffDate = addDays(today(), -Math.round(years * 365.25));
    const recent = timeSpans.filter((ts) => ts.startDate >= cutoffDate);
    return Math.round((recent.length / years) * 10) / 10;
  }

  get reorgRollingRate(): number {
    return this.rollingRate(this.orgStructures.slice(1));
  }

  get managerRollingRate(): number {
    return this.rollingRate(this.managers);
  }

  // --- Frequency ---

  frequencyByQuarter(timeSpans: TimeSpan[]): Array<[string, number]> {
    const counts: Record<string, number> = {};
    for (const ts of timeSpans) {
      const q = `Q${Math.floor(ts.startDate.getMonth() / 3) + 1}`;
      counts[q] = (counts[q] ?? 0) + 1;
    }
    return [1, 2, 3, 4].map((q) => [`Q${q}`, counts[`Q${q}`] ?? 0]);
  }

  // --- Streaks ---

  longestStreakDays(durations: number[]): number {
    if (durations.length === 0) return 0;
    return Math.max(...durations);
  }

  get reorgLongestStreak(): number {
    return this.longestStreakDays(this.reorgDurations);
  }

  get managerLongestStreak(): number {
    return this.longestStreakDays(this.managerDurations);
  }

  // --- Percentiles (using simple-statistics quantileRank) ---

  currentPercentile(durations: number[], daysSinceLast: number): number {
    if (durations.length === 0) return 100;
    return Math.round(quantileRank(durations, daysSinceLast) * 100);
  }

  get reorgPercentile(): number {
    return this.currentPercentile(this.reorgDurations, this.daysSinceLastReorg);
  }

  get managerPercentile(): number {
    return this.currentPercentile(
      this.managerDurations,
      this.daysSinceLastManagerChange,
    );
  }

  // --- Kaplan-Meier survival analysis ---

  /**
   * Kaplan-Meier survival curve: returns an array of [time, survivalProbability]
   * pairs. All durations are treated as fully observed (no censoring).
   */
  kaplanMeier(durations: number[]): Array<[number, number]> {
    if (durations.length === 0) return [[0, 1]];

    const sorted = [...durations].sort((a, b) => a - b);
    const curve: Array<[number, number]> = [[0, 1]];
    let survival = 1;
    let atRisk = sorted.length;

    let i = 0;
    while (i < sorted.length) {
      const t = sorted[i];
      let events = 0;
      while (i < sorted.length && sorted[i] === t) {
        events++;
        i++;
      }
      survival *= (atRisk - events) / atRisk;
      atRisk -= events;
      curve.push([t, survival]);
    }
    return curve;
  }

  /** Kaplan-Meier median survival time (50% probability) */
  kaplanMeierMedian(durations: number[]): number | null {
    const curve = this.kaplanMeier(durations);
    for (const [t, s] of curve) {
      if (s <= 0.5) return t;
    }
    return null;
  }

  /** Survival probability at a given number of days */
  survivalAt(durations: number[], days: number): number {
    const curve = this.kaplanMeier(durations);
    let survival = 1;
    for (const [t, s] of curve) {
      if (t > days) break;
      survival = s;
    }
    return survival;
  }

  get reorgSurvivalCurve(): Array<[number, number]> {
    return this.kaplanMeier(this.reorgDurations);
  }

  get managerSurvivalCurve(): Array<[number, number]> {
    return this.kaplanMeier(this.managerDurations);
  }

  // --- Advanced: Distribution Fitting ---

  get reorgDistributionFit(): DistributionFit {
    return fitDistributions(this.reorgDurations);
  }

  get managerDistributionFit(): DistributionFit {
    return fitDistributions(this.managerDurations);
  }

  // --- Advanced: Bootstrap Confidence Intervals ---

  bootstrapStat(
    durations: number[],
    statFn: (d: number[]) => number,
    iterations: number = 10_000,
  ): BootstrapResult {
    return bootstrap(durations, statFn, iterations);
  }

  get reorgBootstrapMean(): BootstrapResult {
    return this.bootstrapStat(this.reorgDurations, mean);
  }

  get managerBootstrapMean(): BootstrapResult {
    return this.bootstrapStat(this.managerDurations, mean);
  }

  get reorgBootstrapMedian(): BootstrapResult {
    return this.bootstrapStat(this.reorgDurations, median);
  }

  get managerBootstrapMedian(): BootstrapResult {
    return this.bootstrapStat(this.managerDurations, median);
  }

  // --- Advanced: Monte Carlo Simulation ---

  get reorgMonteCarlo(): MonteCarloResult {
    return monteCarloPredict(
      this.reorgDurations,
      this.daysSinceLastReorg,
      this.lastReorg.startDate,
    );
  }

  get managerMonteCarlo(): MonteCarloResult {
    return monteCarloPredict(
      this.managerDurations,
      this.daysSinceLastManagerChange,
      this.lastManagerChange.startDate,
    );
  }

  // --- Advanced: Hazard Function ---

  get reorgHazardFunction(): HazardPoint[] {
    return computeHazardFunction(
      this.reorgDurations,
      this.reorgDistributionFit.weibull,
    );
  }

  get managerHazardFunction(): HazardPoint[] {
    return computeHazardFunction(
      this.managerDurations,
      this.managerDistributionFit.weibull,
    );
  }

  // --- Advanced: Changepoint Detection ---

  get reorgChangepoints(): Changepoint[] {
    const dates = this.orgStructures.slice(1, -1).map((s) => s.startDate);
    return detectChangepoints(this.reorgDurations, dates);
  }

  get managerChangepoints(): Changepoint[] {
    const dates = this.managers.slice(0, -1).map((m) => m.startDate);
    return detectChangepoints(this.managerDurations, dates);
  }

  // --- Advanced: Entropy ---

  get reorgEntropy(): EntropyAnalysis {
    return computeEntropy(this.reorgDurations);
  }

  get managerEntropy(): EntropyAnalysis {
    return computeEntropy(this.managerDurations);
  }

  // --- Advanced: Autocorrelation ---

  get reorgAutocorrelation(): AutocorrelationResult {
    return computeAutocorrelation(this.reorgDurations);
  }

  get managerAutocorrelation(): AutocorrelationResult {
    return computeAutocorrelation(this.managerDurations);
  }

  // --- Advanced: Poisson Process Test ---

  get reorgPoissonTest(): PoissonTestResult {
    return testPoissonProcess(this.reorgDurations, this.tenure);
  }

  get managerPoissonTest(): PoissonTestResult {
    return testPoissonProcess(this.managerDurations, this.tenure);
  }

  // --- Advanced: Composite Risk Score ---

  get reorgRiskScore(): RiskScore {
    return computeRiskScore(
      this.reorgDurations,
      this.daysSinceLastReorg,
      this.reorgTrend,
      this.reorgDistributionFit,
    );
  }

  get managerRiskScore(): RiskScore {
    return computeRiskScore(
      this.managerDurations,
      this.daysSinceLastManagerChange,
      this.managerTrend,
      this.managerDistributionFit,
    );
  }

  // --- Advanced: Forecast Ensemble ---

  get reorgForecastEnsemble(): ForecastEnsemble {
    return buildForecastEnsemble(
      this.reorgDurations,
      this.daysSinceLastReorg,
      this.lastReorg.startDate,
      this.reorgTrendPrediction,
      this.weightedReorgPrediction,
      this.reorgDistributionFit,
      this.reorgMonteCarlo,
    );
  }

  get managerForecastEnsemble(): ForecastEnsemble {
    return buildForecastEnsemble(
      this.managerDurations,
      this.daysSinceLastManagerChange,
      this.lastManagerChange.startDate,
      this.managerTrendPrediction,
      this.weightedManagerPrediction,
      this.managerDistributionFit,
      this.managerMonteCarlo,
    );
  }

  // --- Duration histogram bins ---

  histogram(
    durations: number[],
    bins: number = 8,
  ): Array<{ label: string; count: number }> {
    if (durations.length === 0) return [];
    const minVal = Math.min(...durations);
    const maxVal = Math.max(...durations);
    const binWidth = Math.ceil((maxVal - minVal) / bins) || 1;
    const result: Array<{ label: string; count: number }> = [];
    for (let i = 0; i < bins; i++) {
      const lo = minVal + i * binWidth;
      const hi = lo + binWidth;
      const count = durations.filter(
        (d) => d >= lo && (i === bins - 1 ? d <= hi : d < hi),
      ).length;
      result.push({ label: `${lo}-${hi}`, count });
    }
    return result;
  }
}
