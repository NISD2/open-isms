import type { LocaleCode } from "@/lib/locale";

/**
 * Locales our contracts (terms, order terms, data processing agreement, partner agreement) are
 * shown in as a translation for information only (founder decision of 15.10.2026), so these readers
 * see a line that says which text binds and links to the English one. A partner signs the English
 * text, which binds. The terms name their own binding versions in clause C2 (German and English,
 * the German prevails), so on the terms and the order the line says that.
 */
export const CONTRACT_TRANSLATION_LOCALES = [
  "cs",
] as const satisfies readonly LocaleCode[];

export type ContractTranslationLocale = (typeof CONTRACT_TRANSLATION_LOCALES)[number];

/** The language whose text binds for a reader of a translation. */
export const BINDING_CONTRACT_LOCALE = "en" as const satisfies LocaleCode;

export const isContractTranslationLocale = (
  locale: string,
): locale is ContractTranslationLocale =>
  CONTRACT_TRANSLATION_LOCALES.some((code) => code === locale);
