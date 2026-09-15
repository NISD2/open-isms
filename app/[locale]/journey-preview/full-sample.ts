/**
 * The whole NIS 2 path as sample data, for the /journey-preview design route.
 *
 * Built from the real framework definition and the real requirement message
 * bundles, so the preview shows the 49 steps a seeded company actually gets,
 * with their real codes, titles, priorities and legal references. Only the
 * per-company progress is invented, and it is invented deterministically:
 * a render must not change between server and client.
 */
import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import {
  getRequirementDescription,
  getRequirementsMessages,
  getRequirementTitle,
} from "@/lib/messages";
import type { JourneyItem } from "../(portal)/journey/views";

/** A believable mid-implementation company, keyed by global step index. */
const SAMPLE_STATUS: Record<number, string> = {
  0: "completed",
  1: "completed",
  2: "completed",
  3: "completed",
  4: "completed",
  5: "completed",
  6: "completed",
  7: "in_progress",
  // The frontier: a few later steps touched out of order, which is what real
  // progress looks like and what puts the remaining states on screen.
  8: "needs_review",
  10: "not_applicable",
  13: "needs_review",
  16: "rejected",
};

/** Recurring-review clocks on a few signed-off items (negative = overdue). */
const SAMPLE_DUE_IN_DAYS: Record<number, number> = {
  1: 210,
  3: -6,
  5: 40,
};

export async function buildFullJourneyItems(locale: string): Promise<JourneyItem[]> {
  const messages = await getRequirementsMessages(locale);
  const categories = [...nis2Categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return categories
    .flatMap((category) =>
      getNis2RequirementsForCategory(category.slug).map((req, indexInCategory) => ({
        req,
        category,
        indexInCategory,
      })),
    )
    .map(({ req, category, indexInCategory }, step) => ({
      id: req.id,
      code: req.code,
      title: getRequirementTitle(messages, req.code),
      description: getRequirementDescription(messages, req.code),
      categoryCode: category.code,
      categorySlug: category.slug,
      status: SAMPLE_STATUS[step] ?? "not_started",
      priority: req.priority,
      frequency: req.frequency,
      legalRef: req.legalRef || null,
      frameworkRef: req.frameworkRef,
      requiredSignOffRole: req.requiredSignOffRole,
      dueAt: null,
      dueInDays: SAMPLE_DUE_IN_DAYS[step] ?? null,
      signedOffAt: null,
      sortOrder: indexInCategory,
      signOff: { signed: 0, total: 0 },
    }));
}
