import { nis2GdprSatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";
import { NIS2_WALK } from "./nis2";

const NIS2_ORDER = NIS2_WALK.items.map((item) => item.code);

/**
 * The NIS 2 items whose work gives a GDPR item a head start, in the NIS 2 walk's order: the
 * overlapping pairs of the data model. A hint for the person, never a sign-off; the GDPR item is
 * signed on its own (`satisfactionTargets` credits only equivalent links).
 */
export const headStartsOf = (gdprCode: string): readonly string[] => {
  const codes = new Set(
    nis2GdprSatisfactionPairs.flatMap(([nis2, gdpr]) =>
      gdpr === gdprCode ? [nis2] : [],
    ),
  );
  return NIS2_ORDER.filter((code) => codes.has(code));
};
