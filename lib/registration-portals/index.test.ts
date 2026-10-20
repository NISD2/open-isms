import { expect, test } from "bun:test";
import { berlinDay, deadlineState, type RegistrationPortal } from "./index";

const portal = (overrides: Partial<RegistrationPortal>): RegistrationPortal => ({
  countryCode: "DE",
  authority: "BSI",
  authorityUrl: null,
  portalName: null,
  portalUrl: null,
  status: "operational",
  registrationDeadline: "2026-03-06",
  nationalLaw: null,
  entryIntoForce: null,
  notes: "",
  notesDe: "",
  lastVerified: "2026-10-20",
  ...overrides,
});

test("the day is Berlin's, not the server's", () => {
  // 23:30 UTC on 19 October is already 20 October in Berlin (summer time, UTC+2).
  expect(berlinDay(new Date("2026-10-19T23:30:00Z"))).toBe("2026-10-20");
  // 23:30 UTC on 31 December is already 1 January in Berlin (winter time, UTC+1).
  expect(berlinDay(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
});

test("a deadline has passed only from the day after it", () => {
  expect(deadlineState(portal({}), "2026-03-07")).toEqual({
    kind: "passed",
    deadline: "2026-03-06",
  });
  expect(deadlineState(portal({}), "2026-03-06")).toEqual({
    kind: "ahead",
    deadline: "2026-03-06",
  });
});

test("no deadline recorded, or no portal yet, is no deadline to miss", () => {
  expect(deadlineState(portal({ registrationDeadline: null }), "2026-10-20")).toEqual({
    kind: "none",
  });
  expect(
    deadlineState(
      portal({ status: "not-yet-available", registrationDeadline: "2025-01-01" }),
      "2026-10-20",
    ),
  ).toEqual({ kind: "none" });
});
