/**
 * The partner agreement as a document: built once when an offer is made, stored on the row
 * (schema/tables/partner-contract), and rendered from the stored copy ever after. The wording is
 * messages/partnerContract; what the customer gets and what it costs are read from the pricing
 * page's own sources, so the offer and the agreement cannot describe two different products.
 */
import { createHash } from "node:crypto";
import { createTranslator } from "next-intl";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";
import { SELLER } from "@/lib/billing/seller";
import partnerDe from "@/messages/partnerContract/de.json";
import partnerEn from "@/messages/partnerContract/en.json";
import pricingDe from "@/messages/pricing/de.json";
import pricingEn from "@/messages/pricing/en.json";
import type { PartnerContractBody } from "@/schema";
import { PARTNER_CONTRACT_INTL_LOCALE, type PartnerContractLocale } from "./date";

export type { PartnerContractLocale } from "./date";

/** Moves whenever the wording changes what an offer says, so a stored offer names its wording. */
export const PARTNER_CONTRACT_VERSION = "2026-10-06";

const MESSAGES = {
  de: { ...partnerDe, ...pricingDe },
  en: { ...partnerEn, ...pricingEn },
} as const;

export const partnerContractTranslator = (locale: PartnerContractLocale) =>
  createTranslator({ locale, messages: MESSAGES[locale] });

/** The acceptance page's own strings, handed to the client in the agreement's language. */
export const partnerContractPageMessages = (locale: PartnerContractLocale) =>
  MESSAGES[locale].partnerContract.page;

export type PartnerContractPageMessages = ReturnType<typeof partnerContractPageMessages>;

const S = "partnerContract.document.sections";

/**
 * The order the agreement reads in. The offer section carries the pricing card's list after its
 * first paragraph.
 */
const SECTIONS = [
  { heading: `${S}.about.heading`, paragraphs: [`${S}.about.p1`, `${S}.about.p2`] },
  {
    heading: `${S}.offer.heading`,
    paragraphs: [`${S}.offer.p1`, `${S}.offer.p2`],
    withOfferList: true,
  },
  { heading: `${S}.support.heading`, paragraphs: [`${S}.support.p1`, `${S}.support.p2`] },
  {
    heading: `${S}.commission.heading`,
    paragraphs: [`${S}.commission.p1`, `${S}.commission.p2`, `${S}.commission.p3`],
  },
  {
    heading: `${S}.attribution.heading`,
    paragraphs: [`${S}.attribution.p1`, `${S}.attribution.p2`],
  },
  {
    heading: `${S}.independence.heading`,
    paragraphs: [`${S}.independence.p1`, `${S}.independence.p2`],
  },
  { heading: `${S}.promotion.heading`, paragraphs: [`${S}.promotion.p1`] },
  { heading: `${S}.data.heading`, paragraphs: [`${S}.data.p1`, `${S}.data.p2`] },
  { heading: `${S}.term.heading`, paragraphs: [`${S}.term.p1`] },
  {
    heading: `${S}.final.heading`,
    paragraphs: [`${S}.final.p1`, `${S}.final.p2`, `${S}.final.p3`, `${S}.final.p4`],
  },
] as const;

/** The pricing card's list, in its order: what the customer gets is what the offer page says. */
const OFFER_FEATURES = [
  "guided",
  "unlimited",
  "history",
  "deadlines",
  "suppliers",
  "export",
  "updates",
  "call",
] as const;

export interface PartnerContractTerms {
  readonly locale: PartnerContractLocale;
  readonly partnerCompany: string;
  readonly commissionPercent: number;
  /** Null: for as long as the referred customer keeps paying. */
  readonly commissionMonths: number | null;
}

export function buildPartnerContract(terms: PartnerContractTerms): PartnerContractBody {
  const t = partnerContractTranslator(terms.locale);
  const intl = PARTNER_CONTRACT_INTL_LOCALE[terms.locale];
  const period =
    terms.commissionMonths === null
      ? t("partnerContract.document.sections.commission.periodOngoing")
      : t("partnerContract.document.sections.commission.periodMonths", {
          months: terms.commissionMonths,
        });
  const values = {
    price: formatWholeEuro(ANNUAL_NET_CENTS, intl),
    percent: terms.commissionPercent,
    period,
    email: SELLER.email,
    director: SELLER.director,
    seat: SELLER.seat,
  };
  const features = OFFER_FEATURES.map((key) =>
    t.markup(`pricing.tiers.paid.features.${key}`, { cal: (chunks) => chunks }),
  );

  return {
    title: t("partnerContract.document.title"),
    parties: [
      t("partnerContract.document.between"),
      t("partnerContract.document.seller", {
        name: SELLER.name,
        street: SELLER.street,
        city: SELLER.city,
        register: SELLER.register,
        director: SELLER.director,
      }),
      t("partnerContract.document.and"),
      t("partnerContract.document.partner", { company: terms.partnerCompany }),
    ],
    sections: SECTIONS.map((section) => {
      const [first, ...rest] = section.paragraphs.map((key) => ({
        kind: "text" as const,
        text: t(key, values),
      }));
      const offerList =
        "withOfferList" in section ? [{ kind: "list" as const, items: features }] : [];
      return {
        heading: t(section.heading),
        blocks: [first, ...offerList, ...rest],
      };
    }),
  };
}

/**
 * The agreement as plain text, in markdown: what the confirmation email carries and what the
 * acceptance hash is taken over. Built from the stored copy only, so it is the text the signer saw.
 */
export function partnerContractText(body: PartnerContractBody): string {
  return [
    `# ${body.title}`,
    body.parties.join("\n\n"),
    ...body.sections.map((section) =>
      [
        `## ${section.heading}`,
        ...section.blocks.map((block) =>
          block.kind === "text"
            ? block.text
            : block.items.map((item) => `- ${item}`).join("\n"),
        ),
      ].join("\n\n"),
    ),
  ].join("\n\n");
}

export const partnerContractSha256 = (body: PartnerContractBody): string =>
  createHash("sha256").update(partnerContractText(body), "utf8").digest("hex");
