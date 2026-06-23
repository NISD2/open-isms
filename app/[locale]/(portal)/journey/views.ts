/**
 * Journey item shape + the single derived helper the path view needs.
 *
 * The role-projection views (CEO/CISO/Auditor/MSP/Everything) were retired in
 * favour of the swimlane path, so this file is now just the JourneyItem type
 * and liveNode (the first not-done requirement in journey order).
 */

import { nis2Categories } from "@nisd2/grc-data-model/frameworks";

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
  signedOffAt: Date | null;
  sortOrder: number;
  /** Assigned sign-offs done vs required, for N-of-M management sign-off. */
  signOff: { signed: number; total: number };
};

/**
 * Terminal-success status. Schema `item_status` enum:
 * not_started / in_progress / completed / not_applicable / needs_review /
 * approved / rejected. "completed" is the normal user sign-off result,
 * "approved" adds the legal review; both (plus not_applicable) are done.
 */
function isDone(item: JourneyItem): boolean {
  return (
    item.status === "completed" ||
    item.status === "approved" ||
    item.status === "not_applicable"
  );
}

const CAT_ORDER: Record<string, number> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.sortOrder]),
);

/**
 * True journey position. requirement.sortOrder is the requirement's index
 * within its category (0, 1, 2, ...), not a global order, so order by the
 * category sequence first, then that index.
 */
function journeyOrder(item: JourneyItem): number {
  return (CAT_ORDER[item.categoryCode] ?? 99) * 100 + item.sortOrder;
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
