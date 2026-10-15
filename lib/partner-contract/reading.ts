/**
 * Which languages an agreement is read in, and which text binds for each reader. A Czech partner
 * reads a translation of the English offer; what they accept stays the English text (./document),
 * and the acceptance records the translation's hash beside the English one.
 */
import {
  BINDING_CONTRACT_LOCALE,
  CONTRACT_TRANSLATION_LOCALES,
  isContractTranslationLocale,
} from "@/lib/legal/contract-language";
import { partnerContractLocaleEnum } from "@/schema";
import {
  type PartnerContractLocale,
  type PartnerContractReadingLocale,
  partnerContractSha256,
  partnerContractTranslation,
} from "./document";

/** Every language an admin can hand an agreement out in: the binding ones, then the translations. */
export const PARTNER_CONTRACT_READING_LOCALES = [
  ...partnerContractLocaleEnum.enumValues,
  ...CONTRACT_TRANSLATION_LOCALES,
] as const;

/** The text that binds for a reader: their own language where we offer one, else the English. */
export const bindingLocaleFor = (
  reader: PartnerContractReadingLocale,
): PartnerContractLocale =>
  isContractTranslationLocale(reader) ? BINDING_CONTRACT_LOCALE : reader;

type StoredOffer = Parameters<typeof partnerContractTranslation>[0];

/** The language a stored offer is shown in to someone who asks for `requested`, as its page shows it. */
export const readingLocaleOf = (
  offer: StoredOffer,
  requested: string,
): PartnerContractReadingLocale =>
  partnerContractTranslation(offer, requested)?.locale ?? offer.locale;

/**
 * What an acceptance records about the text in front of the signer, for someone who asked for
 * `requested`: the language, and for a translation its hash, taken over the translation exactly as
 * the page builds it. The binding text's own hash is the stored one's.
 */
export const signedReadingOf = (
  offer: StoredOffer,
  requested: string,
): {
  readonly signedReadingLocale: PartnerContractReadingLocale;
  readonly signedTranslationSha256: string | null;
} => {
  const translation = partnerContractTranslation(offer, requested);
  return translation
    ? {
        signedReadingLocale: translation.locale,
        signedTranslationSha256: partnerContractSha256(translation.body),
      }
    : { signedReadingLocale: offer.locale, signedTranslationSha256: null };
};

/**
 * Every language a stored offer can be read in, its binding text first. A translation counts only
 * while it still matches the stored text, so a link in that language never opens a different one.
 */
export const readingLocalesOf = (
  offer: StoredOffer,
): readonly PartnerContractReadingLocale[] => [
  offer.locale,
  ...CONTRACT_TRANSLATION_LOCALES.filter(
    (reader) => readingLocaleOf(offer, reader) === reader,
  ),
];
