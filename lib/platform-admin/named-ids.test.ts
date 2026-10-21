import { describe, expect, test } from "bun:test";
import { idsIn, segments } from "./named-ids";

const ANNA = "38682baf-e828-4f98-99f0-e1fbefb70992";
const ACME = "5b0c5a0e-5f0e-4d5e-9a3c-0d9a4f2b7a11";

describe("the ids a log entry mentions", () => {
  test("are found by shape, at any depth, once each", () => {
    const stored = { userId: ANNA, roleKey: "dpo", deep: [{ companyId: ACME }, ANNA] };
    expect(idsIn(null, stored).sort()).toEqual([ACME, ANNA].sort());
  });

  test("include the entity the entry is about", () => {
    expect(idsIn(ANNA, null, undefined)).toEqual([ANNA]);
  });

  test("leave out text that only looks like an id", () => {
    expect(idsIn("not-an-id", { note: "38682baf", n: 3, ok: true })).toEqual([]);
  });
});

describe("a stored value cut at its ids", () => {
  const json = JSON.stringify({ userId: ANNA, roleKey: "dpo" }, null, 2);

  test("shows the id where the quoted id was and keeps the rest", () => {
    const start = '{\n  "userId": '.length;
    expect(segments(json, [ANNA])).toEqual([
      { at: 0, text: '{\n  "userId": ' },
      { at: start, id: ANNA },
      { at: start + ANNA.length + 2, text: ',\n  "roleKey": "dpo"\n}' },
    ]);
  });

  test("handles the same id twice and two different ids", () => {
    const text = `["${ANNA}","${ACME}","${ANNA}"]`;
    const cut = segments(text, [ANNA, ACME]);
    expect(cut.map((s) => ("id" in s ? s.id : s.text))).toEqual([
      "[",
      ANNA,
      ",",
      ACME,
      ",",
      ANNA,
      "]",
    ]);
    // Each piece starts where it sits in the text, so no two share a key.
    for (const s of cut) {
      const piece = "id" in s ? `"${s.id}"` : s.text;
      expect(text.slice(s.at, s.at + piece.length)).toBe(piece);
    }
  });

  test("returns the text untouched when no id is in it", () => {
    expect(segments("null", [ANNA])).toEqual([{ at: 0, text: "null" }]);
  });
});
