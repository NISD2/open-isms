/**
 * Every llm procedure is a paid model call. Two things bound what a signed-in
 * member can spend: the input caps, which bound one prompt, and a per-company
 * hourly budget, which bounds how many. Both are pinned here without calling a
 * model: the test company has AI switched off, so each call that gets past the
 * budget stops at the opt-out check with FORBIDDEN.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: () => {} }));

// The limiter counts in Postgres, which this suite does not have. What is under
// test is which key and budget each procedure asks for, so a stand-in with the
// same contract (allow up to `limit` hits per key) is enough; the real counting
// is drilled in scripts/ci/rate-limit-drill.ts.
const hits = new Map<string, number>();
mock.module("@/lib/rate-limit", () => ({
  rateLimit: async (key: string, limit: number) => {
    const count = (hits.get(key) ?? 0) + 1;
    hits.set(key, count);
    return count <= limit;
  },
}));

const { createCallerFactory } = await import("../init");
const {
  LLM_CALLS_PER_HOUR,
  evaluateAllInputSchema,
  evaluateSectionInputSchema,
  extractInputSchema,
  llmRouter,
} = await import("./llm");
type TRPCContext = import("../init").TRPCContext;

const AI_OFF_DB = {
  query: { company: { findFirst: async () => ({ aiDataSharing: "none" }) } },
};

function callerFor(companyId: string) {
  return createCallerFactory(llmRouter)({
    db: AI_OFF_DB as unknown as TRPCContext["db"],
    session: { user: { id: "user-1" } } as TRPCContext["session"],
    userId: "user-1",
    companyId,
    ip: "test",
    userAgent: null,
  });
}

const field = (key: string, enumValues?: string[]) => ({
  key,
  type: enumValues ? "enum" : "text",
  label: `Label for ${key}`,
  required: false,
  enumValues,
});

const EXTRACT = { text: "Muster GmbH, Berlin", fields: [field("name")] };

type Schema = { safeParse: (v: unknown) => { success: boolean } };
const accepts = (schema: Schema, v: unknown) => schema.safeParse(v).success;

beforeEach(() => hits.clear());

describe("extract input bounds", () => {
  test("accept the largest form that calls it today, with room to grow", () => {
    const sectors = Array.from({ length: 18 }, (_, i) => `sector_number_${i}`);
    const fields = Array.from({ length: 92 }, (_, i) =>
      field(`field_with_a_long_column_name_${i}`, i === 0 ? sectors : undefined),
    );
    const largest = { ...EXTRACT, fields, language: "de" };
    expect(accepts(extractInputSchema, largest)).toBe(true);
  });

  const tooManyFields = Array.from({ length: 121 }, (_, i) => field(`f${i}`));

  test.each([
    ["too many fields", { fields: tooManyFields }],
    ["no fields", { fields: [] }],
    ["too many enum values", { fields: [field("f", Array(51).fill("v"))] }],
    ["an enum value too long", { fields: [field("f", ["v".repeat(65)])] }],
    ["a key too long", { fields: [field("k".repeat(65))] }],
    ["a label too long", { fields: [{ ...field("f"), label: "l".repeat(301) }] }],
    ["a context too long", { context: "c".repeat(2_001) }],
    ["a text too long", { text: "t".repeat(50_001) }],
    ["a language that is not a shipped locale", { language: "en-GB" }],
    ["a malformed language tag", { language: "../../x" }],
  ])("refuse %s", (_label, override) => {
    expect(accepts(extractInputSchema, { ...EXTRACT, ...override })).toBe(false);
  });
});

describe("evaluation input bounds", () => {
  test("accept a category code and a shipped locale, or nothing", () => {
    const section = { categoryCode: "CRA-SBOM", locale: "de" };
    expect(accepts(evaluateSectionInputSchema, section)).toBe(true);
    expect(accepts(evaluateAllInputSchema, undefined)).toBe(true);
    expect(accepts(evaluateAllInputSchema, { locale: "pl" })).toBe(true);
  });

  test("refuse an oversized category code or an unknown locale", () => {
    const oversized = { categoryCode: "C".repeat(17) };
    expect(accepts(evaluateSectionInputSchema, oversized)).toBe(false);
    const unknownLocale = { categoryCode: "GOV", locale: "xx" };
    expect(accepts(evaluateSectionInputSchema, unknownLocale)).toBe(false);
    expect(accepts(evaluateAllInputSchema, { locale: "klingon" })).toBe(false);
  });
});

describe("per-company hourly budget", () => {
  test("extract stops at its budget, and only for that company", async () => {
    const caller = callerFor("company-a");
    for (let i = 0; i < LLM_CALLS_PER_HOUR.extract; i++) {
      await expect(caller.extract(EXTRACT)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(caller.extract(EXTRACT)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    await expect(callerFor("company-b").extract(EXTRACT)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("evaluateAll, which fans out per category, has the smallest budget", async () => {
    const caller = callerFor("company-a");
    for (let i = 0; i < LLM_CALLS_PER_HOUR.evaluateAll; i++) {
      await expect(caller.evaluateAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(caller.evaluateAll()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    const { evaluateAll, evaluateSection } = LLM_CALLS_PER_HOUR;
    expect(evaluateAll).toBeLessThan(evaluateSection);
  });

  test("evaluateSection has a budget of its own", async () => {
    const caller = callerFor("company-a");
    const section = () => caller.evaluateSection({ categoryCode: "GOV" });
    await caller.evaluateAll().catch(() => {});
    for (let i = 0; i < LLM_CALLS_PER_HOUR.evaluateSection; i++) {
      await expect(section()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(section()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
