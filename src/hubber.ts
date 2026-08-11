import type { CsvRow } from "./types.js";
import type { Context } from "./context.js";
import { OrgStructure } from "./org-structure.js";

/**
 * Represents the tracked person's overall tenure at the company.
 */
export class Hubber {
  constructor(private ctx: Context) {}

  get startDate(): Date {
    return this.ctx.hubberStartDate;
  }

  get endDate(): Date {
    return this.ctx.hubberEndDate;
  }

  /** Total tenure in days */
  get tenure(): number {
    return this.ctx.hubberTenure;
  }

  /** Alias for tenure */
  get duration(): number {
    return this.tenure;
  }

  get data(): CsvRow | undefined {
    const all = OrgStructure.all(this.ctx);
    return all[all.length - 1].data;
  }

  get succeededBy(): undefined {
    return undefined;
  }
}
