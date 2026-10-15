import "@/lib/server-guard";
import { getNis2CzechRef } from "@nisd2/grc-data-model/frameworks";
import { czechDutyCitation } from "./czech-law";

/**
 * The one-line legal reference a NIS 2 requirement shows in a list (the journey, a category's
 * cards): on a Czech page its place in Czech law, as the walk's duty card cites it; on any other
 * page, or for a code Czech law has no place for, the BSIG `legalRef`.
 */
export const nis2LegalRef = (
  code: string,
  legalRef: string | null,
  locale: string | undefined,
): string | null =>
  locale === "cs" ? (czechDutyCitation(getNis2CzechRef(code))?.cite ?? legalRef) : legalRef;
