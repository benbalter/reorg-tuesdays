import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import type { CsvRow } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REQUIRED_COLUMNS = [
  "date",
  "manager",
  "stepmanager",
  "duration",
  "rung",
  "notes",
];

export function rootDir(): string {
  return resolve(__dirname, "..");
}

export function defaultCsvPath(): string {
  return resolve(rootDir(), "managers.csv");
}

/**
 * Parse a CSV file into CsvRow[].
 * Pure function — no global state or caching.
 */
export function parseRows(filePath?: string): CsvRow[] {
  const path = filePath ?? defaultCsvPath();
  let content: string;
  try {
    content = readFileSync(path, "utf-8");
  } catch (err) {
    throw new Error(
      `Cannot read CSV file at ${path}: ${(err as Error).message}`,
      { cause: err },
    );
  }

  const records: Record<string, string>[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    throw new Error(`CSV file at ${path} contains no data rows`);
  }

  const columns = Object.keys(records[0]);
  for (const col of REQUIRED_COLUMNS) {
    if (!columns.includes(col)) {
      throw new Error(`CSV file at ${path} is missing required column: ${col}`);
    }
  }

  return records.map((record, i) => {
    const match = record.date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) {
      throw new Error(`Invalid date "${record.date}" in CSV row ${i + 1}`);
    }
    // Parse as local date (not UTC) to avoid timezone shifts
    const [, year, month, day] = match.map(Number);
    return {
      date: new Date(year, month - 1, day),
      manager: record.manager.trim(),
      stepmanager: record.stepmanager.trim(),
      duration: record.duration.trim(),
      rung: parseInt(record.rung, 10),
      notes: record.notes.trim(),
    };
  });
}
