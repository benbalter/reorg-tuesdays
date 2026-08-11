import { TimeSpan } from "./time-span.js";
import type { CsvRow } from "./types.js";
import type { Context } from "./context.js";

/**
 * Represents a manager and their tenure.
 * Unique by login — duration sums across all non-contiguous stints.
 */
export class Manager extends TimeSpan {
  readonly login: string;

  constructor(ctx: Context, login: string, startDate?: string | Date) {
    super(ctx, startDate);
    this.login = login;
  }

  /** All unique manager logins from the CSV */
  static logins(ctx: Context): string[] {
    return ctx.managerLogins;
  }

  /** Build all Manager instances from pre-computed stints */
  static all(ctx: Context): Manager[] {
    return ctx.managerStints.map(
      (stint) => new Manager(ctx, stint.login, stint.startDate),
    );
  }

  get tenure(): number {
    return this.duration;
  }

  /** Override: for a Manager, manager is self */
  get manager(): string {
    return this.login;
  }

  /** Look up data, falling back to first row matching login if no startDate */
  get data(): CsvRow | undefined {
    if (this.rawDate) {
      return super.data;
    }
    return this.ctx.findFirstRow("manager", this.login);
  }

  /** Override startDate to fall back to CSV data if not set */
  get startDate(): Date {
    if (this.rawDate) return super.startDate;
    const row = this.ctx.findFirstRow("manager", this.login);
    if (!row) throw new Error(`No CSV data found for manager ${this.login}`);
    return row.date;
  }

  protected get uniqueValue(): string {
    return this.login;
  }

  protected get column(): keyof CsvRow {
    return "manager";
  }

  protected allInstances(): Manager[] {
    return Manager.all(this.ctx);
  }
}
