import type { WalkLocale } from "@/lib/durchgang/types";
import { splitVatNumber } from "./vies";

/** The VAT countries whose customers read the walk and the setup mail in their own language. */
const VAT_COUNTRY_LOCALE: Readonly<Partial<Record<string, WalkLocale>>> = {
  DE: "de",
  CZ: "cs",
};

/**
 * The language a close on the call sets the customer's account and setup mail in (./close-deal):
 * the one the admin picked on the call, else the one of the VAT number's country, else English.
 */
export const closeLocale = (vatNumber: string, chosen: WalkLocale | null): WalkLocale => {
  if (chosen) return chosen;
  const country = splitVatNumber(vatNumber)?.countryCode;
  return (country ? VAT_COUNTRY_LOCALE[country] : undefined) ?? "en";
};
