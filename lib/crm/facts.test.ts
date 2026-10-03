/**
 * The facts are the platform's own rules applied per person. These pin the ones
 * sales acts on: grandfathering, consent, the course, the path, and access.
 */
import { describe, expect, test } from "bun:test";
import { isFreeMailAddress } from "@/lib/auth/free-mail";
import type { DotState } from "@/lib/compliance/journey-position";
import type { JourneyEntry } from "@/lib/durchgang";
import { type CloseUserRow, closeFactsFor } from "./facts";

const row = (over: Partial<CloseUserRow> = {}): CloseUserRow => ({
  userId: "u1",
  email: "jane@muster.example",
  createdAt: new Date("2026-09-01T10:00:00Z"),
  emailVerifiedAt: new Date("2026-09-01T10:05:00Z"),
  lastLoginAt: null,
  loginCount: 1,
  grandfatheredAt: null,
  emailFollowupsDisabled: false,
  companyId: "c1",
  company: {
    name: "Muster GmbH",
    sector: "waste",
    employeeCount: 80,
    country: "DE",
    actsAsSupplier: false,
  },
  accessLevel: "free",
  ...over,
});

const context = (over: Partial<Parameters<typeof closeFactsFor>[0]> = {}) =>
  closeFactsFor({
    optedOutUserIds: new Set(),
    ceoLessonIds: ["1.1", "1.2", "2.1", "2.2"],
    ceoProgress: [],
    paths: new Map(),
    launched: true,
    ...over,
  });

describe("closeFactsFor", () => {
  test("grandfathered follows the billing rule: stamped after launch, got-in before it", () => {
    expect(context()(row()).grandfathered).toBe(false);
    expect(context()(row({ grandfatheredAt: new Date() })).grandfathered).toBe(true);
    expect(context({ launched: false })(row()).grandfathered).toBe(true);
  });

  test("may email is off after unsubscribing, either way", () => {
    expect(context()(row()).mayEmail).toBe(true);
    expect(context()(row({ emailFollowupsDisabled: true })).mayEmail).toBe(false);
    expect(context({ optedOutUserIds: new Set(["u1"]) })(row()).mayEmail).toBe(false);
  });

  test("the CEO course counts completed lessons and dates the finish like the certificate", () => {
    const lesson = (lessonId: string, day: number) => ({
      userId: "u1",
      lessonId,
      completed: true,
      completedAt: new Date(Date.UTC(2026, 8, day)),
    });
    const partly = context({ ceoProgress: [lesson("1.1", 2), lesson("1.2", 3)] })(row());
    expect(partly.ceoCourse).toEqual({ done: 2, total: 4, completedAt: null });

    const all = ["1.1", "1.2", "2.1", "2.2"].map((id, i) => lesson(id, 2 + i));
    const finished = context({ ceoProgress: all })(row());
    expect(finished.ceoCourse).toEqual({
      done: 4,
      total: 4,
      completedAt: new Date(Date.UTC(2026, 8, 5)),
    });
    // Someone else's progress is not this person's.
    expect(context({ ceoProgress: all })(row({ userId: "u2" })).ceoCourse.done).toBe(0);
  });

  test("a finished course with no recorded date shows no date, not 1970", () => {
    const undated = ["1.1", "1.2", "2.1", "2.2"].map((lessonId) => ({
      userId: "u1",
      lessonId,
      completed: true,
      completedAt: null,
    }));
    expect(context({ ceoProgress: undated })(row()).ceoCourse).toEqual({
      done: 4,
      total: 4,
      completedAt: null,
    });
  });

  test("the path is the open company's NIS 2 progress", () => {
    const entry = (state: DotState): JourneyEntry => ({ state, coveredBy: null });
    const paths = new Map([
      [
        "c1",
        new Map([
          ["12.1", entry("signed")],
          ["12.2", entry("todo")],
        ]),
      ],
      ["c2", new Map([["12.1", entry("signed")]])],
    ]);
    expect(context({ paths })(row()).path).toEqual({ done: 1, total: 2 });
    expect(context({ paths })(row({ companyId: null, company: null })).path).toBeNull();
  });

  test("access lifts a free account to grandfathered for a stamped person, as the session does", () => {
    expect(context()(row()).access).toBe("free");
    expect(context()(row({ grandfatheredAt: new Date() })).access).toBe("grandfathered");
    expect(context()(row({ accessLevel: "full" })).access).toBe("full");
    expect(context()(row({ accessLevel: null })).access).toBeNull();
  });

  test("without a membership or a billing account there is no open company, as in the session", () => {
    const noBilling = context()(row({ accessLevel: null }));
    expect(noBilling.company).toBeNull();
    const noMembership = context()(row({ companyId: null, company: null }));
    expect(noMembership.company).toBeNull();
    expect(noMembership.access).toBeNull();
  });
});

describe("isFreeMailAddress", () => {
  test("tells a free mail provider from a company domain, whatever the case", () => {
    expect(isFreeMailAddress("Jane@GMX.de")).toBe(true);
    expect(isFreeMailAddress("jane@gmail.com")).toBe(true);
    expect(isFreeMailAddress("jane@muster-gmbh.de")).toBe(false);
    expect(isFreeMailAddress("jane@mail.gmail.com.example")).toBe(false);
  });
});
