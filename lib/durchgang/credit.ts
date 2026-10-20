import { nis2GdprSatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";
import type { WalkFramework } from "./types";

/** An item of a walk, by its law and code. */
interface WalkCode {
  readonly framework: WalkFramework;
  readonly code: string;
}

/**
 * The other walk's items a signature on `code` also counts for: those linked to it as
 * `equivalent`, where one record is the same in both laws and the sign-off credits it
 * (propagateSatisfaction). An `overlapping` link counts for nothing, so an approval never
 * signs anything off in the other walk through it.
 */
export const alsoCountsFor = (code: string): readonly WalkCode[] =>
  nis2GdprSatisfactionPairs.flatMap(([nis2, gdpr, , kind]): WalkCode[] => {
    if (kind !== "equivalent") return [];
    if (nis2 === code) return [{ framework: "gdpr", code: gdpr }];
    if (gdpr === code) return [{ framework: "nis2", code: nis2 }];
    return [];
  });
