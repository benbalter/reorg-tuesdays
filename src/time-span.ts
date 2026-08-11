import { differenceInDays, format } from "date-fns";
import type { CsvRow } from "./types.js";
import type { Context } from "./context.js";

/** Parse a "YYYY-MM-DD" string as a local date (not UTC) */
function parseLocalDate(dateStr: string): Date {
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(dateStr);
}

/**
 * Base class for time-bounded events (org structures and managers).
 * Durations are represented as integer days throughout.
 */
export abstract class TimeSpan {
  readonly rawDate: string | undefined;
  readonly ctx: Context;
  private _startDate: Date | undefined;
  private _endDate: Date | undefined;

  constructor(
    ctx: Context,
    startDate?: string | Date,
    endDate?: string | Date,
  ) {
    this.ctx = ctx;
    if (startDate instanceof Date) {
      this._startDate = startDate;
      this.rawDate = format(startDate, "yyyy-MM-dd");
    } else {
      this.rawDate = startDate;
    }
    if (endDate) {
      this._endDate =
        endDate instanceof Date ? endDate : parseLocalDate(endDate.toString());
    }
  }

  get startDate(): Date {
    if (this._startDate) return this._startDate;
    if (!this.rawDate) {
      throw new Error(`${this.constructor.name} has no startDate`);
    }
    this._startDate = parseLocalDate(this.rawDate);
    return this._startDate;
  }

  get endDate(): Date {
    if (this._endDate) return this._endDate;
    const next = this.succeededBy;
    return next?.startDate ?? this.ctx.hubberEndDate;
  }

  /** Total duration in days across all stints of the same entity */
  get duration(): number {
    return this.instances.reduce((sum, inst) => {
      return sum + differenceInDays(inst.endDate, inst.startDate);
    }, 0);
  }

  /** Duration of just this one stint in days */
  get stintDuration(): number {
    return differenceInDays(this.endDate, this.startDate);
  }

  /** Days from hubber start date to this event's start */
  get daysIntoTenure(): number {
    return differenceInDays(this.startDate, this.ctx.hubberStartDate);
  }

  /** Fraction of total tenure elapsed when this event started */
  get percentIntoTenure(): number {
    return this.daysIntoTenure / this.ctx.hubberTenure;
  }

  /** Previous item in the class's all() list */
  get precededBy(): this | undefined {
    const all = this.allInstances();
    const idx = this.indexOf();
    return idx > 0 ? (all[idx - 1] as this) : undefined;
  }

  /** Next item in the class's all() list */
  get succeededBy(): this | undefined {
    const all = this.allInstances();
    const idx = this.indexOf();
    return idx >= 0 && idx < all.length - 1
      ? (all[idx + 1] as this)
      : undefined;
  }

  /** Look up the matching CSV row */
  get data(): CsvRow | undefined {
    return this.ctx.findRow(this.column, this.uniqueValue, this.startDate);
  }

  /** Return the manager login from the CSV row */
  get manager(): string | undefined {
    return this.data?.manager;
  }

  /** Return the stepmanager login from the CSV row */
  get stepmanager(): string | undefined {
    return this.data?.stepmanager;
  }

  /** Convert to a plain object for CSV export */
  toHash(
    formatDuration: (days: number) => string,
  ): Record<string, string | number> {
    const d = this.data;
    if (!d) return {};
    return {
      date: format(this.startDate, "yyyy-MM-dd"),
      manager: d.manager,
      stepmanager: d.stepmanager,
      duration: formatDuration(this.duration),
      rung: d.rung,
      notes: d.notes,
    };
  }

  /** All instances of this entity across CSV rows (for multi-stint duration) */
  get instances(): Array<{ startDate: Date; endDate: Date }> {
    return this.ctx.getInstances(this.column, this.uniqueValue);
  }

  /** Equality check */
  equals(other: TimeSpan): boolean {
    if (this.constructor !== other.constructor) return false;
    try {
      if (this.startDate.getTime() !== other.startDate.getTime()) {
        return false;
      }
    } catch {
      // If either has no startDate, fall through to uniqueValue comparison
    }
    return this.uniqueValue === other.uniqueValue;
  }

  /** The value that uniquely identifies this entity */
  protected abstract get uniqueValue(): string;

  /** The CSV column to match against */
  protected abstract get column(): keyof CsvRow;

  /** Get all instances for navigation */
  protected abstract allInstances(): TimeSpan[];

  private indexOf(): number {
    const all = this.allInstances();
    return all.findIndex((item) => item.equals(this));
  }
}
