import { describe, expect, test } from "bun:test";
import { auditableInput } from "./audit-input";

const ID = "11111111-1111-4111-8111-111111111111";

describe("what an audit row keeps of a tool input", () => {
  test("keeps ids, days, numbers, flags and the fixed words as sent", () => {
    expect(
      auditableInput({
        userId: ID,
        fromDay: "2026-10-01",
        limit: 100,
        includeValues: true,
        via: "assistant",
      }),
    ).toEqual({
      userId: ID,
      fromDay: "2026-10-01",
      limit: 100,
      includeValues: true,
      via: "assistant",
    });
  });

  test("keeps only the length of any other text, so no name or address reaches the row", () => {
    const stored = auditableInput({
      text: "anna.muster@example.org",
      actionPrefix: "durchgang.",
      cursor: "2026-10-20T10:00:00.123456|11111111-1111-4111-8111-111111111111",
    });
    expect(stored).toEqual({ textLength: 23, actionPrefixLength: 10, cursorLength: 63 });
    expect(JSON.stringify(stored)).not.toContain("anna");
  });

  test("leaves out what is not a string, number or flag, and anything unset", () => {
    expect(auditableInput({ a: null, b: undefined, c: { text: "x" }, d: ["y"] })).toEqual(
      {},
    );
  });
});
