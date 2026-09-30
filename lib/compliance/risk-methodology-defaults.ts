/**
 * BSI 200-3 Risk Methodology Defaults
 *
 * Pre-filled scale definitions with locale-aware labels.
 * Users can edit these after seeding — labels are stored in DB, not i18n.
 *
 * German labels and descriptions are BSI-Standard 200-3 v1.0 (2017), Tabelle 8
 * (Eintrittshäufigkeit) and Tabelle 9 (Schadensauswirkungen), word for word. The
 * English is our translation of the same tables.
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
            {
              value: 1,
              label: "Selten",
              description:
                "Ereignis könnte nach heutigem Kenntnisstand höchstens alle fünf Jahre eintreten.",
            },
            {
              value: 2,
              label: "Mittel",
              description:
                "Ereignis tritt einmal alle fünf Jahre bis einmal im Jahr ein.",
            },
            {
              value: 3,
              label: "Häufig",
              description: "Ereignis tritt einmal im Jahr bis einmal pro Monat ein.",
            },
            {
              value: 4,
              label: "Sehr häufig",
              description: "Ereignis tritt mehrmals im Monat ein.",
            },
          ]
        : [
            {
              value: 1,
              label: "Rare",
              description:
                "By current knowledge, the event could occur at most once every five years.",
            },
            {
              value: 2,
              label: "Medium",
              description:
                "The event occurs between once every five years and once a year.",
            },
            {
              value: 3,
              label: "Frequent",
              description: "The event occurs between once a year and once a month.",
            },
            {
              value: 4,
              label: "Very frequent",
              description: "The event occurs several times a month.",
            },
          ],
    impactLevels:
      locale === "de"
        ? [
            {
              value: 1,
              label: "Vernachlässigbar",
              description:
                "Die Schadensauswirkungen sind gering und können vernachlässigt werden.",
            },
            {
              value: 2,
              label: "Begrenzt",
              description: "Die Schadensauswirkungen sind begrenzt und überschaubar.",
            },
            {
              value: 3,
              label: "Beträchtlich",
              description: "Die Schadensauswirkungen können beträchtlich sein.",
            },
            {
              value: 4,
              label: "Existenzbedrohend",
              description:
                "Die Schadensauswirkungen können ein existenziell bedrohliches, katastrophales Ausmaß erreichen.",
            },
          ]
        : [
            {
              value: 1,
              label: "Negligible",
              description: "The damage is minor and can be disregarded.",
            },
            {
              value: 2,
              label: "Limited",
              description: "The damage is limited and manageable.",
            },
            {
              value: 3,
              label: "Considerable",
              description: "The damage can be considerable.",
            },
            {
              value: 4,
              label: "Existential",
              description:
                "The damage can reach an existentially threatening, catastrophic scale.",
            },
          ],
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
