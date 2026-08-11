import { Manager } from "../src/manager.js";
import { Context } from "../src/context.js";

describe("Manager", () => {
  const ctx = new Context();

  it("stores the login correctly", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.login).toBe("@linus");
  });

  it("returns @linus as the manager from data", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.data?.manager).toBe("@linus");
  });

  it("returns November 2, 2015 as the start date", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.startDate).toEqual(new Date(2015, 10, 2));
  });

  it("returns December 1, 2016 as the end date", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.endDate).toEqual(new Date(2016, 11, 1));
  });

  it("returns a duration of 395 days", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.duration).toBe(395);
  });

  it("is preceded by @grace", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.precededBy?.login).toBe("@grace");
  });

  it("is succeeded by @margaret", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.succeededBy?.login).toBe("@margaret");
  });

  it("equals another Manager with the same login and start date", () => {
    const subject = Manager.all(ctx)[2];
    const other = new Manager(ctx, "@linus", new Date(2015, 10, 2));
    expect(subject.equals(other)).toBe(true);
  });

  it("returns self login for the manager property", () => {
    const subject = Manager.all(ctx)[2];
    expect(subject.manager).toBe("@linus");
  });

  it("returns 13 unique logins with @ada first", () => {
    const logins = Manager.logins(ctx);
    expect(logins).toHaveLength(13);
    expect(logins[0]).toBe("@ada");
  });

  it("returns 15 manager instances with @ada first", () => {
    const all = Manager.all(ctx);
    expect(all).toHaveLength(15);
    expect(all[0].login).toBe("@ada");
  });
});
