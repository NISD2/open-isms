/**
 * Journey item shape + the single derived helper the path view needs.
 *
 * The role-projection views (CEO/CISO/Auditor/MSP/Everything) were retired in
 * favour of the swimlane path, so this file is now just the JourneyItem type
 * and liveNode (the first not-done requirement in journey order).
 */

import { type DotState, nextOnJourney } from "@/lib/compliance/journey-position";
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

/**
 * The single live node for the path view (`nextOnJourney`, the rule the emails name too), where
 * a review past its date also counts as work.
 */
export function liveNode(items: readonly JourneyItem[]): JourneyItem | null {
  return nextOnJourney(items, (i) => i.dueInDays !== null && i.dueInDays < 0);
}
