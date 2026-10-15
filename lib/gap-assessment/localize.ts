import { pickLocalized } from "@/lib/locale";
import {
  GAP_DOMAINS_CS,
  GAP_QUESTIONS_CS,
  type GapDomainText,
  type GapQuestionText,
} from "./cs";
import type { GapDomain, GapQuestion } from "./schema";

/** A domain in the page language: Czech from ./cs, German and English from the package, else English. */
export const localizeGapDomain = (domain: GapDomain, locale: string): GapDomainText => {
  const cs = GAP_DOMAINS_CS[domain.id];
  return {
    name: pickLocalized<string>({ ...domain.name, cs: cs?.name }, locale),
    description: pickLocalized<string>(
      { ...domain.description, cs: cs?.description },
      locale,
    ),
  };
};

/**
 * A question in the page language, the same way. The package's legal basis cites the BSIG, which
 * German and English pages show as it is; a Czech page shows the Czech place of the duty.
 */
export const localizeGapQuestion = (
  question: GapQuestion,
  locale: string,
): GapQuestionText => {
  const cs = GAP_QUESTIONS_CS[question.id];
  return {
    text: pickLocalized<string>({ ...question.text, cs: cs?.text }, locale),
    plainText: pickLocalized<string>(
      { ...question.plainText, cs: cs?.plainText },
      locale,
    ),
    legalBasis: pickLocalized<string>(
      { en: question.legalBasis, cs: cs?.legalBasis },
      locale,
    ),
  };
};
