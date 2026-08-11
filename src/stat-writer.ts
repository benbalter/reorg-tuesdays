import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  format,
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  addYears,
  addMonths,
  addWeeks,
  isBefore,
} from "date-fns";
import ejs from "ejs";
import { Cruncher } from "./cruncher.js";
import { OrgStructure } from "./org-structure.js";
import { Manager } from "./manager.js";
import { Context, today } from "./context.js";
import type { TimeSpan } from "./time-span.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIDTH = 90;

export class StatWriter {
  private cruncher: Cruncher;
  private ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
    this.cruncher = new Cruncher(ctx);
  }

  write(): void {
    const outputPath = resolve(__dirname, "..", "README.md");
    writeFileSync(outputPath, this.body);
  }

  get body(): string {
    const templatePath = resolve(__dirname, "README.md.ejs");
    const template = readFileSync(templatePath, "utf-8");

    return ejs.render(template, this.templateData(), {
      rmWhitespace: false,
    });
  }

  // --- Formatting helpers ---

  /**
   * Format a duration (in days) or a Date into human-readable text.
   * E.g., "1 year, 2 months, 3 weeks, and 4 days"
   */
  humanDateDiff(daysOrDate: number | Date): string {
    let totalDays: number;
    if (daysOrDate instanceof Date) {
      totalDays = Math.abs(differenceInDays(today(), daysOrDate));
    } else {
      totalDays = Math.abs(Math.round(daysOrDate));
    }
    return humanizeDays(totalDays);
  }

  trendDescription(slope: number | null): string {
    if (slope === null) return "Not enough data";
    if (slope < -5)
      return `Getting more frequent (${Math.abs(slope)} fewer days per cycle)`;
    if (slope > 5)
      return `Getting less frequent (${Math.abs(slope)} more days per cycle)`;
    return "Stable";
  }

  timeTrendDescription(slope: number | null): string {
    if (slope === null) return "Not enough data";
    if (slope < -10) return `Accelerating (${Math.abs(slope)} fewer days/year)`;
    if (slope > 10) return `Decelerating (${Math.abs(slope)} more days/year)`;
    return "Stable";
  }

  // --- Graph ---

  graph(timeSpans: TimeSpan[]): string {
    const pts = this.points(timeSpans);
    let output = pts.join("") + "\n";
    output += "|" + "-".repeat(WIDTH) + "|\n";
    output += this.yearLabels();
    return output;
  }

  private points(timeSpans: TimeSpan[]): string[] {
    const pts = new Array(WIDTH).fill(" ");

    for (const ts of timeSpans) {
      const pos = Math.round(WIDTH * ts.percentIntoTenure);
      if (pos + 1 >= 0 && pos + 1 < WIDTH) {
        pts[pos + 1] = "*";
      }
    }
    return pts;
  }

  private yearLabels(): string {
    const pts: (string | number)[] = new Array(WIDTH).fill(" ");
    const hubberStart = this.ctx.hubberStartDate;
    const hubberTenure = this.ctx.hubberTenure;

    const startYear = hubberStart.getFullYear();
    const endYear = this.ctx.hubberEndDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const yearDate = new Date(year, 0, 1);
      let pos = Math.round(
        WIDTH * (differenceInDays(yearDate, hubberStart) / hubberTenure),
      );
      if (pos < 0) pos = 0;
      if (pos + 1 < WIDTH) {
        pts[pos + 1] = year;
        // Clear following positions like Ruby does
        for (let i = 0; i < 4 && pos + i + 2 < WIDTH; i++) {
          pts[pos + i + 2] = "";
        }
      }
    }

    return pts.join("") + "\n";
  }

  private templateData() {
    const c = this.cruncher;
    const orgStructures = OrgStructure.all(this.ctx);
    const managers = Manager.all(this.ctx);

    return {
      // Helpers
      humanDateDiff: this.humanDateDiff.bind(this),
      trendDescription: this.trendDescription.bind(this),
      timeTrendDescription: this.timeTrendDescription.bind(this),
      graph: this.graph.bind(this),
      formatDate: (d: Date) => format(d, "yyyy-MM-dd"),
      today: today(),
      isBefore,
      round: (n: number, digits: number = 1) =>
        Math.round(n * 10 ** digits) / 10 ** digits,

      // Data
      orgStructures,
      managers,
      tenure: c.tenure,

      // Reorg stats
      reorgStats: c.reorgStats,
      reorgPredictions: c.reorgPredictions,
      reorgRate: c.reorgRate,
      reorgRollingRate: c.reorgRollingRate,
      daysSinceLastReorg: c.daysSinceLastReorg,
      reorgOverdue: c.reorgOverdue,
      reorgPercentile: c.reorgPercentile,
      reorgLongestStreak: c.reorgLongestStreak,
      reorgTrend: c.reorgTrend,
      reorgTimeWeightedTrend: c.reorgTimeWeightedTrend,
      reorgProbabilities: c.reorgProbabilities,
      reorgDurations: c.reorgDurations,
      weightedReorgPrediction: c.weightedReorgPrediction,
      reorgTrendPrediction: c.reorgTrendPrediction,
      reorgPredictionCi: c.reorgPredictionCi,
      reorgSurvivalCurve: c.reorgSurvivalCurve,
      reorgTrendRegression: c.linearRegression(
        Array.from({ length: c.reorgDurations.length }, (_, i) => i),
        c.reorgDurations,
      ),
      frequencyByQuarter: c.frequencyByQuarter.bind(c),
      dateCount: c.dateCount.bind(c),
      weightedAverageDuration: c.weightedAverageDuration.bind(c),
      histogram: c.histogram.bind(c),

      // Reorg advanced
      reorgDistFit: c.reorgDistributionFit,
      reorgBootstrapMean: c.reorgBootstrapMean,
      reorgBootstrapMedian: c.reorgBootstrapMedian,
      reorgMonteCarlo: c.reorgMonteCarlo,
      reorgHazard: c.reorgHazardFunction,
      reorgChangepoints: c.reorgChangepoints,
      reorgEntropy: c.reorgEntropy,
      reorgAutocorrelation: c.reorgAutocorrelation,
      reorgPoisson: c.reorgPoissonTest,
      reorgRisk: c.reorgRiskScore,
      reorgEnsemble: c.reorgForecastEnsemble,

      // Manager stats
      managerStats: c.managerStats,
      managerPredictions: c.managerPredictions,
      managerChurnRate: c.managerChurnRate,
      managerRollingRate: c.managerRollingRate,
      daysSinceLastManagerChange: c.daysSinceLastManagerChange,
      managerOverdue: c.managerOverdue,
      managerPercentile: c.managerPercentile,
      managerLongestStreak: c.managerLongestStreak,
      managerTrend: c.managerTrend,
      managerTimeWeightedTrend: c.managerTimeWeightedTrend,
      managerProbabilities: c.managerProbabilities,
      managerDurations: c.managerDurations,
      weightedManagerPrediction: c.weightedManagerPrediction,
      managerTrendPrediction: c.managerTrendPrediction,
      managerPredictionCi: c.managerPredictionCi,
      managerSurvivalCurve: c.managerSurvivalCurve,
      managerTrendRegression: c.linearRegression(
        Array.from({ length: c.managerDurations.length }, (_, i) => i),
        c.managerDurations,
      ),

      // Manager advanced
      managerDistFit: c.managerDistributionFit,
      managerBootstrapMean: c.managerBootstrapMean,
      managerBootstrapMedian: c.managerBootstrapMedian,
      managerMonteCarlo: c.managerMonteCarlo,
      managerHazard: c.managerHazardFunction,
      managerChangepoints: c.managerChangepoints,
      managerEntropy: c.managerEntropy,
      managerAutocorrelation: c.managerAutocorrelation,
      managerPoisson: c.managerPoissonTest,
      managerRisk: c.managerRiskScore,
      managerEnsemble: c.managerForecastEnsemble,
    };
  }
}

// --- Duration humanizer ---

/**
 * Converts a number of days to human-readable "X years, Y months, Z weeks, and W days".
 * Mimics Ruby's dotiw gem: highest_measure_only per unit, accumulate_on months.
 */
function humanizeDays(totalDays: number): string {
  if (totalDays === 0) return "0 days";

  // Use a reference-based approach to get years, months, weeks, days
  const refDate = new Date(2000, 0, 1); // fixed reference
  const endDate = addDaysToDate(refDate, totalDays);

  const years = differenceInYears(endDate, refDate);
  let remaining = addYears(refDate, years);

  const months = differenceInMonths(endDate, remaining);
  remaining = addMonths(remaining, months);

  const weeks = differenceInWeeks(endDate, remaining);
  remaining = addWeeks(remaining, weeks);

  const days = differenceInDays(endDate, remaining);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (weeks > 0) parts.push(`${weeks} ${weeks === 1 ? "week" : "weeks"}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);

  if (parts.length === 0) return "0 days";
  if (parts.length === 1) return parts[0];

  // Join with commas and "and" before last
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Format a duration in days using dotiw-style highest_measure_only per unit */
export function formatDurationForCsv(days: number): string {
  return humanizeDays(days);
}
