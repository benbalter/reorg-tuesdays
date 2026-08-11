import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "csv-stringify/sync";
import { OrgStructure } from "./org-structure.js";
import { formatDurationForCsv } from "./stat-writer.js";
import type { Context } from "./context.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class CsvWriter {
  constructor(private ctx: Context) {}

  get path(): string {
    return resolve(__dirname, "..", "managers.csv");
  }

  get body(): string {
    const structures = OrgStructure.all(this.ctx);
    const firstHash = structures[0].toHash(formatDurationForCsv);
    const headers = Object.keys(firstHash);

    const rows = structures.map((os) => {
      const h = os.toHash(formatDurationForCsv);
      return headers.map((key) => h[key]?.toString() ?? "");
    });

    return stringify([headers, ...rows]);
  }

  write(): void {
    writeFileSync(this.path, this.body);
  }
}
