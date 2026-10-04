/**
 * What every public rendering of the supplier questionnaire (the schema page, the PDF, the Word
 * file) derives from the questionnaire package rather than restating: the section order, the
 * counts, when a conditional question shows, and the ISO/IEC 27001 controls a question serves.
 */
import {
  conditionsOf,
  groupBySection,
  SECTION,
  type SectionValue,
  type SupplierField,
  supplierQuestionnaire,
  visibleFields,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { pickLocalized } from "@/lib/locale";

/** The package's sections, in its own order. */
export const SECTION_ORDER: readonly SectionValue[] = Object.values(SECTION);

export const QUESTIONNAIRE_COUNTS = {
  total: supplierQuestionnaire.fields.length,
  sections: groupBySection(supplierQuestionnaire).size,
  /** Asked of every supplier: the questions that show before any answer is given. */
  always: visibleFields(supplierQuestionnaire, {}).length,
  withIso: supplierQuestionnaire.fields.filter((field) => field.iso27001).length,
};

/** The words a condition is written with, in the reader's language. */
export interface ConditionWords {
  readonly onlyIf: string;
  readonly yes: string;
  readonly no: string;
  readonly or: string;
}

const fieldsById = new Map(
  supplierQuestionnaire.fields.map((field) => [field.id, field]),
);

function answerText(
  gate: SupplierField | undefined,
  equals: string | number | boolean,
  locale: string,
  words: ConditionWords,
): string {
  if (equals === true) return words.yes;
  if (equals === false) return words.no;
  const option = gate?.options?.find((candidate) => candidate.value === equals);
  return option ? pickLocalized(option.label, locale) : String(equals);
}

/**
 * When a conditional question shows, in plain words: "Only if: <the gate question> = Yes", with
 * several gates joined by "or". Null for a question every supplier is asked.
 */
export function conditionText(
  field: SupplierField,
  locale: string,
  words: ConditionWords,
): string | null {
  const conditions = conditionsOf(field);
  if (conditions.length === 0) return null;
  const parts = conditions.map((condition) => {
    const gate = fieldsById.get(condition.field);
    const question = gate ? pickLocalized(gate.label, locale) : condition.field;
    return `${question} = ${answerText(gate, condition.equals, locale, words)}`;
  });
  return `${words.onlyIf}: ${parts.join(` ${words.or} `)}`;
}

/** The noun form that goes with a count in this language, by the CLDR plural rules. */
export function plural(
  locale: string,
  count: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { readonly other: string },
): string {
  return `${count} ${forms[new Intl.PluralRules(locale).select(count)] ?? forms.other}`;
}

/** The ISO/IEC 27001:2022 Annex A controls a question serves, or null when it names none. */
export function isoText(field: SupplierField): string | null {
  return field.iso27001 ? `ISO/IEC 27001:2022 ${field.iso27001.join(", ")}` : null;
}
