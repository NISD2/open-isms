/**
 * Journey item shape + the single derived helper the path view needs.
 *
 * The role-projection views (CEO/CISO/Auditor/MSP/Everything) were retired in
 * favour of the swimlane path, so this file is now just the JourneyItem type
 * and liveNode (the first not-done requirement in journey order).
 */

import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import { isDoneStatus, journeyPosition } from "@/lib/compliance/journey-position";

export type JourneyItem = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  categoryCode: string;
  categorySlug: string;
  status: string;
  priority: string | null;
  frequency: string | null;
  legalRef: string | null;
  frameworkRef: string | null;
  requiredSignOffRole: string | null;
  dueAt: Date | null;
  /** Calendar days until the recurring review (negative = overdue); null when
   *  the item has no review date (not-done items carry only an initial
   *  implementation deadline, which is not surfaced as a review). */
  dueInDays: number | null;
  signedOffAt: Date | null;
  sortOrder: number;
  /** Assigned sign-offs done vs required, for N-of-M management sign-off. */
  signOff: { signed: number; total: number };
};

function isDone(item: JourneyItem): boolean {
  return isDoneStatus(item.status);
}

const CAT_ORDER: Record<string, number> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.sortOrder]),
);

/** True journey position — the shared category-weighted order. */
function journeyOrder(item: JourneyItem): number {
  return journeyPosition(CAT_ORDER[item.categoryCode], item.sortOrder);
}

/**
 * The single live node for the path view: the first not-done requirement in
 * journey order. Returns null when the path is complete.
 */
export function liveNode(items: JourneyItem[]): JourneyItem | null {
  const open = items
    .filter((i) => !isDone(i))
    .sort((a, b) => journeyOrder(a) - journeyOrder(b));
  return open[0] ?? null;
}
