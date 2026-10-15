import type { entityTypeEnum } from "@nisd2/grc-data-model/enums";
import type { Annex, SpecialCaseId } from "./sectors";
import { SIZE_THRESHOLDS } from "./size-thresholds";

/** Reuses DB enum values + "not_in_scope" for companies outside NIS2 scope */
export type EntityClassification =
  | "not_in_scope"
  | (typeof entityTypeEnum.enumValues)[number];

export type CompanySize = "small" | "medium" | "large";

/** Which of the directive's two fine caps an in-scope result carries. */
export type PenaltyTier = "essential" | "important";

export type PenaltyCeiling = {
  tier: PenaltyTier;
  amount: string;
  turnoverPercent: string;
};

/** The directive's minimum caps: Art. 34(4) NIS 2 for essential entities, 34(5) for important ones. */
const PENALTY_CEILINGS: Readonly<Record<PenaltyTier, PenaltyCeiling>> = {
  essential: { tier: "essential", amount: "EUR 10,000,000", turnoverPercent: "2%" },
  important: { tier: "important", amount: "EUR 7,000,000", turnoverPercent: "1.4%" },
};

export type ClassificationResult = {
  classification: EntityClassification;
  size: CompanySize | null;
  annexes: Annex[];
  reason:
    | "excluded"
    | "no_sector"
    | "below_threshold"
    | "special_case"
    | "size_and_sector";
  penaltyCeiling: PenaltyCeiling | null;
  supervision: "proactive" | "reactive" | null;
};

export function computeSize(input: {
  employees: number;
  turnover: number;
  balanceSheet: number;
}): CompanySize {
  const { employees, turnover, balanceSheet } = input;
  const reaches = (limit: (typeof SIZE_THRESHOLDS)[keyof typeof SIZE_THRESHOLDS]) =>
    employees >= limit.employees ||
    (turnover > limit.turnover && balanceSheet > limit.balanceSheet);

  if (reaches(SIZE_THRESHOLDS.large)) return "large";
  if (reaches(SIZE_THRESHOLDS.medium)) return "medium";
  return "small";
}

export function classify(input: {
  excluded: boolean;
  sectors: { sectorId: string; annex: Annex }[];
  specialCases: SpecialCaseId[];
  size?: CompanySize;
}): ClassificationResult {
  const { excluded, sectors, specialCases, size } = input;

  if (excluded) {
    return {
      classification: "not_in_scope",
      size: null,
      annexes: [],
      reason: "excluded",
      penaltyCeiling: null,
      supervision: null,
    };
  }

  // Special cases — in scope regardless of size
  if (specialCases.length > 0) {
    const annexes = [...new Set(sectors.map((s) => s.annex))];
    const isKritis = specialCases.includes("kritis");
    const ALWAYS_ESSENTIAL: SpecialCaseId[] = [
      "qtsp",
      "tld_registry",
      "dns_provider",
      "sole_provider",
      "oes_legacy",
    ];
    const hasAlwaysEssential = specialCases.some((sc) => ALWAYS_ESSENTIAL.includes(sc));
    const isTelecom = specialCases.includes("telecom_provider");

    // KRITIS → highest classification
    if (isKritis) {
      return {
        classification: "kritis",
        size: size ?? null,
        annexes,
        reason: "special_case",
        penaltyCeiling: PENALTY_CEILINGS.essential,
        supervision: "proactive",
      };
    }

    // qTSP, TLD, DNS, sole provider, OES legacy → essential regardless of size (Art 3(1)(b))
    if (hasAlwaysEssential) {
      return {
        classification: "essential",
        size: size ?? null,
        annexes,
        reason: "special_case",
        penaltyCeiling: PENALTY_CEILINGS.essential,
        supervision: "proactive",
      };
    }

    // Telecom: medium+ → essential (Art 3(1)(c)), small → important (Art 2(2)(a)(i))
    if (isTelecom && (size === "medium" || size === "large")) {
      return {
        classification: "essential",
        size: size ?? null,
        annexes,
        reason: "special_case",
        penaltyCeiling: PENALTY_CEILINGS.essential,
        supervision: "proactive",
      };
    }

    // Non-qualified TSP (Art 2(2)(a)(ii)), domain registrar (Art 2(4)),
    // or small telecom → important regardless of size
    return {
      classification: "important",
      size: size ?? null,
      annexes,
      reason: "special_case",
      penaltyCeiling: PENALTY_CEILINGS.important,
      supervision: "reactive",
    };
  }

  if (sectors.length === 0) {
    return {
      classification: "not_in_scope",
      size: null,
      annexes: [],
      reason: "no_sector",
      penaltyCeiling: null,
      supervision: null,
    };
  }

  if (!size || size === "small") {
    return {
      classification: "not_in_scope",
      size: size ?? null,
      annexes: [...new Set(sectors.map((s) => s.annex))],
      reason: "below_threshold",
      penaltyCeiling: null,
      supervision: null,
    };
  }

  const annexes = [...new Set(sectors.map((s) => s.annex))];
  const hasAnnexI = annexes.includes("I");

  // Large + Annex I → essential
  if (size === "large" && hasAnnexI) {
    return {
      classification: "essential",
      size,
      annexes,
      reason: "size_and_sector",
      penaltyCeiling: PENALTY_CEILINGS.essential,
      supervision: "proactive",
    };
  }

  // Medium (any annex), or Large + Annex II only → important
  return {
    classification: "important",
    size,
    annexes,
    reason: "size_and_sector",
    penaltyCeiling: PENALTY_CEILINGS.important,
    supervision: "reactive",
  };
}
