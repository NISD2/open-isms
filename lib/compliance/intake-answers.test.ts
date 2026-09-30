/**
 * A saved intake answer ends up in the report PDF, the policy PDF and an LLM
 * prompt. Nine megabytes of text in one field was enough to make react-pdf
 * exhaust the only app container, so a save is held to the field its schema
 * defines. These cases are as much about what a real answer must still be
 * allowed to be as about what is refused.
 */
import { describe, expect, test } from "bun:test";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { CATEGORY_FIELD_MAPPING, CATEGORY_SCHEMAS } from "./category-schemas";
import {
  checkRequirementAnswers,
  clipAnswer,
  LONGEST_INTAKE_ANSWER,
  MAX_INTAKE_PAYLOAD_CHARS,
  SHOWN_ANSWER_CHARS,
  withinIntakePayloadCap,
} from "./intake-answers";
import { REQUIREMENT_FIELD_MAP } from "./requirement-fields";

const NINE_MEGABYTES = "x".repeat(9 * 1024 * 1024);

/** INC 3.1 holds text, a number and a 500-character text field. */
const INC_31 = REQUIREMENT_FIELD_MAP["3.1"];

const check = (code: string, answers: Record<string, unknown>) => {
  const info = REQUIREMENT_FIELD_MAP[code];
  if (!info) throw new Error(`no intake fields for ${code}`);
  return checkRequirementAnswers(info.categoryCode, info.fieldKeys, answers);
};

describe("checkRequirementAnswers", () => {
  test("accepts what the form sends for every kind of field", () => {
    expect(INC_31?.categoryCode).toBe("INC");
    expect(
      check("3.1", {
        incidentLead: "Katrin Albers, IT-Leitung",
        irtTeamSize: 4,
        secureCommsChannel: "Signal-Gruppe IRT",
        incidentEscalationContacts: "P1: CISO, P2: IT-Leitung ".repeat(10),
      }),
    ).toEqual({
      ok: true,
      answers: {
        incidentLead: "Katrin Albers, IT-Leitung",
        irtTeamSize: 4,
        secureCommsChannel: "Signal-Gruppe IRT",
        incidentEscalationContacts: "P1: CISO, P2: IT-Leitung ".repeat(10),
      },
    });
    // An enum, a boolean, and a date both as the Date the form sends and as
    // the ISO string an unchanged answer comes back from the database as.
    expect(
      check("3.4", { lastDrillDate: new Date("2026-05-04"), drillType: "tabletop" }).ok,
    ).toBe(true);
    expect(check("3.4", { lastDrillDate: "2026-05-04T00:00:00.000Z" }).ok).toBe(true);
    expect(
      check("3.3", { earlyWarningSlaHours: 24, bsiReportingRegistered: true }).ok,
    ).toBe(true);
  });

  test("accepts a text answer exactly at its field's maximum", () => {
    expect(check("12.4", { informationSharingCompliant: "a".repeat(1000) }).ok).toBe(
      true,
    );
  });

  test("accepts a cleared field", () => {
    expect(check("3.4", { lastDrillDate: null, drillType: "" }).ok).toBe(true);
  });

  // Ranges describe good practice. Refusing a truthful answer below them
  // would push people to record a false one.
  test("does not enforce number ranges", () => {
    expect(check("11.3", { passwordMinLength: 6 }).ok).toBe(true);
  });

  test("refuses a text answer over its field's maximum", () => {
    const result = check("3.1", { incidentLead: "a".repeat(256) });
    expect(result).toEqual({
      ok: false,
      message: "Incident Lead must be at most 255 characters.",
    });
  });

  test("refuses nine megabytes in one field", () => {
    expect(check("12.4", { informationSharingCompliant: NINE_MEGABYTES }).ok).toBe(false);
  });

  test.each([
    ["an object for text", "3.1", { incidentLead: { big: NINE_MEGABYTES } }],
    ["text for a number", "3.1", { irtTeamSize: "four" }],
    ["infinity for a number", "3.1", { irtTeamSize: Number.POSITIVE_INFINITY }],
    ["a value outside the options", "3.4", { drillType: "improvised" }],
    ["text for yes or no", "3.3", { bsiReportingRegistered: "yes" }],
    ["text that is no date", "3.4", { lastDrillDate: "last spring" }],
    ["a long string for a date", "3.4", { lastDrillDate: `2026-05-04${" ".repeat(64)}` }],
  ] as const)("refuses %s", (_, code, answers) => {
    expect(check(code, answers).ok).toBe(false);
  });

  test("names every refused field", () => {
    const result = check("3.1", { incidentLead: 7, irtTeamSize: "four" });
    expect(result).toEqual({
      ok: false,
      message: "Incident Lead must be text; Irt Team Size must be a number.",
    });
  });

  test("keeps only the requirement's own fields", () => {
    const result = check("3.1", { incidentLead: "Katrin", notAField: NINE_MEGABYTES });
    expect(result).toEqual({ ok: true, answers: { incidentLead: "Katrin" } });
  });
});

describe("withinIntakePayloadCap", () => {
  test("lets a whole category's answers through", () => {
    const everyField = Object.fromEntries(
      introspectSchema(CATEGORY_SCHEMAS.REG, []).map((field) => [
        field.key,
        "a".repeat(field.maxLength ?? 32),
      ]),
    );
    expect(withinIntakePayloadCap(everyField)).toBe(true);
  });

  test("turns away a payload over the cap, whatever its keys", () => {
    expect(withinIntakePayloadCap({ junk: "a".repeat(MAX_INTAKE_PAYLOAD_CHARS) })).toBe(
      false,
    );
    expect(withinIntakePayloadCap({ junk: NINE_MEGABYTES })).toBe(false);
  });

  test("refuses what JSON cannot store instead of throwing", () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(withinIntakePayloadCap(cycle)).toBe(false);
    expect(withinIntakePayloadCap({ n: BigInt(1) })).toBe(false);
  });
});

describe("clipAnswer", () => {
  test("never cuts an answer a save accepts", () => {
    expect(SHOWN_ANSWER_CHARS).toBeGreaterThanOrEqual(LONGEST_INTAKE_ANSWER);
    const longest = "a".repeat(LONGEST_INTAKE_ANSWER);
    expect(clipAnswer(longest)).toBe(longest);
  });

  test("cuts a stored answer longer than anything a save accepts", () => {
    const clipped = clipAnswer(NINE_MEGABYTES);
    expect(clipped).toHaveLength(SHOWN_ANSWER_CHARS + 1);
    expect(clipped.endsWith("…")).toBe(true);
  });

  test("does not split a character in two", () => {
    const text = `${"a".repeat(SHOWN_ANSWER_CHARS - 1)}😀tail`;
    expect(clipAnswer(text)).toBe(`${"a".repeat(SHOWN_ANSWER_CHARS - 1)}…`);
  });
});

// The check reads fields through the same introspection that renders the
// form. A mapped key with no schema field, a type the check cannot handle or a
// text field without a maximum would each refuse or wave through real saves.
describe("intake field definitions", () => {
  const mapped = Object.entries(CATEGORY_FIELD_MAPPING).flatMap(([code, mapping]) => {
    const schema = CATEGORY_SCHEMAS[code];
    if (!schema) throw new Error(`no schema for ${code}`);
    const fields = new Map(introspectSchema(schema, []).map((f) => [f.key, f]));
    return Object.keys(mapping).map((key) => ({ code, key, field: fields.get(key) }));
  });

  test("every mapped key is a field of its category", () => {
    expect(mapped.filter((m) => !m.field).map((m) => `${m.code}.${m.key}`)).toEqual([]);
  });

  test("every field is a kind the check handles", () => {
    const unhandled = mapped.filter(
      (m) => m.field?.type === "array" || m.field?.type === "unknown",
    );
    expect(unhandled.map((m) => `${m.code}.${m.key}`)).toEqual([]);
  });

  test("every text field declares its own maximum", () => {
    const textKinds = new Set(["text", "textarea", "email", "url", "file"]);
    const unbounded = mapped.filter(
      (m) => m.field && textKinds.has(m.field.type) && m.field.maxLength === undefined,
    );
    expect(unbounded.map((m) => `${m.code}.${m.key}`)).toEqual([]);
  });
});
