import { describe, expect, test } from "bun:test";
import { riskAcceptanceValues } from "./risk-acceptance";

describe("riskAcceptanceValues", () => {
  const now = new Date("2026-09-30T09:00:00.000Z");

  test("attributes an acceptance to the caller at the request time", () => {
    expect(riskAcceptanceValues(true, "user-1", now)).toEqual({
      acceptedBy: "user-1",
      acceptedAt: now,
    });
  });

  test("clears both columns together", () => {
    expect(riskAcceptanceValues(false, "user-1", now)).toEqual({
      acceptedBy: null,
      acceptedAt: null,
    });
  });

  // An ordinary edit (title, scores) must not touch an earlier acceptance.
  test("leaves both columns alone when acceptance is not part of the write", () => {
    expect(riskAcceptanceValues(undefined, "user-1", now)).toEqual({});
  });
});
