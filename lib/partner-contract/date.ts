import type { partnerContractLocaleEnum } from "@/schema";

export type PartnerContractLocale = (typeof partnerContractLocaleEnum.enumValues)[number];

export const PARTNER_CONTRACT_INTL_LOCALE: Record<PartnerContractLocale, string> = {
  de: "de-DE",
  en: "en-GB",
};

/** A day, or a moment, as it was in Köln: the seller's seat decides what date it was. */
export function formatPartnerContractDate(
  date: Date,
  locale: PartnerContractLocale,
  withTime = false,
): string {
  return new Intl.DateTimeFormat(PARTNER_CONTRACT_INTL_LOCALE[locale], {
    dateStyle: "long",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Europe/Berlin",
  }).format(date);
}
