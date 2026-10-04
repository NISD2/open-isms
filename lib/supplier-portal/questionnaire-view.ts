/**
 * The questionnaire as one page shows it: the package's questions in the reader's language, in the
 * portal's groups (`QUESTIONNAIRE_PAGES`), with each group's heading and "why we ask" line. Built on
 * the server and handed to the form or the read-only view, so the browser never loads every question
 * in every language.
 */
import {
  type Condition,
  conditionsOf,
  type SupplierField,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { getLocale, getTranslations } from "next-intl/server";
import {
  QUESTIONNAIRE_FIELDS,
  QUESTIONNAIRE_PAGES,
  type QuestionnaireField,
  type QuestionnairePage,
} from "@/lib/forms/supplier-portal-sections";
import { pickLocalized } from "@/lib/locale";
import { questionOf } from "./completeness";

export interface QuestionView {
  readonly id: QuestionnaireField;
  readonly type: SupplierField["type"];
  readonly label: string;
  /** The "tick yes if" threshold and examples. Shown under the question, never behind an icon. */
  readonly help: string;
  readonly basis: string;
  /** ISO/IEC 27001:2022 Annex A controls the question serves; empty when it serves none. */
  readonly iso27001: readonly string[];
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly conditions: readonly Condition[];
}

export interface GroupView {
  readonly key: string;
  readonly title: string;
  readonly why: string;
  readonly questions: readonly QuestionView[];
}

// A language the package does not carry for a question reads English (pickLocalized's fallback).
const viewOf = (id: QuestionnaireField, locale: string): QuestionView => {
  const question = questionOf(id);
  return {
    id,
    type: question.type,
    label: pickLocalized(question.label, locale),
    help: pickLocalized(question.description, locale),
    basis: question.legalBasis,
    iso27001: question.iso27001 ?? [],
    options: (question.options ?? []).map((option) => ({
      value: option.value,
      label: pickLocalized(option.label, locale),
    })),
    conditions: conditionsOf(question),
  };
};

const questionnaireGroups = (
  pages: readonly QuestionnairePage[],
  locale: string,
  copy: (groupKey: string) => { readonly title: string; readonly why: string },
): GroupView[] =>
  pages.flatMap((page) =>
    QUESTIONNAIRE_PAGES[page].map((group) => ({
      key: group.key,
      ...copy(group.key),
      questions: group.fields.map((id) => viewOf(id, locale)),
    })),
  );

/**
 * The groups of these pages in the request's language, headings from messages: worded to the
 * supplier filling them in, or to the customer reading a supplier's answers.
 */
export async function loadQuestionnaireGroups(
  pages: readonly QuestionnairePage[],
  reader: "supplier" | "customer" = "supplier",
): Promise<GroupView[]> {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations(
      reader === "customer"
        ? "supplierPortal.questionnaire.customerGroups"
        : "supplierPortal.questionnaire.groups",
    ),
  ]);
  return questionnaireGroups(pages, locale, (key) => ({
    title: t(`${key}.title`),
    why: t(`${key}.why`),
  }));
}

/** Only the questionnaire's answers from a company row: what the browser needs, nothing else. */
export const answersOf = (row: Partial<Record<string, unknown>>) =>
  Object.fromEntries(
    QUESTIONNAIRE_FIELDS.map((field) => [field, row[field] ?? null]),
  ) as Partial<Record<QuestionnaireField, unknown>>;
