import { describe, expect, test } from "bun:test";
import type { UserFact } from "@/lib/platform-admin/growth";
import { signupDaysByCourse } from "./derive";

const user = (overrides: Partial<UserFact>): UserFact => ({
  signupDay: "2026-03-01",
  verified: true,
  disposable: false,
  locale: "de",
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
