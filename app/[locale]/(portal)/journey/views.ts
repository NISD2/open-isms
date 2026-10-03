/**
 * Journey item shape + the single derived helper the path view needs.
 *
 * The role-projection views (CEO/CISO/Auditor/MSP/Everything) were retired in
 * favour of the swimlane path, so this file is now just the JourneyItem type
 * and liveNode (the first not-done requirement in journey order).
 */

import {
  type DotState,
  isDoneState,
  journeyIndex,
} from "@/lib/compliance/journey-position";
import type { CoveredBy } from "@/lib/durchgang";

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
  /** Where the item stands on the journey, from its status and the walkthrough (`coveredState`). */
  state: DotState;
  /** What decided `state` when it was not work on the requirement itself, else null. */
  coveredBy: CoveredBy | null;
};

function isDone(item: JourneyItem): boolean {
  return isDoneState(item.state);
}

/** True journey position: the one order every surface sorts by. */
function journeyOrder(item: JourneyItem): number {
  return journeyIndex(item.code);
}

/**
 * The single live node for the path view: the first requirement in journey
 * order that still needs work, which is anything not done and not waiting for
 * management's sign-off, plus a review that is overdue. Else the first one
 * waiting for sign-off, the order the walkthrough resumes in. Returns null
 * when everything is done. A requirement waiting on the walk item that carries
 * it is never the next step: the item is.
 */
export function liveNode(items: readonly JourneyItem[]): JourneyItem | null {
  const left = items
    .filter((i) => !isDone(i) && i.coveredBy === null)
    .toSorted((a, b) => journeyOrder(a) - journeyOrder(b));
  const overdue = (i: JourneyItem) => i.dueInDays !== null && i.dueInDays < 0;
  return left.find((i) => i.state !== "awaiting" || overdue(i)) ?? left[0] ?? null;
}
