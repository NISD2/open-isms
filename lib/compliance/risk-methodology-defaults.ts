/**
 * BSI 200-3 Risk Methodology Defaults
 *
 * Pre-filled scale definitions with locale-aware labels.
 * Users can edit these after seeding — labels are stored in DB, not i18n.
 */

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
    likelihoodLevels:
      locale === "de"
        ? [
            { value: 1, label: "Selten", description: "Einmal in 5+ Jahren, unwahrscheinliches Szenario" },
            { value: 2, label: "Möglich", description: "Einmal alle 1–5 Jahre, plausibles Szenario" },
            { value: 3, label: "Häufig", description: "Einmal pro Jahr, regelmäßig beobachtet" },
            { value: 4, label: "Sehr häufig", description: "Mehrmals pro Jahr, zu erwarten" },
          ]
        : [
            { value: 1, label: "Rare", description: "Once in 5+ years, unlikely scenario" },
            { value: 2, label: "Possible", description: "Once every 1–5 years, plausible scenario" },
            { value: 3, label: "Likely", description: "Once per year, regularly observed" },
            { value: 4, label: "Very likely", description: "Multiple times per year, expected" },
          ],
    impactLevels:
      locale === "de"
        ? [
            { value: 1, label: "Vernachlässigbar", description: "Geringfügige Störung, kein bleibender Schaden" },
            { value: 2, label: "Begrenzt", description: "Begrenzter Schaden, Wiederherstellung in Tagen" },
            { value: 3, label: "Beträchtlich", description: "Erheblicher Schaden, großer Wiederherstellungsaufwand" },
            { value: 4, label: "Existenzbedrohend", description: "Gefährdet Unternehmensfortbestand oder Regulierungsmaßnahmen" },
          ]
        : [
            { value: 1, label: "Negligible", description: "Minor disruption, no lasting damage" },
            { value: 2, label: "Limited", description: "Limited damage, recoverable within days" },
            { value: 3, label: "Considerable", description: "Significant damage, major recovery effort" },
            { value: 4, label: "Existential", description: "Threatens company survival or regulatory action" },
          ],
    acceptanceThreshold: 4,
    includesOt: false,
  };
}

/** Risk score color thresholds for any N×M matrix */
export function getRiskScoreColor(score: number, maxScore: number): "low" | "medium" | "high" | "critical" {
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
