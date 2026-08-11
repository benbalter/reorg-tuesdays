import { differenceInDays } from "date-fns";
import { parseRows, defaultCsvPath } from "./data-parser.js";
import type { CsvRow } from "./types.js";

/**
 * Central context object that holds all parsed state.
 * Constructed once, passed to all modules via constructor injection.
 * Replaces global caches and static `.all()` singletons.
 */
export class Context {
  readonly rows: CsvRow[];
  readonly orgStructureDates: Date[];
  readonly managerStints: Array<{ login: string; startDate: Date }>;
  readonly managerLogins: string[];
  readonly hubberStartDate: Date;

  constructor(csvPath?: string) {
    this.rows = parseRows(csvPath ?? defaultCsvPath());

    if (this.rows.length === 0) {
      throw new Error("No data rows found");
    }

    // Derive unique org structure dates
    const seen = new Set<number>();
    this.orgStructureDates = [];
    for (const row of this.rows) {
      const time = row.date.getTime();
      if (!seen.has(time)) {
        seen.add(time);
        this.orgStructureDates.push(row.date);
      }
    }

    // Derive manager stints (consecutive rows with same manager → one stint)
    this.managerStints = [];
    let stintStart: Date | null = null;
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      const prevRow = i > 0 ? this.rows[i - 1] : null;
      const nextRow = i + 1 < this.rows.length ? this.rows[i + 1] : null;

      if (!prevRow || prevRow.manager !== row.manager) {
        stintStart = row.date;
      }

      if (!nextRow || nextRow.manager !== row.manager) {
        this.managerStints.push({ login: row.manager, startDate: stintStart! });
      }
    }

    // Derive unique logins (preserving order)
    const seenLogins = new Set<string>();
    this.managerLogins = [];
    for (const row of this.rows) {
      if (!seenLogins.has(row.manager)) {
        seenLogins.add(row.manager);
        this.managerLogins.push(row.manager);
      }
    }

    this.hubberStartDate = this.orgStructureDates[0];
  }

  get hubberEndDate(): Date {
    return today();
  }

  get hubberTenure(): number {
    return differenceInDays(this.hubberEndDate, this.hubberStartDate);
  }

  /** Find a CSV row by column match and date */
  findRow(
    column: keyof CsvRow,
    value: string | number,
    date?: Date,
  ): CsvRow | undefined {
    return this.rows.find(
      (r) =>
        r[column] === value && (!date || r.date.getTime() === date.getTime()),
    );
  }

  /** Find first CSV row matching a column value */
  findFirstRow(
    column: keyof CsvRow,
    value: string | number,
  ): CsvRow | undefined {
    return this.rows.find((r) => r[column] === value);
  }

  /** Get all instances of an entity across CSV rows (for multi-stint duration) */
  getInstances(
    column: keyof CsvRow,
    value: string | number,
  ): Array<{ startDate: Date; endDate: Date }> {
    const result: Array<{ startDate: Date; endDate: Date }> = [];
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rows[i][column] === value) {
        const endDate =
          i + 1 < this.rows.length ? this.rows[i + 1].date : today();
        result.push({ startDate: this.rows[i].date, endDate });
      }
    }
    return result;
  }
}

/**
 * Date this tenure ended. When set, "today" is frozen to this date so the
 * analysis is preserved as a final snapshot rather than drifting forward
 * indefinitely. Set to `null` to compute against the current date instead.
 *
 * The bundled data is synthetic sample data, so this is an arbitrary date.
 */
export const END_DATE: Date | null = new Date(2024, 11, 2);

export function today(): Date {
  if (END_DATE) return END_DATE;
  return new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
}
