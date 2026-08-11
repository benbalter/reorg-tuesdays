import { TimeSpan } from "./time-span.js";
import type { CsvRow } from "./types.js";
import type { Context } from "./context.js";

/**
 * Represents an organizational structure / reorg event.
 * Unique by start date — each distinct date in the CSV is one reorg.
 */
export class OrgStructure extends TimeSpan {
  constructor(ctx: Context, startDate: string | Date) {
    super(ctx, startDate);
  }

  static all(ctx: Context): OrgStructure[] {
    return ctx.orgStructureDates.map((d) => new OrgStructure(ctx, d));
  }

  protected get uniqueValue(): string {
    return this.startDate.getTime().toString();
  }

  protected get column(): keyof CsvRow {
    return "date";
  }

  get data(): CsvRow | undefined {
    // For OrgStructure, match by date (converted to same format)
    return this.ctx.rows.find(
      (r) => r.date.getTime() === this.startDate.getTime(),
    );
  }

  get instances(): Array<{ startDate: Date; endDate: Date }> {
    // Each org structure date is unique — exactly one stint
    return [{ startDate: this.startDate, endDate: this.endDate }];
  }

  protected allInstances(): OrgStructure[] {
    return OrgStructure.all(this.ctx);
  }
}
