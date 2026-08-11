import { OrgStructure } from "../src/org-structure.js";
import { Context } from "../src/context.js";

describe("OrgStructure", () => {
  const ctx = new Context();

  it("stores the raw date correctly", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.rawDate).toBe("2015-11-02");
  });

  it("returns November 2, 2015 as the start date", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.startDate).toEqual(new Date(2015, 10, 2));
  });

  it("returns March 1, 2016 as the end date", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.endDate).toEqual(new Date(2016, 2, 1));
  });

  it("returns a duration of 120 days", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.duration).toBe(120);
  });

  it("is preceded by the org structure starting June 1, 2015", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.precededBy?.startDate).toEqual(new Date(2015, 5, 1));
  });

  it("is succeeded by the org structure starting March 1, 2016", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.succeededBy?.startDate).toEqual(new Date(2016, 2, 1));
  });

  it("returns @linus as the manager from data", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.data?.manager).toBe("@linus");
  });

  it("returns 301 daysIntoTenure from January 5, 2015", () => {
    const subject = OrgStructure.all(ctx)[2];
    expect(subject.daysIntoTenure).toBe(301);
  });

  it("equals another OrgStructure with the same date", () => {
    const subject = OrgStructure.all(ctx)[2];
    const other = new OrgStructure(ctx, new Date(2015, 10, 2));
    expect(subject.equals(other)).toBe(true);
  });
});
