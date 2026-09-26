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
import { journeyIndex } from "@/lib/compliance/journey-position";
import {
  getRequirementDescription,
  getRequirementsMessages,
  getRequirementTitle,
} from "@/lib/messages";
import type { JourneyItem } from "../(portal)/journey/views";

/**
 * Everything before this point on the PATH is signed off.
 *
 * Keyed to path position, not to the order this file happens to build rows
 * in: the path runs by deadline, so a sample that marks the first seven rows
 * of the source list done would show progress scattered through a path that
 * exists to avoid exactly that.
 */
const FRONTIER_STEP = 7;

/**
 * Past the frontier, a few steps touched out of order: what real progress
 * looks like, and what puts the remaining states on screen.
 */
const SAMPLE_STATUS_AT: Record<number, string> = {
  7: "in_progress",
  8: "needs_review",
  10: "not_applicable",
  13: "needs_review",
  16: "rejected",
};

function sampleStatus(step: number): string {
  if (step < FRONTIER_STEP) return "completed";
  return SAMPLE_STATUS_AT[step] ?? "not_started";
}

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
    .sort((a, b) => journeyIndex(a.req.code) - journeyIndex(b.req.code))
    .map(({ req, category, indexInCategory }, step) => ({
      id: req.id,
      code: req.code,
      title: getRequirementTitle(messages, req.code),
      description: getRequirementDescription(messages, req.code),
      categoryCode: category.code,
      categorySlug: category.slug,
      status: sampleStatus(step),
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
