/**
 * Where a partner agreement can be offered and where its link points. Kept apart from the
 * document so the public page can read a stored offer without loading the wording.
 */
import { routing } from "@/i18n/routing";
import { isSellerInstance } from "@/lib/billing/seller";
import { getAppUrl } from "@/lib/utils";
import type { PartnerContractLocale } from "./document";

/**
 * An agreement names the company behind nisd2.eu as the party that pays, so only nisd2.eu offers
 * one. A self-hosted install has its own partners and its own company. Local development may, so
 * the flow can be tried before it ships.
 */
export const canOfferPartnerContracts = (): boolean =>
  isSellerInstance() || process.env.NODE_ENV === "development";

/** The link the partner opens, in the agreement's own language (DE carries no prefix). */
export const partnerContractUrl = (
  locale: PartnerContractLocale,
  token: string,
): string => {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${getAppUrl()}${prefix}/partner-agreement/${token}`;
};
