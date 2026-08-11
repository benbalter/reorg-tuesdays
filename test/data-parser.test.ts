import { parseRows, rootDir, defaultCsvPath } from "../src/data-parser.js";

describe("rootDir", () => {
  it("returns a valid path", () => {
    const dir = rootDir();
    expect(dir).toBeTruthy();
    expect(dir).toContain("reorg-tuesdays");
  });
});

describe("defaultCsvPath", () => {
  it("returns a path ending in managers.csv", () => {
    expect(defaultCsvPath()).toMatch(/managers\.csv$/);
  });
});

describe("parseRows", () => {
  it("returns an array of CsvRow objects", () => {
    const rows = parseRows(defaultCsvPath());
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("has the correct number of rows", () => {
    const rows = parseRows(defaultCsvPath());
    expect(rows).toHaveLength(27);
  });

  it("parses the first row correctly", () => {
    const first = parseRows(defaultCsvPath())[0];
    expect(first.manager).toBe("@ada");
    expect(first.stepmanager).toBe("N/A");
    expect(first.duration).toBe("5 months");
    expect(first.rung).toBe(2);
    expect(first.notes).toBe("Joined Acme with a flat org structure");
  });

  it("parses dates as local dates", () => {
    const first = parseRows(defaultCsvPath())[0];
    expect(first.date.getFullYear()).toBe(2015);
    expect(first.date.getMonth()).toBe(0);
    expect(first.date.getDate()).toBe(5);
  });

  it("parses rung as a number", () => {
    for (const row of parseRows(defaultCsvPath())) {
      expect(typeof row.rung).toBe("number");
      expect(Number.isNaN(row.rung)).toBe(false);
    }
  });

  it("returns a fresh array on each call (no caching)", () => {
    const first = parseRows(defaultCsvPath());
    const second = parseRows(defaultCsvPath());
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });
});
