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
