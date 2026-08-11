import { Context } from "../src/context.js";
import {
  fitWeibull,
  weibullCdf,
  weibullSurvival,
  weibullHazard,
  weibullQuantile,
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
} from "../src/advanced-stats.js";
import { Cruncher } from "../src/cruncher.js";
import { addDays } from "date-fns";

const ctx = new Context();
const baseDate = new Date(2024, 0, 1);

describe("Weibull distribution", () => {
  it("fits a Weibull distribution to known data", () => {
    const params = fitWeibull([30, 60, 90, 120, 150, 200]);
    expect(params).not.toBeNull();
    expect(params!.shape).toBeGreaterThan(0);
    expect(params!.scale).toBeGreaterThan(0);
    expect(isFinite(params!.logLikelihood)).toBe(true);
  });

  it("returns null for fewer than 3 data points", () => {
    expect(fitWeibull([10, 20])).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(fitWeibull([])).toBeNull();
  });

  it("weibullCdf returns 0 at t=0 and approaches 1", () => {
    expect(weibullCdf(0, 2, 100)).toBe(0);
    expect(weibullCdf(1000, 2, 100)).toBeGreaterThan(0.99);
  });

  it("weibullSurvival returns 1 at t=0 and approaches 0", () => {
    expect(weibullSurvival(0, 2, 100)).toBe(1);
    expect(weibullSurvival(1000, 2, 100)).toBeLessThan(0.01);
  });

  it("weibullCdf + weibullSurvival = 1", () => {
    const s = 2;
    const l = 100;
    for (const t of [10, 50, 100, 200]) {
      expect(weibullCdf(t, s, l) + weibullSurvival(t, s, l)).toBeCloseTo(1, 10);
    }
  });

  it("weibullHazard is positive for t > 0", () => {
    expect(weibullHazard(50, 2, 100)).toBeGreaterThan(0);
    expect(weibullHazard(0, 2, 100)).toBe(0);
  });

  it("weibullQuantile inverts CDF correctly", () => {
    const shape = 2;
    const scale = 100;
    for (const p of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const t = weibullQuantile(p, shape, scale);
      expect(weibullCdf(t, shape, scale)).toBeCloseTo(p, 4);
    }
  });
});

describe("fitDistributions", () => {
  it("fits both lognormal and Weibull and picks a best", () => {
    const fit = fitDistributions([30, 60, 90, 120, 150, 200, 250]);
    expect(fit.lognormal).not.toBeNull();
    expect(fit.weibull).not.toBeNull();
    expect(["lognormal", "weibull", "empirical"]).toContain(fit.bestFit);
    expect(fit.lognormalAic).not.toBeNull();
    expect(fit.weibullAic).not.toBeNull();
  });

  it("returns empirical for too few data points", () => {
    const fit = fitDistributions([10, 20]);
    expect(fit.bestFit).toBe("empirical");
  });
});

describe("bootstrap", () => {
  it("produces CI around the mean", () => {
    const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = bootstrap(
      data,
      (d) => d.reduce((a, b) => a + b, 0) / d.length,
      5000,
    );
    expect(result.mean).toBeCloseTo(55, -1);
    expect(result.ci95Low).toBeLessThan(result.mean);
    expect(result.ci95High).toBeGreaterThan(result.mean);
    expect(result.ci80Low).toBeGreaterThan(result.ci95Low);
    expect(result.ci80High).toBeLessThan(result.ci95High);
    expect(result.standardError).toBeGreaterThan(0);
    expect(result.samples).toBe(5000);
  });

  it("handles empty array", () => {
    const result = bootstrap([], () => 0);
    expect(result.mean).toBe(0);
    expect(result.samples).toBe(0);
  });
});

describe("monteCarloPredict", () => {
  it("produces predictions with CIs", () => {
    const durations = [30, 60, 90, 120, 150, 200];
    const mc = monteCarloPredict(durations, 10, baseDate, 5000);
    expect(mc.simulations).toBe(5000);
    expect(mc.predictedDays.mean).toBeGreaterThan(0);
    expect(mc.predictedDate.median).toBeInstanceOf(Date);
    expect(mc.predictedDate.ci95Low).toBeInstanceOf(Date);
    expect(mc.predictedDate.ci95High).toBeInstanceOf(Date);
    expect(mc.predictedDate.ci95Low.getTime()).toBeLessThan(
      mc.predictedDate.ci95High.getTime(),
    );
    expect(mc.survivalCurve.length).toBeGreaterThan(0);
    expect(mc.survivalCurve[0][1]).toBeCloseTo(1, 1);
  });

  it("handles too few data points gracefully", () => {
    const mc = monteCarloPredict([100], 10, baseDate, 100);
    expect(mc.simulations).toBe(0);
    expect(mc.predictedDate.median).toBeInstanceOf(Date);
  });
});

describe("computeHazardFunction", () => {
  it("returns hazard points", () => {
    const points = computeHazardFunction([30, 60, 90, 120, 150]);
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) {
      expect(p.time).toBeGreaterThan(0);
      expect(p.hazard).toBeGreaterThanOrEqual(0);
      expect(p.cumulativeHazard).toBeGreaterThanOrEqual(0);
      expect(p.survival).toBeGreaterThanOrEqual(0);
      expect(p.survival).toBeLessThanOrEqual(1);
    }
  });

  it("returns empty for empty durations", () => {
    expect(computeHazardFunction([])).toEqual([]);
  });

  it("accepts Weibull params", () => {
    const weibull = fitWeibull([30, 60, 90, 120, 150]);
    const points = computeHazardFunction([30, 60, 90, 120, 150], weibull);
    expect(points.length).toBeGreaterThan(0);
  });
});

describe("detectChangepoints", () => {
  it("detects a sudden increase", () => {
    // Normal durations then a huge jump — needs enough signal for CUSUM
    const durations = [50, 55, 48, 52, 50, 300, 310, 290, 305, 295];
    const dates = durations.map((_, i) => addDays(baseDate, i * 100));
    const cps = detectChangepoints(durations, dates, 2);
    expect(cps.length).toBeGreaterThan(0);
    expect(cps.some((cp) => cp.direction === "increase")).toBe(true);
  });

  it("returns empty for too few data points", () => {
    expect(
      detectChangepoints([10, 20], [baseDate, addDays(baseDate, 10)]),
    ).toEqual([]);
  });

  it("returns empty for constant data", () => {
    const durations = [100, 100, 100, 100, 100, 100];
    const dates = durations.map((_, i) => addDays(baseDate, i * 100));
    expect(detectChangepoints(durations, dates)).toEqual([]);
  });
});

describe("computeEntropy", () => {
  it("returns entropy metrics for a distribution", () => {
    const ent = computeEntropy([30, 60, 90, 120, 150, 200, 250, 300]);
    expect(ent.shannonEntropy).toBeGreaterThan(0);
    expect(ent.normalizedEntropy).toBeGreaterThanOrEqual(0);
    expect(ent.normalizedEntropy).toBeLessThanOrEqual(1);
    expect(ent.giniImpurity).toBeGreaterThanOrEqual(0);
    expect(ent.giniImpurity).toBeLessThanOrEqual(1);
    expect(ent.effectiveNumberOfStates).toBeGreaterThanOrEqual(1);
  });

  it("returns zero entropy for empty data", () => {
    const ent = computeEntropy([]);
    expect(ent.shannonEntropy).toBe(0);
    expect(ent.normalizedEntropy).toBe(0);
  });

  it("returns high entropy for uniform-ish data", () => {
    // Each bin gets ~1 observation → high entropy
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const ent = computeEntropy(data);
    expect(ent.normalizedEntropy).toBeGreaterThan(0.7);
  });
});

describe("computeAutocorrelation", () => {
  it("detects independence for random-ish data", () => {
    const data = [30, 90, 60, 150, 45, 120, 80, 200, 55, 110];
    const result = computeAutocorrelation(data);
    expect(typeof result.lag1).toBe("number");
    expect(typeof result.lag2).toBe("number");
    expect(typeof result.lag3).toBe("number");
    expect(result.ljungBoxStatistic).toBeGreaterThanOrEqual(0);
    expect(result.ljungBoxPValue).toBeGreaterThanOrEqual(0);
    expect(result.ljungBoxPValue).toBeLessThanOrEqual(1);
    expect(typeof result.isIndependent).toBe("boolean");
  });

  it("handles fewer than 5 data points", () => {
    const result = computeAutocorrelation([10, 20, 30]);
    expect(result.lag1).toBe(0);
    expect(result.isIndependent).toBe(true);
  });

  it("detects correlation in a trending series", () => {
    const trending = Array.from({ length: 20 }, (_, i) => i * 10 + 50);
    const result = computeAutocorrelation(trending);
    expect(result.lag1).toBeGreaterThan(0.3);
  });
});

describe("testPoissonProcess", () => {
  it("returns test results", () => {
    const result = testPoissonProcess([30, 60, 90, 120, 150], 500);
    expect(result.observedRate).toBeGreaterThan(0);
    expect(result.expectedUniform).toBeGreaterThan(0);
    expect(result.chiSquaredStatistic).toBeGreaterThanOrEqual(0);
    expect(typeof result.isHomogeneous).toBe("boolean");
  });

  it("handles too few data points", () => {
    const result = testPoissonProcess([10], 100);
    expect(result.isHomogeneous).toBe(true);
  });
});

describe("computeRiskScore", () => {
  it("returns a composite score between 0 and 100", () => {
    const fit = fitDistributions([30, 60, 90, 120, 150, 200]);
    const risk = computeRiskScore([30, 60, 90, 120, 150, 200], 100, -5, fit);
    expect(risk.composite).toBeGreaterThanOrEqual(0);
    expect(risk.composite).toBeLessThanOrEqual(100);
    expect(["low", "moderate", "elevated", "high", "critical"]).toContain(
      risk.label,
    );
    expect(risk.emoji).toBeTruthy();
    expect(risk.components.survival).toBeGreaterThanOrEqual(0);
    expect(risk.components.survival).toBeLessThanOrEqual(100);
  });

  it("gives higher risk when overdue", () => {
    const fit = fitDistributions([30, 60, 90]);
    const early = computeRiskScore([30, 60, 90], 10, null, fit);
    const late = computeRiskScore([30, 60, 90], 200, null, fit);
    expect(late.composite).toBeGreaterThan(early.composite);
  });
});

describe("buildForecastEnsemble", () => {
  it("builds an ensemble with multiple models", () => {
    const durations = [30, 60, 90, 120, 150, 200];
    const fit = fitDistributions(durations);
    const mc = monteCarloPredict(durations, 10, baseDate, 1000);
    const ensemble = buildForecastEnsemble(
      durations,
      10,
      baseDate,
      addDays(baseDate, 100),
      addDays(baseDate, 110),
      fit,
      mc,
    );
    expect(ensemble.models.length).toBeGreaterThanOrEqual(5);
    expect(ensemble.weightedPrediction).toBeInstanceOf(Date);
    expect(ensemble.spreadDays).toBeGreaterThanOrEqual(0);
    expect(ensemble.agreementScore).toBeGreaterThanOrEqual(0);
    // Weights should sum to ~1
    const totalWeight = ensemble.models.reduce((s, m) => s + m.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 1);
  });
});

describe("Cruncher advanced getters", () => {
  const cruncher = new Cruncher(ctx);

  it("reorgDistributionFit has a bestFit", () => {
    const fit = cruncher.reorgDistributionFit;
    expect(["lognormal", "weibull", "empirical"]).toContain(fit.bestFit);
  });

  it("reorgBootstrapMean returns a BootstrapResult", () => {
    const bs = cruncher.reorgBootstrapMean;
    expect(bs.samples).toBe(10000);
    expect(bs.ci95Low).toBeLessThan(bs.ci95High);
  });

  it("reorgMonteCarlo runs simulations", () => {
    const mc = cruncher.reorgMonteCarlo;
    expect(mc.simulations).toBe(10000);
    expect(mc.predictedDate.median).toBeInstanceOf(Date);
  });

  it("reorgHazardFunction returns points", () => {
    expect(cruncher.reorgHazardFunction.length).toBeGreaterThan(0);
  });

  it("reorgEntropy returns valid entropy", () => {
    const e = cruncher.reorgEntropy;
    expect(e.shannonEntropy).toBeGreaterThan(0);
  });

  it("reorgAutocorrelation returns a result", () => {
    const ac = cruncher.reorgAutocorrelation;
    expect(typeof ac.lag1).toBe("number");
    expect(typeof ac.isIndependent).toBe("boolean");
  });

  it("reorgPoissonTest returns a result", () => {
    const pt = cruncher.reorgPoissonTest;
    expect(pt.observedRate).toBeGreaterThan(0);
  });

  it("reorgRiskScore returns a composite", () => {
    const risk = cruncher.reorgRiskScore;
    expect(risk.composite).toBeGreaterThanOrEqual(0);
    expect(risk.composite).toBeLessThanOrEqual(100);
  });

  it("reorgForecastEnsemble returns models", () => {
    const ens = cruncher.reorgForecastEnsemble;
    expect(ens.models.length).toBeGreaterThanOrEqual(5);
    expect(ens.weightedPrediction).toBeInstanceOf(Date);
  });

  it("histogram returns bins", () => {
    const hist = cruncher.histogram(cruncher.reorgDurations);
    expect(hist.length).toBeGreaterThan(0);
    const totalCount = hist.reduce((s, b) => s + b.count, 0);
    expect(totalCount).toBe(cruncher.reorgDurations.length);
  });

  // Manager equivalents
  it("managerDistributionFit works", () => {
    expect(cruncher.managerDistributionFit.lognormal).not.toBeNull();
  });

  it("managerMonteCarlo works", () => {
    expect(cruncher.managerMonteCarlo.simulations).toBe(10000);
  });

  it("managerRiskScore works", () => {
    expect(cruncher.managerRiskScore.composite).toBeGreaterThanOrEqual(0);
  });

  it("managerForecastEnsemble works", () => {
    expect(
      cruncher.managerForecastEnsemble.models.length,
    ).toBeGreaterThanOrEqual(5);
  });
});
