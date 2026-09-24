/**
 * The one definition of "done" and of "journey order" for NIS 2 path items.
 *
 * Both used to live as per-file mirrors (journey.ts, assessment.ts,
 * journey/views.ts, lib/lifecycle) guarded only by "mirrors X" comments; a
 * new terminal status or a changed ordering would have let surfaces drift
 * apart silently — the activation-nudge email once named a different "next
 * step" than the journey view highlighted, for exactly that reason. Import
 * from here; do not restate. Pure module: safe for client components, lib,
 * and server code alike.
 */

import {
  getNis2RequirementsForCategory,
  NIS2_PREREQUISITES,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";

/**
 * Terminal-success statuses of the `item_status` enum. "completed" is the
 * normal user sign-off result, "approved" adds the legal review on top,
 * "not_applicable" is scoped out.
 *
 * Read several ways, and they have to stay one set: the journey and the
 * activation-nudge email call these "done", `getPrerequisiteStatuses` calls
 * them satisfied, and `reopenRequirement` treats exactly these as having
 * something to withdraw. A status that counted as done but was not
 * reopenable would be a dead end in the UI.
 */
export const DONE_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "approved",
  "not_applicable",
]);

export function isDoneStatus(status: string | null | undefined): boolean {
  return DONE_STATUSES.has(status ?? "not_started");
}

/**
 * Criticality tier: 0 is the defensible minimum, 2 is what waits longest.
 *
 * The one mapping from priority to tier. P1 is the middle tier and so is an
 * absent priority, which is what an unclassified requirement should be
 * treated as: neither urgent nor deferrable.
 */
export function priorityRank(priority: string | null | undefined): number {
  if (priority === "P0") return 0;
  if (priority === "P2" || priority === "P3") return 2;
  return 1;
}

/**
 * True journey position of a requirement: urgency first, then process order.
 *
 * Criticality leads because the path is a recommendation about what to do
 * next, and "next" means the most pressing open thing, not the next one
 * alphabetically through the process. Within a tier the category sequence
 * orders, then requirement.sortOrder — which is the index WITHIN its category
 * (0, 1, 2, ...), never a global one. Missing values sink to the end of their
 * tier.
 *
 * Changing this changes every surface at once, deliberately: the guided path,
 * the swimlane's "next up" banner, the activation nudge and the digest all
 * read it, and they are only ever consistent because they read the same
 * function.
 */
export function journeyPosition(
  priority: string | null | undefined,
  categorySortOrder: number | null | undefined,
  requirementSortOrder: number | null | undefined,
): number {
  return (
    priorityRank(priority) * 10_000 +
    (categorySortOrder ?? 99) * 100 +
    (requirementSortOrder ?? 999)
  );
}

/**
 * The 49 codes in journey order. Computed once from framework data; nothing about it depends on
 * a company.
 *
 * Prerequisites win, urgency breaks ties, process order breaks the rest. Before this existed,
 * every surface sorted by urgency alone and ignored the prerequisites the seed had declared in
 * plain words, so the path put "accept the residual risks" (P0) six steps before "build the risk
 * register" (P1) that it says it cannot happen without. Simon caught it on sight.
 *
 * Kahn's algorithm, picking the lowest `journeyPosition` among whatever is ready. A cycle in the
 * data would leave items over; they are appended so nothing vanishes, and the test asserts the
 * real data has none.
 */
function computeJourneyOrder(): readonly string[] {
  const rank = new Map<string, number>();
  for (const [ci, category] of nis2Categories.entries()) {
    for (const [ri, r] of getNis2RequirementsForCategory(category.slug).entries()) {
      rank.set(
        r.code,
        // The index within the category IS the requirement's sortOrder: the seed assigns it
        // from the array position, and the framework type carries no separate field.
        journeyPosition(r.priority, category.sortOrder ?? ci, ri),
      );
    }
  }
  const byRank = (a: string, b: string) =>
    (rank.get(a) ?? 0) - (rank.get(b) ?? 0) || a.localeCompare(b);

  const unmet = new Map([...rank.keys()].map((code) => [code, 0]));
  const dependents = new Map<string, string[]>();
  for (const { prerequisite, blocks } of NIS2_PREREQUISITES) {
    if (!rank.has(prerequisite) || !rank.has(blocks)) continue;
    unmet.set(blocks, (unmet.get(blocks) ?? 0) + 1);
    dependents.set(prerequisite, [...(dependents.get(prerequisite) ?? []), blocks]);
  }

  const order: string[] = [];
  const ready = [...unmet].filter(([, n]) => n === 0).map(([code]) => code);
  while (ready.length > 0) {
    ready.sort(byRank);
    const code = ready.shift();
    if (code === undefined) break;
    order.push(code);
    for (const next of dependents.get(code) ?? []) {
      const left = (unmet.get(next) ?? 1) - 1;
      unmet.set(next, left);
      if (left === 0) ready.push(next);
    }
  }
  const cyclic = [...rank.keys()].filter((code) => !order.includes(code)).sort(byRank);
  return [...order, ...cyclic];
}

export const JOURNEY_ORDER: readonly string[] = computeJourneyOrder();

const JOURNEY_INDEX: ReadonlyMap<string, number> = new Map(
  JOURNEY_ORDER.map((code, i) => [code, i]),
);

/**
 * Where a requirement sits in the journey. Sort by this, everywhere.
 *
 * One argument, because the answer is a property of the framework and not of the row in hand.
 * An unknown code sorts last rather than throwing, since codes arrive from URLs and old emails.
 */
export function journeyIndex(code: string): number {
  return JOURNEY_INDEX.get(code) ?? Number.POSITIVE_INFINITY;
}
