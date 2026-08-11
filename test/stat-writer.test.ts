import { StatWriter } from "../src/stat-writer.js";
import { OrgStructure } from "../src/org-structure.js";
import { Context, today } from "../src/context.js";

const ctx = new Context();

describe("StatWriter", () => {
  describe("humanDateDiff with days", () => {
    const writer = new StatWriter(ctx);

    it('returns "0 days" for 0', () => {
      expect(writer.humanDateDiff(0)).toBe("0 days");
    });

    it('returns "1 day" for 1', () => {
      expect(writer.humanDateDiff(1)).toBe("1 day");
    });

    it('returns "1 week" for 7', () => {
      expect(writer.humanDateDiff(7)).toBe("1 week");
    });

    it('returns "2 weeks" for 14', () => {
      expect(writer.humanDateDiff(14)).toBe("2 weeks");
    });

    it('returns "4 weeks, and 2 days" for 30', () => {
      expect(writer.humanDateDiff(30)).toBe("4 weeks, and 2 days");
    });

    it('contains "months" for 365', () => {
      const result = writer.humanDateDiff(365);
      expect(result).toContain("months");
    });

    it('contains "year" and "month" for 400', () => {
      const result = writer.humanDateDiff(400);
      expect(result).toContain("year");
      expect(result).toContain("month");
    });
  });

  describe("humanDateDiff with Date", () => {
    const writer = new StatWriter(ctx);

    it('returns "0 days" for today', () => {
      expect(writer.humanDateDiff(today())).toBe("0 days");
    });

    it("returns a duration string for 7 days ago", () => {
      const sevenDaysAgo = new Date(today());
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const result = writer.humanDateDiff(sevenDaysAgo);
      expect(result).toMatch(/\d+ (days?|week)/);
    });
  });

  describe("trendDescription", () => {
    const writer = new StatWriter(ctx);

    it('returns "Not enough data" for null', () => {
      expect(writer.trendDescription(null)).toBe("Not enough data");
    });

    it('returns "Stable" for 0', () => {
      expect(writer.trendDescription(0)).toBe("Stable");
    });

    it('returns "Stable" for 3', () => {
      expect(writer.trendDescription(3)).toBe("Stable");
    });

    it('returns "Stable" for -3', () => {
      expect(writer.trendDescription(-3)).toBe("Stable");
    });

    it('contains "Getting less frequent" for 10', () => {
      expect(writer.trendDescription(10)).toContain("Getting less frequent");
    });

    it('contains "Getting more frequent" for -10', () => {
      expect(writer.trendDescription(-10)).toContain("Getting more frequent");
    });
  });

  describe("timeTrendDescription", () => {
    const writer = new StatWriter(ctx);

    it('returns "Not enough data" for null', () => {
      expect(writer.timeTrendDescription(null)).toBe("Not enough data");
    });

    it('returns "Stable" for 0', () => {
      expect(writer.timeTrendDescription(0)).toBe("Stable");
    });

    it('returns "Stable" for 5', () => {
      expect(writer.timeTrendDescription(5)).toBe("Stable");
    });

    it('contains "Decelerating" for 15', () => {
      expect(writer.timeTrendDescription(15)).toContain("Decelerating");
    });

    it('contains "Accelerating" for -15', () => {
      expect(writer.timeTrendDescription(-15)).toContain("Accelerating");
    });
  });

  describe("body", () => {
    it("contains expected sections", () => {
      const writer = new StatWriter(ctx);
      const body = writer.body;

      expect(body).toContain("# Reorg Tuesday");
      expect(body).toContain("## Reorgs");
      expect(body).toContain("## Managers");
      expect(body).toContain("### Reorg probability");
      expect(body).toContain("### Most popular");
      expect(body).toContain("*");
    });
  });

  describe("graph", () => {
    it("renders graph with expected characters", () => {
      const writer = new StatWriter(ctx);
      const orgStructures = OrgStructure.all(ctx);
      const output = writer.graph(orgStructures);

      expect(output).toContain("*");
      expect(output).toContain("|");
      expect(output).toMatch(/\d{4}/);
    });
  });
});
