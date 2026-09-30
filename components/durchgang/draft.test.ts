import { describe, expect, test } from "bun:test";
import type { FieldMeta } from "@/lib/forms/schema-introspect";
import { changedAnswers, initialDraft, toAnswer, toDraft } from "./draft";

const meta = (type: FieldMeta["type"]): FieldMeta => ({
  key: "k",
  label: "k",
  type,
  required: false,
});

describe("the Durchgang draft", () => {
  test("keeps a stored yes or no as a boolean, so the choice shows as selected", () => {
    expect(toDraft(meta("boolean"), true)).toBe(true);
    expect(toDraft(meta("boolean"), false)).toBe(false);
    expect(toDraft(meta("date"), "2026-09-01T00:00:00.000Z")).toBe("2026-09-01");
    expect(toDraft(meta("text"), null)).toBe("");
  });

  test("sends an emptied field as a clear and skips a number that is not one", () => {
    expect(toAnswer(meta("text"), "")).toBeNull();
    expect(toAnswer(meta("number"), "24")).toBe(24);
    expect(toAnswer(meta("number"), "abc")).toBeUndefined();
    expect(toAnswer(meta("text"), "  Kontakt  ")).toBe("Kontakt");
  });

  test("sends only what differs from the stored answers", () => {
    const fields = { a: meta("text"), b: meta("text"), c: meta("number") };
    const draft = initialDraft({ a: "same", b: "old" }, fields);
    const values = { ...draft.values, b: "", c: "3" };
    expect(changedAnswers(["a", "b", "c"], values, draft.values, fields)).toEqual({
      b: null,
      c: 3,
    });
  });
});
