/**
 * How much of the supplier questionnaire a company has actually answered.
 *
 * The fields come from the same three page constants the portal renders
 * against (`lib/forms/supplier-portal-sections.ts`), so a question added to a
 * page is scored the moment it ships and there is no second list to maintain.
 *
 * Two rules make the number mean something:
 *
 *  - **`false` is an answer.** "No, we hold no ISO 27001 certificate" is a
 *    filled-in field. Treating it as blank would score an honest supplier
 *    below a silent one.
 *  - **The denominator is what applies to them.** A SaaS-only supplier is not
 *    asked about on-prem patch SLAs, so those four fields are not counted
 *    against them. Without this nobody could ever reach 100 percent and the
 *    number would say nothing about who still owes us answers.
 */

import {
  GATED_PRACTICE_FIELDS,
  PROFILE_PAGE_FIELDS,
  SECURITY_PRACTICES_PAGE_FIELDS,
  SERVICE_TYPE_BLOCKS,
  SERVICE_TYPE_PAGE_FIELDS,
} from "@/lib/forms/supplier-portal-sections";
import { company } from "@/schema";

/** Every column the questionnaire covers, across all three pages. */
export const QUESTIONNAIRE_FIELDS = [
  ...PROFILE_PAGE_FIELDS,
  ...SECURITY_PRACTICES_PAGE_FIELDS,
  ...SERVICE_TYPE_PAGE_FIELDS,
] as const;

export type QuestionnaireField = (typeof QUESTIONNAIRE_FIELDS)[number];

/** A company row carrying (at least) the questionnaire columns. */
export type QuestionnaireAnswers = Partial<Record<QuestionnaireField, unknown>>;

export interface SectionScore {
  answered: number;
  applicable: number;
}

export interface QuestionnaireCompleteness {
  answered: number;
  /** Fields that apply to this supplier, given the service types they ticked. */
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

/** A blank string is not an answer; `false` and `0` are. */
function isAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function scoreOf(
  row: QuestionnaireAnswers,
  fields: readonly QuestionnaireField[],
): SectionScore {
  return {
    applicable: fields.length,
    answered: fields.filter((field) => isAnswered(row[field])).length,
  };
}

function gateOf(field: QuestionnaireField): string | undefined {
  return field in GATED_PRACTICE_FIELDS
    ? GATED_PRACTICE_FIELDS[field as keyof typeof GATED_PRACTICE_FIELDS]
    : undefined;
}

export function questionnaireCompleteness(
  row: QuestionnaireAnswers,
): QuestionnaireCompleteness {
  const practiceFields = SECURITY_PRACTICES_PAGE_FIELDS.filter((field) => {
    const gate = gateOf(field);
    return gate === undefined || row[gate as QuestionnaireField] === true;
  });

  const serviceFields = SERVICE_TYPE_BLOCKS.flatMap((block) =>
    row[block.gate] === true ? [...block.fields] : [],
  );

  const profile = scoreOf(row, PROFILE_PAGE_FIELDS);
  const practices = scoreOf(row, practiceFields);
  const serviceType = scoreOf(row, serviceFields);

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
