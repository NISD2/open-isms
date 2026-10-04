/**
 * The questionnaire score is the number a platform admin uses to decide who
 * still owes us answers, and it is read in two places (the Suppliers tab and
 * the Graphs tab) that have to agree. The cases below are the ones that make
 * it mean something rather than just counting non-null columns.
 */
import { describe, expect, test } from "bun:test";
import {
  conditionsOf,
  supplierQuestionnaire,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { PROFILE_PAGE_FIELDS } from "@/lib/forms/supplier-portal-sections";
import { questionnaireCompleteness } from "./completeness";

/** Every question asked of every supplier: those that depend on no other answer. */
const BASELINE = supplierQuestionnaire.fields.filter(
  (field) => conditionsOf(field).length === 0,
).length;

describe("questionnaireCompleteness", () => {
  test("an untouched supplier has answered nothing, and is asked only the baseline", () => {
    const score = questionnaireCompleteness({});
    expect(score.answered).toBe(0);
    expect(score.applicable).toBe(BASELINE);
    expect(score.percent).toBe(0);
    expect(score.serviceType.applicable).toBe(0);
  });

  test("`false` is an answer, so an honest no does not score as a blank", () => {
    expect(questionnaireCompleteness({ staffSecurityTraining: false }).answered).toBe(1);
    expect(questionnaireCompleteness({ staffSecurityTraining: true }).answered).toBe(1);
  });

  test("a blank or whitespace-only string is not an answer", () => {
    expect(questionnaireCompleteness({ legalName: "" }).answered).toBe(0);
    expect(questionnaireCompleteness({ legalName: "   " }).answered).toBe(0);
    expect(questionnaireCompleteness({ legalName: "Acme GmbH" }).answered).toBe(1);
  });

  test("ticking SaaS opens the digital, software and SaaS questions", () => {
    const saas = questionnaireCompleteness({ isSaas: true });
    // isSaas is itself a profile field, so ticking it also answers one.
    expect(saas.answered).toBe(1);
    expect(saas.serviceType.applicable).toBe(2);
    // ISMS, certificate, vulnerability handling, incident plan, continuity plan, admin MFA;
    // independent testing; secure development and the published reporting route; the SaaS block.
    expect(saas.applicable).toBe(BASELINE + 6 + 1 + 2 + 2);
  });

  test("a supplier with keys to customer premises is asked about access, not about IT", () => {
    const premises = questionnaireCompleteness({ accessesCustomerPremises: true });
    // Confidentiality, suitability checks and hand-back; keys and rules on site.
    expect(premises.applicable).toBe(BASELINE + 3 + 2);
  });

  test("a supplier who ticks no service type is never asked those questions", () => {
    const filled = questionnaireCompleteness({ saasRtoHours: 4 });
    expect(filled.serviceType.applicable).toBe(0);
    // The answer is ignored rather than counted: they were never asked.
    expect(filled.answered).toBe(0);
  });

  test("the subcontractor list and pass-down only apply once they say they have subcontractors", () => {
    const without = questionnaireCompleteness({ hasSubprocessors: false });
    const with_ = questionnaireCompleteness({ hasSubprocessors: true });
    expect(without.applicable).toBe(BASELINE);
    expect(with_.applicable).toBe(BASELINE + 2);
  });

  test("holding customer data opens the data, access and digital questions", () => {
    expect(questionnaireCompleteness({ processesCustomerData: false }).applicable).toBe(
      BASELINE,
    );
    // Locations, DPA, both encryption questions; confidentiality, suitability checks, hand-back;
    // the six digital ones.
    expect(questionnaireCompleteness({ processesCustomerData: true }).applicable).toBe(
      BASELINE + 4 + 3 + 6,
    );
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
    expect(score.profile.answered).toBe(score.profile.applicable);
    expect(score.percent).toBe(
      Math.round((score.profile.applicable / score.applicable) * 100),
    );
  });
});
