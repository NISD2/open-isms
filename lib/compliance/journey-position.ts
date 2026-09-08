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
 * True journey position of a requirement. requirement.sortOrder is the
 * index WITHIN its category (0, 1, 2, ...), not a global order, so the
 * category sequence orders first, then that index. Missing values sink to
 * the end of their tier.
 */
export function journeyPosition(
  categorySortOrder: number | null | undefined,
  requirementSortOrder: number | null | undefined,
): number {
  return (categorySortOrder ?? 99) * 100 + (requirementSortOrder ?? 999);
}
