/**
 * Shared type definitions for the reorg-tuesday project.
 */

export interface CsvRow {
  date: Date;
  manager: string;
  stepmanager: string;
  duration: string;
  rung: number;
  notes: string;
}

export interface DescriptiveStats {
  number: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  standardDeviation: number;
  skewness: number | null;
  coefficientOfVariation: number;
}

export interface Predictions {
  min: Date;
  max: Date;
  mean: Date;
  median: Date;
  q1: Date;
  q3: Date;
}

export interface PredictionCi {
  low: Date;
  high: Date;
}

export interface LognormalParams {
  mu: number;
  sigma: number;
  n: number;
}

// --- Advanced statistical types ---

export interface WeibullParams {
  shape: number; // k (shape parameter, aka β)
  scale: number; // λ (scale parameter)
  logLikelihood: number;
}

export interface DistributionFit {
  lognormal: LognormalParams | null;
  weibull: WeibullParams | null;
  bestFit: "lognormal" | "weibull" | "empirical";
  lognormalAic: number | null;
  weibullAic: number | null;
}

export interface BootstrapResult {
  mean: number;
  ci95Low: number;
  ci95High: number;
  ci80Low: number;
  ci80High: number;
  standardError: number;
  samples: number;
}

export interface MonteCarloResult {
  simulations: number;
  predictedDays: BootstrapResult;
  predictedDate: {
    median: Date;
    ci95Low: Date;
    ci95High: Date;
    ci80Low: Date;
    ci80High: Date;
  };
  survivalCurve: Array<[number, number]>;
}

export interface HazardPoint {
  time: number;
  hazard: number;
  cumulativeHazard: number;
  survival: number;
}

export interface Changepoint {
  index: number;
  date: Date;
  cusumValue: number;
  direction: "increase" | "decrease";
  magnitude: number;
}

export interface EntropyAnalysis {
  shannonEntropy: number;
  normalizedEntropy: number;
  giniImpurity: number;
  effectiveNumberOfStates: number;
}

export interface AutocorrelationResult {
  lag1: number;
  lag2: number;
  lag3: number;
  ljungBoxStatistic: number;
  ljungBoxPValue: number;
  isIndependent: boolean;
}

export interface PoissonTestResult {
  observedRate: number;
  expectedUniform: number;
  chiSquaredStatistic: number;
  chiSquaredPValue: number;
  dispersionIndex: number;
  isHomogeneous: boolean;
}

export interface RiskScore {
  composite: number;
  components: {
    survival: number;
    lognormal: number;
    weibull: number;
    trend: number;
    recency: number;
    percentile: number;
  };
  label: "low" | "moderate" | "elevated" | "high" | "critical";
  emoji: string;
}

export interface ForecastModel {
  name: string;
  prediction: Date;
  weight: number;
  description: string;
}

export interface ForecastEnsemble {
  models: ForecastModel[];
  weightedPrediction: Date;
  agreementScore: number;
  spreadDays: number;
}
