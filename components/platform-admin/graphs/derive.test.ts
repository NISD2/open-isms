import { describe, expect, test } from "bun:test";
import type { UserFact } from "@/lib/platform-admin/growth";
import {
  pageOf,
  signupDaysByCourse,
  signupPageBars,
  signupSourceBars,
  signupsByPage,
} from "./derive";

const user = (overrides: Partial<UserFact>): UserFact => ({
  signupDay: "2026-03-01",
  verified: true,
  disposable: false,
  locale: "de",
  fromPath: null,
  utmSource: null,
  utmCampaign: null,
  inOrg: true,
  activatedDay: null,
  activeDays: [],
  workEvents: 0,
  complianceEvents: 0,
  signOffs: 0,
  coursesStarted: [],
  coursesFinished: [],
  ...overrides,
});

describe("signupDaysByCourse", () => {
  test("splits by whether the CEO course was opened, on the registration day", () => {
    const { course, platformOnly } = signupDaysByCourse(
      [
        user({ signupDay: "2026-03-01", coursesStarted: ["nis2-ceo"] }),
        user({ signupDay: "2026-03-01", coursesStarted: ["nis2-ceo", "cra-sbom"] }),
        user({ signupDay: "2026-03-01" }),
        user({ signupDay: "2026-03-02", coursesStarted: ["cra-sbom"] }),
      ],
      "nis2-ceo",
    );
    expect(Object.fromEntries(course)).toEqual({ "2026-03-01": 2 });
    expect(Object.fromEntries(platformOnly)).toEqual({
      "2026-03-01": 1,
      "2026-03-02": 1,
    });
  });

  test("an unverified address still counts as a registration", () => {
    const { platformOnly } = signupDaysByCourse([user({ verified: false })], "nis2-ceo");
    expect(platformOnly.get("2026-03-01")).toBe(1);
  });

  test("disposable-address signups are left out of both sides", () => {
    const { course, platformOnly } = signupDaysByCourse(
      [
        user({ disposable: true, coursesStarted: ["nis2-ceo"] }),
        user({ disposable: true }),
      ],
      "nis2-ceo",
    );
    expect(course.size + platformOnly.size).toBe(0);
  });
});

describe("signup origin", () => {
  test("pageOf drops the locale prefix and nothing else", () => {
    expect(pageOf("/en/wiki/nis2-timeline")).toBe("/wiki/nis2-timeline");
    expect(pageOf("/DE/preise")).toBe("/preise");
    expect(pageOf("/en")).toBe("/");
    expect(pageOf("/wiki/nis2-timeline")).toBe("/wiki/nis2-timeline");
    expect(pageOf("/")).toBe("/");
  });

  test("counts the same page across locales and skips disposable and unrecorded signups", () => {
    const counts = signupsByPage([
      user({ fromPath: "/en/pricing" }),
      user({ fromPath: "/de/pricing" }),
      user({ fromPath: "/en/pricing", disposable: true }),
      user({ fromPath: null }),
    ]);
    expect([...counts]).toEqual([["/pricing", 2]]);
  });

  test("bars name the gaps: no record, and a page without a campaign tag", () => {
    const users = [
      user({ fromPath: "/en/pricing", utmSource: "google" }),
      user({ fromPath: "/en/wiki/x" }),
      user({ fromPath: null }),
    ];
    expect(signupPageBars(users).map((b) => b.label)).toEqual(
      expect.arrayContaining(["/pricing", "/wiki/x", "Not recorded"]),
    );
    expect(signupSourceBars(users).map((b) => [b.label, b.value])).toEqual(
      expect.arrayContaining([
        ["google", 1],
        ["No campaign tag", 1],
        ["Not recorded", 1],
      ]),
    );
  });
});
