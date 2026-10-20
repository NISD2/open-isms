import { describe, expect, test } from "bun:test";
import type { GrowthData, UserFact } from "@/lib/platform-admin/growth";
import { summarize } from "./stats";

const user = (over: Partial<UserFact>): UserFact => ({
  signupDay: "2026-10-10",
  verified: true,
  disposable: false,
  locale: "de",
  fromPath: "/",
  utmSource: null,
  utmCampaign: null,
  inOrg: true,
  activatedDay: "2026-10-10",
  activeDays: ["2026-10-10"],
  workEvents: 1,
  complianceEvents: 0,
  signOffs: 0,
  coursesStarted: [],
  coursesFinished: [],
  ...over,
});

const growth = (users: UserFact[]): GrowthData => ({
  users,
  companies: [],
  lessons: [],
  work: [],
  activity: [],
  leads: [],
  emails: [],
  courseLessonCounts: { "nis2-ceo": 47, "nis2-tabletop": 5, "cra-sbom": 10 },
});

describe("usage funnel", () => {
  test("counts only people who signed up in the range, and each step as a share of them", () => {
    const out = summarize(
      growth([
        user({
          signOffs: 2,
          complianceEvents: 3,
          activeDays: ["2026-10-10", "2026-10-12"],
        }),
        user({ verified: false, inOrg: false, activatedDay: null, workEvents: 0 }),
        user({ signupDay: "2026-09-01" }),
      ]),
      { fromDay: "2026-10-01", toDay: "2026-10-31" },
    );
    const by = Object.fromEntries(out.funnel.map((s) => [s.step, s]));
    expect(by["signed up"]?.people).toBe(2);
    expect(by["verified the address"]?.people).toBe(1);
    expect(by["company activated"]?.ofSignups).toBe(50);
    expect(by["signed off a requirement"]?.people).toBe(1);
    expect(by["came back on another day"]?.people).toBe(1);
  });

  test("an empty range has no shares rather than a division by zero", () => {
    const out = summarize(growth([]), { fromDay: "2026-10-01", toDay: "2026-10-02" });
    expect(out.funnel.every((s) => s.people === 0 && s.ofSignups === null)).toBe(true);
  });
});
