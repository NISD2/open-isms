/**
 * How much of the supplier questionnaire a company has actually answered.
 *
 * The fields come from the page layout the portal renders (`lib/forms/supplier-portal-sections.ts`)
 * and whether a question applies comes from the questionnaire package itself (`isVisible`), so a
 * question added there is scored the moment it is placed on a page, and the rules for when one
 * shows exist once.
 *
 * Two rules make the number mean something:
 *
 *  - **`false` is an answer.** "No, we hold no ISO 27001 certificate" is a
 *    filled-in field. Treating it as blank would score an honest supplier
 *    below a silent one.
 *  - **The denominator is what applies to them.** A SaaS-only supplier is not
 *    asked about on-prem patch SLAs, so those fields are not counted against
 *    them. Without this nobody could ever reach 100 percent and the number
 *    would say nothing about who still owes us answers.
 */

import {
  isVisible,
  type SupplierField,
  supplierQuestionnaire,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import {
  PROFILE_PAGE_FIELDS,
  QUESTIONNAIRE_FIELDS,
  type QuestionnaireField,
  SECURITY_PRACTICES_PAGE_FIELDS,
  SERVICE_TYPE_PAGE_FIELDS,
} from "@/lib/forms/supplier-portal-sections";
import { company } from "@/schema";
import { isAnswered } from "./answered";

/** A company row carrying (at least) the questionnaire columns. */
export type QuestionnaireAnswers = Partial<Record<QuestionnaireField, unknown>>;

export interface SectionScore {
  answered: number;
  applicable: number;
}

export interface QuestionnaireCompleteness {
  answered: number;
  /** Fields that apply to this supplier, given their answers so far. */
  applicable: number;
  /** 0-100, rounded. */
  percent: number;
  profile: SectionScore;
  practices: SectionScore;
  /** Zero-applicable when the supplier has ticked no service type. */
  serviceType: SectionScore;
}

/**
 * The questionnaire columns as a Drizzle projection, so a `.select()` picks
 * up a new question without anyone editing the query.
 */
export function questionnaireColumns(): {
  [K in QuestionnaireField]: (typeof company)[K];
} {
  return Object.fromEntries(
    QUESTIONNAIRE_FIELDS.map((field) => [field, company[field]]),
  ) as { [K in QuestionnaireField]: (typeof company)[K] };
}

const QUESTIONS = new Map(supplierQuestionnaire.fields.map((field) => [field.id, field]));

/** The package's definition of a placed field; the layout test guarantees there is one. */
export const questionOf = (field: QuestionnaireField): SupplierField => {
  const question = QUESTIONS.get(field);
  if (!question) throw new Error(`${field} is not in the questionnaire package`);
  return question;
};

function scoreOf(
  row: QuestionnaireAnswers,
  fields: readonly QuestionnaireField[],
): SectionScore {
  const asked = fields.filter((field) => isVisible(questionOf(field), row));
  return {
    applicable: asked.length,
    answered: asked.filter((field) => isAnswered(row[field])).length,
  };
}

export function questionnaireCompleteness(
  row: QuestionnaireAnswers,
): QuestionnaireCompleteness {
  const profile = scoreOf(row, PROFILE_PAGE_FIELDS);
  const practices = scoreOf(row, SECURITY_PRACTICES_PAGE_FIELDS);
  const serviceType = scoreOf(row, SERVICE_TYPE_PAGE_FIELDS);

  const answered = profile.answered + practices.answered + serviceType.answered;
  const applicable = profile.applicable + practices.applicable + serviceType.applicable;

  return {
    answered,
    applicable,
    percent: applicable === 0 ? 0 : Math.round((answered / applicable) * 100),
    profile,
    practices,
    serviceType,
  };
}
