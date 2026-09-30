/**
 * BSI 200-3 Risk Methodology Defaults
 *
 * Pre-filled scale definitions with locale-aware labels.
 * Users can edit these after seeding — labels are stored in DB, not i18n.
 *
 * The scales are Tabelle 8 and Tabelle 9 of BSI-Standard 200-3, read from ./bsi-200-3.
 */

import { FREQUENCIES, FREQUENCY_TEXT, IMPACT_TEXT, IMPACTS } from "./bsi-200-3";

export interface ScaleLevel {
  value: number;
  label: string;
  description: string;
}

export interface RiskMethodologyData {
  name: string;
  likelihoodLevels: ScaleLevel[];
  impactLevels: ScaleLevel[];
  acceptanceThreshold: number;
  includesOt: boolean;
}

export function getDefaultMethodology(locale: "en" | "de"): RiskMethodologyData {
  return {
    name: "BSI 200-3",
    likelihoodLevels: FREQUENCIES.map((f, i) => ({
      value: i + 1,
      ...FREQUENCY_TEXT[locale][f],
    })),
    impactLevels: IMPACTS.map((impact, i) => ({
      value: i + 1,
      ...IMPACT_TEXT[locale][impact],
    })),
    acceptanceThreshold: 4,
    includesOt: false,
  };
}

/** Risk score color thresholds for any N×M matrix */
export function getRiskScoreColor(
  score: number,
  maxScore: number,
): "low" | "medium" | "high" | "critical" {
  const ratio = score / maxScore;
  if (ratio <= 0.25) return "low";
  if (ratio <= 0.5) return "medium";
  if (ratio <= 0.75) return "high";
  return "critical";
}

export const RISK_SCORE_COLORS = {
  low: "bg-emerald-500 text-white",
  medium: "bg-amber-500 text-white",
  high: "bg-orange-500 text-white",
  critical: "bg-red-600 text-white",
} as const;
