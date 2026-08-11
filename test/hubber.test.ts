import { Hubber } from "../src/hubber.js";
import { Context, today } from "../src/context.js";

describe("Hubber", () => {
  const ctx = new Context();

  it("returns January 5, 2015 as the start date", () => {
    const hubber = new Hubber(ctx);
    expect(hubber.startDate).toEqual(new Date(2015, 0, 5));
  });

  it("returns today as the end date", () => {
    const hubber = new Hubber(ctx);
    expect(hubber.endDate).toEqual(today());
  });

  it("returns a positive tenure", () => {
    const hubber = new Hubber(ctx);
    expect(hubber.tenure).toBeGreaterThan(0);
  });

  it("returns data as an object", () => {
    const hubber = new Hubber(ctx);
    expect(hubber.data).toBeDefined();
    expect(typeof hubber.data).toBe("object");
  });

  it("returns undefined for succeededBy", () => {
    const hubber = new Hubber(ctx);
    expect(hubber.succeededBy).toBeUndefined();
  });
});
