import type { ContractTranslationLocale } from "@/lib/legal/contract-language";
import type { partnerContractLocaleEnum } from "@/schema";

/** The language an agreement is offered, stored and signed in: the binding text. */
export type PartnerContractLocale = (typeof partnerContractLocaleEnum.enumValues)[number];

/** The languages an agreement can be read in: the binding ones and the translations. */
export type PartnerContractReadingLocale =
  | PartnerContractLocale
  | ContractTranslationLocale;

export const PARTNER_CONTRACT_INTL_LOCALE: Record<PartnerContractReadingLocale, string> =
  {
    de: "de-DE",
    en: "en-GB",
    cs: "cs-CZ",
  };

/** A day, or a moment, as it was in Köln: the seller's seat decides what date it was. */
export function formatPartnerContractDate(
  date: Date,
  locale: PartnerContractReadingLocale,
  withTime = false,
): string {
  return new Intl.DateTimeFormat(PARTNER_CONTRACT_INTL_LOCALE[locale], {
    dateStyle: "long",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Europe/Berlin",
  }).format(date);
}
