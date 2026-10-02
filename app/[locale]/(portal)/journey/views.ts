/**
 * Journey item shape + the single derived helper the path view needs.
 *
 * The role-projection views (CEO/CISO/Auditor/MSP/Everything) were retired in
 * favour of the swimlane path, so this file is now just the JourneyItem type
 * and liveNode (the first not-done requirement in journey order).
 */

import { isDoneStatus, journeyIndex } from "@/lib/compliance/journey-position";

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
  /**
   * Filled in through the walkthrough and waiting for management's sign-off there. The work is
   * done, the signature is management's step, so the path moves on past it.
   */
  awaitingSignOff: boolean;
};

function isDone(item: JourneyItem): boolean {
  return isDoneStatus(item.status);
}

/** True journey position: the one order every surface sorts by. */
function journeyOrder(item: JourneyItem): number {
  return journeyIndex(item.code);
}

/**
 * The single live node for the path view: the first requirement in journey
 * order that is neither done nor waiting for management's sign-off. Returns
 * null when nothing is left to work on.
 */
export function liveNode(items: JourneyItem[]): JourneyItem | null {
  const open = items
    .filter((i) => !isDone(i) && !i.awaitingSignOff)
    .sort((a, b) => journeyOrder(a) - journeyOrder(b));
  return open[0] ?? null;
}
