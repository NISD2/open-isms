/**
 * The questionnaire score is the number a platform admin uses to decide who
 * still owes us answers, and it is read in two places (the Suppliers tab and
 * the Graphs tab) that have to agree. The cases below are the ones that make
 * it mean something rather than just counting non-null columns.
 */
import { describe, expect, test } from "bun:test";
import {
  PROFILE_PAGE_FIELDS,
  SECURITY_PRACTICES_PAGE_FIELDS,
} from "@/lib/forms/supplier-portal-sections";
import { questionnaireCompleteness } from "./completeness";

/** Practices minus the two that only apply once another answer turns them on. */
const UNGATED_PRACTICES = SECURITY_PRACTICES_PAGE_FIELDS.length - 2;
const BASELINE = PROFILE_PAGE_FIELDS.length + UNGATED_PRACTICES;

describe("questionnaireCompleteness", () => {
  test("an untouched supplier has answered nothing, and is asked only the baseline", () => {
    const score = questionnaireCompleteness({});
    expect(score.answered).toBe(0);
    expect(score.applicable).toBe(BASELINE);
    expect(score.percent).toBe(0);
    expect(score.serviceType.applicable).toBe(0);
  });

  test("`false` is an answer, so an honest no does not score as a blank", () => {
    expect(questionnaireCompleteness({ hasIsms: false }).answered).toBe(1);
    expect(questionnaireCompleteness({ hasIsms: true }).answered).toBe(1);
  });

  test("a blank or whitespace-only string is not an answer", () => {
    expect(questionnaireCompleteness({ legalName: "" }).answered).toBe(0);
    expect(questionnaireCompleteness({ legalName: "   " }).answered).toBe(0);
    expect(questionnaireCompleteness({ legalName: "Acme GmbH" }).answered).toBe(1);
  });

  test("ticking a service type adds that block to the denominator", () => {
    const saas = questionnaireCompleteness({ isSaas: true });
    // isSaas is itself a profile field, so ticking it also answers one.
    expect(saas.answered).toBe(1);
    expect(saas.serviceType.applicable).toBe(5);
    expect(saas.applicable).toBe(BASELINE + 5);
  });

  test("a supplier who ticks no service type is never asked those questions", () => {
    const filled = questionnaireCompleteness({ saasHostingRegion: "eu-central-1" });
    expect(filled.serviceType.applicable).toBe(0);
    // The answer is ignored rather than counted: they were never asked.
    expect(filled.answered).toBe(0);
  });

  test("the subprocessor list only applies once they say they have subprocessors", () => {
    const without = questionnaireCompleteness({ hasSubprocessors: false });
    const with_ = questionnaireCompleteness({ hasSubprocessors: true });
    expect(without.applicable).toBe(BASELINE);
    expect(with_.applicable).toBe(BASELINE + 1);
  });

  test("columns that are not questionnaire fields do not change the score", () => {
    // Regression: both callers pass a whole company row, which carries
    // billing, role flags and FKs alongside the answers. Scoring is defined
    // by the field lists, never by "every key present on the object".
    const bare = questionnaireCompleteness({ legalName: "Acme GmbH" });
    const noisy = questionnaireCompleteness({
      legalName: "Acme GmbH",
      id: "0d1b1a4e-0000-4000-8000-000000000000",
      plan: "free",
      stripeCustomerId: "cus_123",
      seats: 4,
    } as Parameters<typeof questionnaireCompleteness>[0]);
    expect(noisy).toEqual(bare);
  });

  test("percent is answered over applicable, not over every question that exists", () => {
    const answers = Object.fromEntries(
      PROFILE_PAGE_FIELDS.map((field) => [field, "answered"]),
    );
    const score = questionnaireCompleteness(answers);
    expect(score.profile.answered).toBe(PROFILE_PAGE_FIELDS.length);
    expect(score.percent).toBe(
      Math.round((PROFILE_PAGE_FIELDS.length / score.applicable) * 100),
    );
  });
});
