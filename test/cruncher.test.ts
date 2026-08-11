import { Cruncher } from "../src/cruncher.js";
import { OrgStructure } from "../src/org-structure.js";
import { Context, today } from "../src/context.js";

describe("Cruncher", () => {
  const ctx = new Context();

  describe("reorgDurations", () => {
    it("has 25 completed org structure durations", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.reorgDurations).toHaveLength(25);
      cruncher.reorgDurations.forEach((d) => expect(d).toBeGreaterThan(0));
    });
  });

  describe("managerDurations", () => {
    it("has 14 completed manager stint durations", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.managerDurations).toHaveLength(14);
      cruncher.managerDurations.forEach((d) => expect(d).toBeGreaterThan(0));
    });
  });

  describe("descriptiveStats", () => {
    it("computes correct stats for a known array", () => {
      const cruncher = new Cruncher(ctx);
      const stats = cruncher.descriptiveStats([10, 20, 30, 40, 50]);
      expect(stats.number).toBe(5);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
    });
  });

  describe("reorgStats", () => {
    it("has expected keys and number=25", () => {
      const cruncher = new Cruncher(ctx);
      const stats = cruncher.reorgStats;
      expect(stats).toHaveProperty("number", 25);
      for (const key of ["min", "max", "mean", "median", "q1", "q3"]) {
        expect(stats).toHaveProperty(key);
        expect(typeof stats[key]).toBe("number");
      }
    });
  });

  describe("managerStats", () => {
    it("has number=14", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.managerStats.number).toBe(14);
    });
  });

  describe("tenure", () => {
    it("is positive and roughly correct from 2015-01-05", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.tenure).toBeGreaterThan(0);
      const expectedDays = Math.floor(
        (today().getTime() - new Date("2015-01-05").getTime()) / 86_400_000,
      );
      expect(Math.abs(cruncher.tenure - expectedDays)).toBeLessThan(5);
    });
  });

  describe("predictions", () => {
    it("reorgPredictions has expected keys with Date values", () => {
      const cruncher = new Cruncher(ctx);
      const preds = cruncher.reorgPredictions;
      for (const key of ["min", "max", "mean", "median", "q1", "q3"]) {
        expect(preds).toHaveProperty(key);
        expect(preds[key]).toBeInstanceOf(Date);
      }
    });

    it("managerPredictions has expected keys with Date values", () => {
      const cruncher = new Cruncher(ctx);
      const preds = cruncher.managerPredictions;
      for (const key of ["min", "max", "mean", "median", "q1", "q3"]) {
        expect(preds).toHaveProperty(key);
        expect(preds[key]).toBeInstanceOf(Date);
      }
    });
  });

  describe("daysSinceLastReorg", () => {
    it("is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.daysSinceLastReorg).toBeGreaterThan(0);
    });
  });

  describe("daysSinceLastManagerChange", () => {
    it("is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.daysSinceLastManagerChange).toBeGreaterThan(0);
    });
  });

  describe("overdue flags", () => {
    it("reorgOverdue is a boolean", () => {
      const cruncher = new Cruncher(ctx);
      expect(typeof cruncher.reorgOverdue).toBe("boolean");
    });

    it("managerOverdue is a boolean", () => {
      const cruncher = new Cruncher(ctx);
      expect(typeof cruncher.managerOverdue).toBe("boolean");
    });
  });

  describe("probabilities", () => {
    it("reorgProbabilities has keys 30, 60, 90, 180 with values 0-100", () => {
      const cruncher = new Cruncher(ctx);
      const probs = cruncher.reorgProbabilities;
      for (const days of [30, 60, 90, 180]) {
        expect(probs.has(days)).toBe(true);
        const val = probs.get(days)!;
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      }
    });

    it("managerProbabilities has keys 30, 60, 90, 180 with values 0-100", () => {
      const cruncher = new Cruncher(ctx);
      const probs = cruncher.managerProbabilities;
      for (const days of [30, 60, 90, 180]) {
        expect(probs.has(days)).toBe(true);
        const val = probs.get(days)!;
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("rates", () => {
    it("reorgRate is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.reorgRate).toBeGreaterThan(0);
    });

    it("managerChurnRate is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.managerChurnRate).toBeGreaterThan(0);
    });
  });

  describe("rolling rates", () => {
    it("reorgRollingRate is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.reorgRollingRate).toBeGreaterThan(0);
    });

    it("managerRollingRate is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.managerRollingRate).toBeGreaterThan(0);
    });
  });

  describe("trends", () => {
    it("reorgTrend is a number or null", () => {
      const cruncher = new Cruncher(ctx);
      const trend = cruncher.reorgTrend;
      expect(trend === null || typeof trend === "number").toBe(true);
    });

    it("managerTrend is a number or null", () => {
      const cruncher = new Cruncher(ctx);
      const trend = cruncher.managerTrend;
      expect(trend === null || typeof trend === "number").toBe(true);
    });
  });

  describe("lognormalParams", () => {
    it("returns params with n=5 for sufficient data", () => {
      const cruncher = new Cruncher(ctx);
      const params = cruncher.lognormalParams([30, 60, 90, 120, 150]);
      expect(params).not.toBeNull();
      expect(params!.n).toBe(5);
      expect(typeof params!.mu).toBe("number");
      expect(typeof params!.sigma).toBe("number");
    });

    it("returns null for fewer than 3 data points", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.lognormalParams([10, 20])).toBeNull();
    });
  });

  describe("normalCdf", () => {
    it("returns ~0.5 for x=0", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.normalCdf(0)).toBeCloseTo(0.5, 4);
    });

    it("returns ~0.8413 for x=1", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.normalCdf(1)).toBeCloseTo(0.8413, 3);
    });
  });

  describe("probabilityWithin", () => {
    it("returns a value between 0 and 100", () => {
      const cruncher = new Cruncher(ctx);
      const prob = cruncher.probabilityWithin(
        cruncher.reorgDurations,
        cruncher.daysSinceLastReorg,
        90,
      );
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(100);
    });
  });

  describe("linearRegression", () => {
    it("returns correct slope for a perfect line", () => {
      const cruncher = new Cruncher(ctx);
      const result = cruncher.linearRegression(
        [0, 1, 2, 3, 4],
        [2, 4, 6, 8, 10],
      );
      expect(result).not.toBeNull();
      expect(result!.slope).toBeCloseTo(2.0);
    });

    it("returns null for fewer than 3 points", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.linearRegression([0, 1], [0, 1])).toBeNull();
    });
  });

  describe("weightedAverageDuration", () => {
    it("returns 0 for an empty array", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.weightedAverageDuration([])).toBe(0);
    });
  });

  describe("frequencyByQuarter", () => {
    it("returns quarter counts for org structures", () => {
      const cruncher = new Cruncher(ctx);
      const reorgs = OrgStructure.all(ctx).slice(1);
      const result = cruncher.frequencyByQuarter(reorgs);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(([label, count]) => {
        expect(typeof label).toBe("string");
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("longestStreak", () => {
    it("reorgLongestStreak is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.reorgLongestStreak).toBeGreaterThan(0);
    });

    it("managerLongestStreak is a positive number", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.managerLongestStreak).toBeGreaterThan(0);
    });
  });

  describe("percentile", () => {
    it("reorgPercentile is between 0 and 100", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.reorgPercentile).toBeGreaterThanOrEqual(0);
      expect(cruncher.reorgPercentile).toBeLessThanOrEqual(100);
    });

    it("managerPercentile is between 0 and 100", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.managerPercentile).toBeGreaterThanOrEqual(0);
      expect(cruncher.managerPercentile).toBeLessThanOrEqual(100);
    });
  });

  describe("weighted predictions", () => {
    it("weightedReorgPrediction is a Date", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.weightedReorgPrediction).toBeInstanceOf(Date);
    });

    it("weightedManagerPrediction is a Date", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.weightedManagerPrediction).toBeInstanceOf(Date);
    });
  });

  describe("trend predictions", () => {
    it("reorgTrendPrediction is a Date or null", () => {
      const cruncher = new Cruncher(ctx);
      const pred = cruncher.reorgTrendPrediction;
      expect(pred === null || pred instanceof Date).toBe(true);
    });

    it("managerTrendPrediction is a Date or null", () => {
      const cruncher = new Cruncher(ctx);
      const pred = cruncher.managerTrendPrediction;
      expect(pred === null || pred instanceof Date).toBe(true);
    });
  });

  describe("prediction confidence intervals", () => {
    it("reorgPredictionCi has low and high Dates or is null", () => {
      const cruncher = new Cruncher(ctx);
      const ci = cruncher.reorgPredictionCi;
      if (ci !== null) {
        expect(ci.low).toBeInstanceOf(Date);
        expect(ci.high).toBeInstanceOf(Date);
      }
    });

    it("managerPredictionCi has low and high Dates or is null", () => {
      const cruncher = new Cruncher(ctx);
      const ci = cruncher.managerPredictionCi;
      if (ci !== null) {
        expect(ci.low).toBeInstanceOf(Date);
        expect(ci.high).toBeInstanceOf(Date);
      }
    });
  });

  describe("trendSlope", () => {
    it("returns a number or null", () => {
      const cruncher = new Cruncher(ctx);
      const slope = cruncher.trendSlope(cruncher.reorgDurations);
      expect(slope === null || typeof slope === "number").toBe(true);
    });
  });

  describe("dateCount", () => {
    it("returns a Map of formatted date strings to counts", () => {
      const cruncher = new Cruncher(ctx);
      const reorgs = OrgStructure.all(ctx).slice(1);
      const counts = cruncher.dateCount(reorgs, "yyyy");
      expect(counts).toBeInstanceOf(Map);
      expect(counts.size).toBeGreaterThan(0);
      counts.forEach((count) => expect(count).toBeGreaterThanOrEqual(1));
    });
  });

  describe("descriptiveStats extended fields", () => {
    it("includes standardDeviation, skewness, and coefficientOfVariation", () => {
      const cruncher = new Cruncher(ctx);
      const stats = cruncher.descriptiveStats([10, 20, 30, 40, 50]);
      expect(stats.standardDeviation).toBeCloseTo(15.81, 1);
      expect(stats.skewness).toBeCloseTo(0, 4);
      expect(stats.coefficientOfVariation).toBeCloseTo(0.527, 2);
    });

    it("returns null skewness for fewer than 3 data points", () => {
      const cruncher = new Cruncher(ctx);
      const stats = cruncher.descriptiveStats([10, 20]);
      expect(stats.skewness).toBeNull();
    });

    it("returns zero standardDeviation for empty array", () => {
      const cruncher = new Cruncher(ctx);
      const stats = cruncher.descriptiveStats([]);
      expect(stats.standardDeviation).toBe(0);
      expect(stats.coefficientOfVariation).toBe(0);
    });
  });

  describe("linearRegression with rSquared", () => {
    it("returns rSquared=1 for a perfect line", () => {
      const cruncher = new Cruncher(ctx);
      const result = cruncher.linearRegression(
        [0, 1, 2, 3, 4],
        [2, 4, 6, 8, 10],
      );
      expect(result).not.toBeNull();
      expect(result!.rSquared).toBeCloseTo(1.0, 2);
    });

    it("returns rSquared between 0 and 1 for noisy data", () => {
      const cruncher = new Cruncher(ctx);
      const result = cruncher.linearRegression(
        [0, 1, 2, 3, 4],
        [2, 5, 3, 8, 7],
      );
      expect(result).not.toBeNull();
      expect(result!.rSquared).toBeGreaterThanOrEqual(0);
      expect(result!.rSquared).toBeLessThanOrEqual(1);
    });
  });

  describe("kaplanMeier", () => {
    it("returns a survival curve starting at 1.0", () => {
      const cruncher = new Cruncher(ctx);
      const curve = cruncher.kaplanMeier([30, 60, 90, 120]);
      expect(curve[0]).toEqual([0, 1]);
      expect(curve.length).toBe(5);
    });

    it("ends at 0 when all events are observed", () => {
      const cruncher = new Cruncher(ctx);
      const curve = cruncher.kaplanMeier([30, 60, 90, 120]);
      expect(curve[curve.length - 1][1]).toBe(0);
    });

    it("handles duplicate times correctly", () => {
      const cruncher = new Cruncher(ctx);
      const curve = cruncher.kaplanMeier([30, 30, 60]);
      expect(curve.length).toBe(3);
      expect(curve[1][0]).toBe(30);
      expect(curve[1][1]).toBeCloseTo(1 / 3, 4);
    });

    it("returns [[0, 1]] for empty durations", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.kaplanMeier([])).toEqual([[0, 1]]);
    });
  });

  describe("kaplanMeierMedian", () => {
    it("returns the correct median survival time", () => {
      const cruncher = new Cruncher(ctx);
      const median = cruncher.kaplanMeierMedian([30, 60, 90, 120]);
      expect(median).toBe(60);
    });

    it("returns null when survival never drops below 0.5", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.kaplanMeierMedian([])).toBeNull();
    });
  });

  describe("survivalAt", () => {
    it("returns 1 at day 0", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.survivalAt([30, 60, 90], 0)).toBe(1);
    });

    it("returns 0 after the last event", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.survivalAt([30, 60, 90], 100)).toBe(0);
    });

    it("returns intermediate values within the data range", () => {
      const cruncher = new Cruncher(ctx);
      const s = cruncher.survivalAt([30, 60, 90], 45);
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(1);
    });
  });

  describe("survival curve getters", () => {
    it("reorgSurvivalCurve starts at [0, 1]", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.reorgSurvivalCurve[0]).toEqual([0, 1]);
      expect(cruncher.reorgSurvivalCurve.length).toBeGreaterThan(1);
    });

    it("managerSurvivalCurve starts at [0, 1]", () => {
      const cruncher = new Cruncher(ctx);
      expect(cruncher.managerSurvivalCurve[0]).toEqual([0, 1]);
      expect(cruncher.managerSurvivalCurve.length).toBeGreaterThan(1);
    });
  });
});
