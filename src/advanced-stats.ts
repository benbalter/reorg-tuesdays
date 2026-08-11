/**
 * Advanced statistical analysis module.
 *
 * Implements: Monte Carlo simulation, bootstrap CI, Weibull MLE,
 * hazard functions, CUSUM changepoint detection, entropy analysis,
 * autocorrelation, Poisson process testing, composite risk scoring,
 * and multi-model forecast ensembles.
 *
 * This is intentionally over-engineered. You're welcome.
 */

import { addDays } from "date-fns";
import {
  mean,
  median,
  quantile,
  sampleStandardDeviation,
  sampleVariance,
  cumulativeStdNormalProbability,
} from "simple-statistics";
import type {
  WeibullParams,
  DistributionFit,
  BootstrapResult,
  MonteCarloResult,
  HazardPoint,
  Changepoint,
  EntropyAnalysis,
  AutocorrelationResult,
  PoissonTestResult,
  RiskScore,
  ForecastModel,
  ForecastEnsemble,
  LognormalParams,
} from "./types.js";

// Seeded PRNG (xoshiro128** variant) for reproducible Monte Carlo
function createRng(seed: number = 42): () => number {
  let s0 = seed >>> 0;
  let s1 = (seed * 1664525 + 1013904223) >>> 0;
  let s2 = (s1 * 1664525 + 1013904223) >>> 0;
  let s3 = (s2 * 1664525 + 1013904223) >>> 0;
  return () => {
    const result = (((s1 * 5) << 7) | ((s1 * 5) >>> 25)) * 9;
    const t = s1 << 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return (result >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal samples
function normalSample(rng: () => number): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// --- Weibull Distribution MLE ---

/**
 * Fit Weibull distribution via maximum likelihood estimation (Newton-Raphson).
 * Weibull PDF: f(t) = (k/λ)(t/λ)^(k-1) exp(-(t/λ)^k)
 */
export function fitWeibull(durations: number[]): WeibullParams | null {
  if (durations.length < 3) return null;
  const data = durations.filter((d) => d > 0);
  if (data.length < 3) return null;

  const n = data.length;
  const logData = data.map((d) => Math.log(d));

  // Newton-Raphson for shape parameter k
  let k = 1.5; // initial guess
  for (let iter = 0; iter < 100; iter++) {
    const sumTk = data.reduce((s, t) => s + Math.pow(t, k), 0);
    const sumTkLogT = data.reduce(
      (s, t) => s + Math.pow(t, k) * Math.log(t),
      0,
    );
    const sumLogT = logData.reduce((s, l) => s + l, 0);
    const sumTkLogT2 = data.reduce(
      (s, t) => s + Math.pow(t, k) * Math.log(t) * Math.log(t),
      0,
    );

    const f = n / k + sumLogT - (n * sumTkLogT) / sumTk;
    const fPrime =
      -n / (k * k) -
      (n * (sumTkLogT2 * sumTk - sumTkLogT * sumTkLogT)) / (sumTk * sumTk);

    if (Math.abs(fPrime) < 1e-15) break;
    const delta = f / fPrime;
    k -= delta;
    if (k <= 0) k = 0.01;
    if (Math.abs(delta) < 1e-10) break;
  }

  const scale = Math.pow(
    data.reduce((s, t) => s + Math.pow(t, k), 0) / n,
    1 / k,
  );

  // Log-likelihood
  const ll = data.reduce((s, t) => {
    return (
      s +
      Math.log(k) -
      k * Math.log(scale) +
      (k - 1) * Math.log(t) -
      Math.pow(t / scale, k)
    );
  }, 0);

  if (!isFinite(k) || !isFinite(scale) || !isFinite(ll)) return null;

  return { shape: k, scale, logLikelihood: ll };
}

/** Weibull CDF: P(T ≤ t) = 1 - exp(-(t/λ)^k) */
export function weibullCdf(t: number, shape: number, scale: number): number {
  if (t <= 0) return 0;
  return 1 - Math.exp(-Math.pow(t / scale, shape));
}

/** Weibull survival: S(t) = exp(-(t/λ)^k) */
export function weibullSurvival(
  t: number,
  shape: number,
  scale: number,
): number {
  if (t <= 0) return 1;
  return Math.exp(-Math.pow(t / scale, shape));
}

/** Weibull hazard: h(t) = (k/λ)(t/λ)^(k-1) */
export function weibullHazard(t: number, shape: number, scale: number): number {
  if (t <= 0) return 0;
  return (shape / scale) * Math.pow(t / scale, shape - 1);
}

/** Weibull quantile (inverse CDF): t = λ * (-ln(1-p))^(1/k) */
export function weibullQuantile(
  p: number,
  shape: number,
  scale: number,
): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  return scale * Math.pow(-Math.log(1 - p), 1 / shape);
}

// --- Distribution fitting with AIC/BIC ---

function lognormalLogLikelihood(
  durations: number[],
  mu: number,
  sigma: number,
): number {
  return durations.reduce((s, d) => {
    if (d <= 0) return s;
    const logD = Math.log(d);
    return (
      s -
      logD -
      0.5 * Math.log(2 * Math.PI) -
      Math.log(sigma) -
      Math.pow(logD - mu, 2) / (2 * sigma * sigma)
    );
  }, 0);
}

export function fitDistributions(durations: number[]): DistributionFit {
  const n = durations.length;

  // Lognormal
  let lognormal: LognormalParams | null = null;
  let lognormalAic: number | null = null;
  if (n >= 3) {
    const logDays = durations.filter((d) => d > 0).map((d) => Math.log(d));
    if (logDays.length >= 3) {
      const mu = mean(logDays);
      const sigma = sampleStandardDeviation(logDays);
      const ll = lognormalLogLikelihood(durations, mu, sigma);
      lognormal = { mu, sigma, n: logDays.length };
      lognormalAic = 2 * 2 - 2 * ll; // 2 parameters
    }
  }

  // Weibull
  const weibull = fitWeibull(durations);
  const weibullAic = weibull ? 2 * 2 - 2 * weibull.logLikelihood : null;

  // Select best
  let bestFit: "lognormal" | "weibull" | "empirical" = "empirical";
  if (lognormalAic !== null && weibullAic !== null) {
    bestFit = lognormalAic <= weibullAic ? "lognormal" : "weibull";
  } else if (lognormalAic !== null) {
    bestFit = "lognormal";
  } else if (weibullAic !== null) {
    bestFit = "weibull";
  }

  return { lognormal, weibull, bestFit, lognormalAic, weibullAic };
}

// --- Bootstrap ---

export function bootstrap(
  data: number[],
  statFn: (d: number[]) => number,
  iterations: number = 10_000,
  seed: number = 42,
): BootstrapResult {
  if (data.length === 0) {
    return {
      mean: 0,
      ci95Low: 0,
      ci95High: 0,
      ci80Low: 0,
      ci80High: 0,
      standardError: 0,
      samples: 0,
    };
  }

  const rng = createRng(seed);
  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const sample = Array.from(
      { length: data.length },
      () => data[Math.floor(rng() * data.length)],
    );
    results.push(statFn(sample));
  }

  results.sort((a, b) => a - b);

  return {
    mean: mean(results),
    ci95Low: quantile(results, 0.025),
    ci95High: quantile(results, 0.975),
    ci80Low: quantile(results, 0.1),
    ci80High: quantile(results, 0.9),
    standardError: sampleStandardDeviation(results),
    samples: iterations,
  };
}

// --- Monte Carlo Simulation ---

export function monteCarloPredict(
  durations: number[],
  daysSinceLast: number,
  baseDate: Date,
  iterations: number = 10_000,
  seed: number = 42,
): MonteCarloResult {
  if (durations.length < 3) {
    const fallback = mean(durations.length > 0 ? durations : [180]);
    return {
      simulations: 0,
      predictedDays: {
        mean: fallback,
        ci95Low: fallback,
        ci95High: fallback,
        ci80Low: fallback,
        ci80High: fallback,
        standardError: 0,
        samples: 0,
      },
      predictedDate: {
        median: addDays(baseDate, Math.round(fallback)),
        ci95Low: addDays(baseDate, Math.round(fallback)),
        ci95High: addDays(baseDate, Math.round(fallback)),
        ci80Low: addDays(baseDate, Math.round(fallback)),
        ci80High: addDays(baseDate, Math.round(fallback)),
      },
      survivalCurve: [
        [0, 1],
        [Math.round(fallback), 0],
      ],
    };
  }

  const rng = createRng(seed);
  const fit = fitDistributions(durations);
  const simulated: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let sample: number;
    if (fit.bestFit === "weibull" && fit.weibull) {
      // Inverse CDF sampling from Weibull
      const u = rng();
      sample = weibullQuantile(u, fit.weibull.shape, fit.weibull.scale);
    } else if (fit.lognormal) {
      // Sample from lognormal
      sample = Math.exp(
        fit.lognormal.mu + fit.lognormal.sigma * normalSample(rng),
      );
    } else {
      // Empirical bootstrap
      sample = durations[Math.floor(rng() * durations.length)];
    }
    simulated.push(Math.max(1, Math.round(sample)));
  }

  simulated.sort((a, b) => a - b);

  const predDays: BootstrapResult = {
    mean: mean(simulated),
    ci95Low: quantile(simulated, 0.025),
    ci95High: quantile(simulated, 0.975),
    ci80Low: quantile(simulated, 0.1),
    ci80High: quantile(simulated, 0.9),
    standardError: sampleStandardDeviation(simulated),
    samples: iterations,
  };

  // Build simulated survival curve
  const maxDay = Math.ceil(quantile(simulated, 0.99));
  const survivalCurve: Array<[number, number]> = [];
  for (let d = 0; d <= maxDay; d += Math.max(1, Math.floor(maxDay / 50))) {
    const surviving = simulated.filter((s) => s > d).length / iterations;
    survivalCurve.push([d, surviving]);
  }

  return {
    simulations: iterations,
    predictedDays: predDays,
    predictedDate: {
      median: addDays(baseDate, Math.round(median(simulated))),
      ci95Low: addDays(baseDate, Math.round(predDays.ci95Low)),
      ci95High: addDays(baseDate, Math.round(predDays.ci95High)),
      ci80Low: addDays(baseDate, Math.round(predDays.ci80Low)),
      ci80High: addDays(baseDate, Math.round(predDays.ci80High)),
    },
    survivalCurve,
  };
}

// --- Hazard function ---

export function computeHazardFunction(
  durations: number[],
  weibullParams?: WeibullParams | null,
): HazardPoint[] {
  if (durations.length === 0) return [];

  const sorted = [...durations].sort((a, b) => a - b);
  const maxT = sorted[sorted.length - 1];
  const points: HazardPoint[] = [];
  const step = Math.max(1, Math.floor(maxT / 50));

  for (let t = 1; t <= maxT + step; t += step) {
    let hazard: number;
    let survival: number;
    let cumHazard: number;

    if (weibullParams) {
      hazard = weibullHazard(t, weibullParams.shape, weibullParams.scale);
      survival = weibullSurvival(t, weibullParams.shape, weibullParams.scale);
      cumHazard = -Math.log(Math.max(survival, 1e-15));
    } else {
      // Nelson-Aalen estimator from empirical data
      const n = sorted.length;
      cumHazard = 0;
      for (let i = 0; i < n; i++) {
        if (sorted[i] <= t) {
          cumHazard += 1 / (n - i);
        }
      }
      survival = Math.exp(-cumHazard);
      // Kernel-smoothed hazard estimate
      const bandwidth = Math.max(maxT * 0.1, 30);
      let kernelSum = 0;
      for (const d of sorted) {
        kernelSum += Math.exp(-0.5 * Math.pow((t - d) / bandwidth, 2));
      }
      hazard =
        kernelSum /
        (n * bandwidth * Math.sqrt(2 * Math.PI) * Math.max(survival, 0.01));
    }

    points.push({
      time: t,
      hazard: Math.round(hazard * 10000) / 10000,
      cumulativeHazard: Math.round(cumHazard * 1000) / 1000,
      survival: Math.round(survival * 1000) / 1000,
    });
  }

  return points;
}

// --- CUSUM Changepoint Detection ---

export function detectChangepoints(
  durations: number[],
  dates: Date[],
  threshold: number = 4,
): Changepoint[] {
  if (durations.length < 5) return [];

  const mu = mean(durations);
  const sigma = sampleStandardDeviation(durations);
  if (sigma === 0) return [];

  const normalized = durations.map((d) => (d - mu) / sigma);

  const changepoints: Changepoint[] = [];
  let cusumPos = 0;
  let cusumNeg = 0;

  for (let i = 0; i < normalized.length; i++) {
    cusumPos = Math.max(0, cusumPos + normalized[i] - 0.5);
    cusumNeg = Math.min(0, cusumNeg + normalized[i] + 0.5);

    if (cusumPos > threshold) {
      changepoints.push({
        index: i,
        date: dates[i + 1], // +1 because durations[i] is between dates[i] and dates[i+1]
        cusumValue: cusumPos,
        direction: "increase",
        magnitude: Math.round(((durations[i] - mu) / sigma) * 100) / 100,
      });
      cusumPos = 0;
    }
    if (cusumNeg < -threshold) {
      changepoints.push({
        index: i,
        date: dates[i + 1],
        cusumValue: cusumNeg,
        direction: "decrease",
        magnitude: Math.round(((durations[i] - mu) / sigma) * 100) / 100,
      });
      cusumNeg = 0;
    }
  }

  return changepoints;
}

// --- Entropy Analysis ---

export function computeEntropy(
  durations: number[],
  bins: number = 10,
): EntropyAnalysis {
  if (durations.length === 0) {
    return {
      shannonEntropy: 0,
      normalizedEntropy: 0,
      giniImpurity: 0,
      effectiveNumberOfStates: 1,
    };
  }

  const minVal = Math.min(...durations);
  const maxVal = Math.max(...durations);
  const range = maxVal - minVal || 1;
  const binWidth = range / bins;

  const histogram = new Array(bins).fill(0);
  for (const d of durations) {
    const binIdx = Math.min(Math.floor((d - minVal) / binWidth), bins - 1);
    histogram[binIdx]++;
  }

  const total = durations.length;
  const probs = histogram.map((c) => c / total).filter((p) => p > 0);

  const shannonEntropy = -probs.reduce((s, p) => s + p * Math.log2(p), 0);
  const maxEntropy = Math.log2(bins);
  const normalizedEntropy = maxEntropy > 0 ? shannonEntropy / maxEntropy : 0;
  const giniImpurity = 1 - probs.reduce((s, p) => s + p * p, 0);
  const effectiveNumberOfStates = Math.pow(2, shannonEntropy);

  return {
    shannonEntropy: Math.round(shannonEntropy * 1000) / 1000,
    normalizedEntropy: Math.round(normalizedEntropy * 1000) / 1000,
    giniImpurity: Math.round(giniImpurity * 1000) / 1000,
    effectiveNumberOfStates: Math.round(effectiveNumberOfStates * 100) / 100,
  };
}

// --- Autocorrelation ---

export function computeAutocorrelation(
  durations: number[],
): AutocorrelationResult {
  const n = durations.length;
  if (n < 5) {
    return {
      lag1: 0,
      lag2: 0,
      lag3: 0,
      ljungBoxStatistic: 0,
      ljungBoxPValue: 1,
      isIndependent: true,
    };
  }

  const m = mean(durations);
  const variance = sampleVariance(durations);
  if (variance === 0) {
    return {
      lag1: 0,
      lag2: 0,
      lag3: 0,
      ljungBoxStatistic: 0,
      ljungBoxPValue: 1,
      isIndependent: true,
    };
  }

  function acf(lag: number): number {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (durations[i] - m) * (durations[i + lag] - m);
    }
    return sum / ((n - 1) * variance);
  }

  const lag1 = acf(1);
  const lag2 = acf(2);
  const lag3 = acf(3);

  // Ljung-Box test with 3 lags
  const maxLag = Math.min(3, n - 2);
  let qStat = 0;
  for (let k = 1; k <= maxLag; k++) {
    const r = acf(k);
    qStat += (r * r) / (n - k);
  }
  qStat *= n * (n + 2);

  // Approximate chi-squared p-value (df = maxLag)
  const pValue = 1 - chiSquaredCdf(qStat, maxLag);

  return {
    lag1: Math.round(lag1 * 1000) / 1000,
    lag2: Math.round(lag2 * 1000) / 1000,
    lag3: Math.round(lag3 * 1000) / 1000,
    ljungBoxStatistic: Math.round(qStat * 1000) / 1000,
    ljungBoxPValue: Math.round(pValue * 10000) / 10000,
    isIndependent: pValue > 0.05,
  };
}

// --- Poisson Process Test ---

export function testPoissonProcess(
  durations: number[],
  totalTime: number,
): PoissonTestResult {
  const n = durations.length;
  if (n < 3) {
    return {
      observedRate: 0,
      expectedUniform: 0,
      chiSquaredStatistic: 0,
      chiSquaredPValue: 1,
      dispersionIndex: 1,
      isHomogeneous: true,
    };
  }

  const observedRate = n / totalTime;
  const expectedUniform = totalTime / n;

  // Dispersion test: Var(durations) / Mean(durations)
  // For exponential (Poisson inter-arrivals), this should be ≈ 1
  const m = mean(durations);
  const v = sampleVariance(durations);
  const dispersionIndex = m > 0 ? v / m : 0;

  // Chi-squared GoF: split timeline into k bins, count events per bin
  const k = Math.min(Math.floor(Math.sqrt(n)), 10);
  const binSize = totalTime / k;
  const bins = new Array(k).fill(0);
  let cumulative = 0;
  let binIdx = 0;
  for (const d of durations) {
    cumulative += d;
    while (binIdx < k - 1 && cumulative > (binIdx + 1) * binSize) {
      binIdx++;
    }
    if (binIdx < k) bins[binIdx]++;
  }

  const expected = n / k;
  const chiSq = bins.reduce(
    (s, obs) => s + Math.pow(obs - expected, 2) / expected,
    0,
  );
  const pValue = 1 - chiSquaredCdf(chiSq, k - 1);

  return {
    observedRate: Math.round(observedRate * 10000) / 10000,
    expectedUniform: Math.round(expectedUniform * 10) / 10,
    chiSquaredStatistic: Math.round(chiSq * 100) / 100,
    chiSquaredPValue: Math.round(pValue * 10000) / 10000,
    dispersionIndex: Math.round(dispersionIndex * 100) / 100,
    isHomogeneous:
      pValue > 0.05 && dispersionIndex < 2 && dispersionIndex > 0.5,
  };
}

// --- Composite Risk Score ---

export function computeRiskScore(
  durations: number[],
  daysSinceLast: number,
  trend: number | null,
  fit: DistributionFit,
): RiskScore {
  if (durations.length === 0) {
    return {
      composite: 50,
      components: {
        survival: 50,
        lognormal: 50,
        weibull: 50,
        trend: 50,
        recency: 50,
        percentile: 50,
      },
      label: "moderate",
      emoji: "🟡",
    };
  }

  const med = median(durations);

  // Component 1: Kaplan-Meier survival → risk
  const sorted = [...durations].sort((a, b) => a - b);
  const surviving =
    sorted.filter((d) => d > daysSinceLast).length / sorted.length;
  const survivalRisk = (1 - surviving) * 100;

  // Component 2: Lognormal conditional probability
  let lognormalRisk = 50;
  if (fit.lognormal) {
    const { mu, sigma } = fit.lognormal;
    const cdfNow = lognormalCdfInternal(daysSinceLast, mu, sigma);
    const cdfFuture = lognormalCdfInternal(daysSinceLast + 90, mu, sigma);
    const survNow = 1 - cdfNow;
    lognormalRisk =
      survNow > 1e-10
        ? Math.min(100, ((cdfFuture - cdfNow) / survNow) * 100)
        : 100;
  }

  // Component 3: Weibull conditional probability
  let weibullRisk = 50;
  if (fit.weibull) {
    const survNow = weibullSurvival(
      daysSinceLast,
      fit.weibull.shape,
      fit.weibull.scale,
    );
    const survFuture = weibullSurvival(
      daysSinceLast + 90,
      fit.weibull.shape,
      fit.weibull.scale,
    );
    weibullRisk =
      survNow > 1e-10
        ? Math.min(100, ((survNow - survFuture) / survNow) * 100)
        : 100;
  }

  // Component 4: Trend-based risk
  let trendRisk = 50;
  if (trend !== null) {
    // Negative trend = getting shorter = higher risk
    trendRisk = Math.max(0, Math.min(100, 50 - trend * 2));
  }

  // Component 5: Recency (how close are we to the mean/median?)
  const recencyRatio = daysSinceLast / Math.max(med, 1);
  const recencyRisk = Math.min(100, recencyRatio * 50);

  // Component 6: Percentile
  const percentileRisk =
    (sorted.filter((d) => d <= daysSinceLast).length / sorted.length) * 100;

  // Weighted ensemble
  const weights = {
    survival: 0.25,
    lognormal: 0.2,
    weibull: 0.2,
    trend: 0.1,
    recency: 0.1,
    percentile: 0.15,
  };
  const composite = Math.round(
    survivalRisk * weights.survival +
      lognormalRisk * weights.lognormal +
      weibullRisk * weights.weibull +
      trendRisk * weights.trend +
      recencyRisk * weights.recency +
      percentileRisk * weights.percentile,
  );

  const capped = Math.max(0, Math.min(100, composite));
  let label: RiskScore["label"];
  let emoji: string;
  if (capped < 20) {
    label = "low";
    emoji = "🟢";
  } else if (capped < 40) {
    label = "moderate";
    emoji = "🟡";
  } else if (capped < 60) {
    label = "elevated";
    emoji = "🟠";
  } else if (capped < 80) {
    label = "high";
    emoji = "🔴";
  } else {
    label = "critical";
    emoji = "🚨";
  }

  return {
    composite: capped,
    components: {
      survival: Math.round(survivalRisk),
      lognormal: Math.round(lognormalRisk),
      weibull: Math.round(weibullRisk),
      trend: Math.round(trendRisk),
      recency: Math.round(recencyRisk),
      percentile: Math.round(percentileRisk),
    },
    label,
    emoji,
  };
}

// --- Forecast Ensemble ---

export function buildForecastEnsemble(
  durations: number[],
  daysSinceLast: number,
  baseDate: Date,
  trendPrediction: Date | null,
  weightedPrediction: Date,
  fit: DistributionFit,
  monteCarlo: MonteCarloResult,
): ForecastEnsemble {
  const models: ForecastModel[] = [];
  const m = mean(durations.length > 0 ? durations : [180]);
  const med = durations.length > 0 ? median(durations) : 180;

  // Model 1: Simple mean
  models.push({
    name: "Historical Mean",
    prediction: addDays(baseDate, Math.round(m)),
    weight: 0.1,
    description: `Average of ${durations.length} past durations`,
  });

  // Model 2: Median
  models.push({
    name: "Historical Median",
    prediction: addDays(baseDate, Math.round(med)),
    weight: 0.15,
    description: "Robust central tendency",
  });

  // Model 3: Weighted exponential
  models.push({
    name: "Exponential Weighted",
    prediction: weightedPrediction,
    weight: 0.2,
    description: "Recency-weighted average with exponential decay",
  });

  // Model 4: Trend extrapolation
  if (trendPrediction) {
    models.push({
      name: "Linear Trend",
      prediction: trendPrediction,
      weight: 0.1,
      description: "Linear regression extrapolation of duration trend",
    });
  }

  // Model 5: Lognormal MLE
  if (fit.lognormal) {
    const lognormalMedian = Math.exp(fit.lognormal.mu);
    models.push({
      name: "Lognormal MLE",
      prediction: addDays(baseDate, Math.round(lognormalMedian)),
      weight: fit.bestFit === "lognormal" ? 0.2 : 0.1,
      description: `Lognormal(μ=${fit.lognormal.mu.toFixed(2)}, σ=${fit.lognormal.sigma.toFixed(2)})`,
    });
  }

  // Model 6: Weibull MLE
  if (fit.weibull) {
    const weibullMedian = weibullQuantile(
      0.5,
      fit.weibull.shape,
      fit.weibull.scale,
    );
    models.push({
      name: "Weibull MLE",
      prediction: addDays(baseDate, Math.round(weibullMedian)),
      weight: fit.bestFit === "weibull" ? 0.2 : 0.1,
      description: `Weibull(k=${fit.weibull.shape.toFixed(2)}, λ=${fit.weibull.scale.toFixed(1)})`,
    });
  }

  // Model 7: Monte Carlo
  models.push({
    name: "Monte Carlo",
    prediction: monteCarlo.predictedDate.median,
    weight: 0.25,
    description: `${monteCarlo.simulations.toLocaleString()} simulations`,
  });

  // Normalize weights
  const totalWeight = models.reduce((s, m) => s + m.weight, 0);
  models.forEach(
    (m) => (m.weight = Math.round((m.weight / totalWeight) * 1000) / 1000),
  );

  // Weighted average prediction
  const now = baseDate.getTime();
  const weightedMs = models.reduce(
    (s, m) => s + (m.prediction.getTime() - now) * m.weight,
    0,
  );
  const weightedDate = new Date(now + weightedMs);

  // Agreement score: how close are the models to each other?
  const predDays = models.map((m) =>
    Math.round((m.prediction.getTime() - now) / 86_400_000),
  );
  const spread = Math.max(...predDays) - Math.min(...predDays);
  const predStd = predDays.length >= 2 ? sampleStandardDeviation(predDays) : 0;
  const agreementScore = Math.max(0, Math.round(100 - predStd));

  return {
    models,
    weightedPrediction: weightedDate,
    agreementScore,
    spreadDays: spread,
  };
}

// --- Utility: chi-squared CDF (regularized incomplete gamma) ---

function chiSquaredCdf(x: number, df: number): number {
  if (x <= 0) return 0;
  return lowerIncompleteGamma(df / 2, x / 2) / gamma(df / 2);
}

function gamma(z: number): number {
  // Lanczos approximation
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function lowerIncompleteGamma(a: number, x: number): number {
  // Series expansion
  let sum = 0;
  let term = 1 / a;
  for (let n = 0; n < 200; n++) {
    sum += term;
    term *= x / (a + n + 1);
    if (Math.abs(term) < 1e-15) break;
  }
  return Math.pow(x, a) * Math.exp(-x) * sum;
}

function lognormalCdfInternal(days: number, mu: number, sigma: number): number {
  if (days <= 0) return 0;
  return cumulativeStdNormalProbability((Math.log(days) - mu) / sigma);
}
