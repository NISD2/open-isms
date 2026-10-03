import type { Frequency, Impact } from "@/lib/compliance/bsi-200-3";
import { fromScale } from "@/lib/durchgang/ratings";

/** The key of one cell of the BSI 200-3 matrix. */
export const cellKey = (frequency: Frequency, impact: Impact) => `${frequency}:${impact}`;

/** How many of these risks sit in each cell; a risk off the 200-3 scales is in none. */
export function riskCounts(
  risks: ReadonlyArray<{ readonly likelihood: number; readonly impact: number }>,
): Record<string, number> {
  return risks.reduce<Record<string, number>>((counts, risk) => {
    const rating = fromScale(risk.likelihood, risk.impact);
    if (!rating) return counts;
    const key = cellKey(rating.frequency, rating.impact);
    return { ...counts, [key]: (counts[key] ?? 0) + 1 };
  }, {});
}
