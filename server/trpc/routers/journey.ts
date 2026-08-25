import { eq, and, asc, count } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import {
  companyRequirementStatus,
  requirement,
  requirementCategory,
  requirementAssignment,
  user,
} from "@/schema";
import { env } from "@/lib/env";
import { daysUntilDeadline } from "@/lib/compliance/deadlines";
import { isJourneyAllowed } from "@/lib/journey-flag";
import {
  getRequirementsMessages,
  getRequirementTitle,
  getRequirementDescription,
} from "@/lib/messages";
import { getNis2Assessment } from "../helpers/nis2-scope";

/**
 * Terminal/done statuses. "completed" is the normal user sign-off result,
 * "approved" adds the legal review on top, "not_applicable" is scoped out.
 * (This view previously omitted "completed", which wrongly counted
 * user-signed requirements as still open.) Mirrors DONE_STATUSES in
 * assessment.ts.
 */
function isDoneStatus(s: string): boolean {
  return s === "completed" || s === "approved" || s === "not_applicable";
}

/**
 * Statuses where companyRequirementStatus.nextReviewDate is a recurring REVIEW
 * date (vs the initial implementation deadline written to not-done rows by
 * backfillInitialDeadlines / the deadlines cron). completed/approved only: a
 * needs_review item surfaces via the separate "Awaiting" signal instead, so it
 * is not double-counted as both awaiting and review-due.
 */
function isReviewStatus(s: string): boolean {
  return s === "completed" || s === "approved";
}

/**
 * Journey view data source.
 *
 * Returns the flat list of items the path view needs: one row per requirement
 * × company for the NIS2 framework, joined with requirement + category
 * metadata, with the i18n title resolved server-side.
 *
 * signOff: per requirement, how many of the assigned sign-offs are done
 * ({ signed, total }) from requirement_assignment. total is 0 for a
 * requirement nobody has been assigned to / signed yet; for an N-of-M
 * management sign-off the N signer rows are pre-assigned, so signed/total
 * reads "2 of 3". Read-only aggregate, tenant-scoped via the assessment.
 */
export const journeyRouter = router({
  getItems: companyProcedure
    .input(z.object({ locale: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
    // Defense-in-depth: page.tsx redirects unauthorised users from the
    // /journey route, but the tRPC procedure itself must also gate or
    // someone could call it directly and probe the feature's data shape.
    // Same predicate, same env var → single source of truth.
    if (!isJourneyAllowed(ctx.session.user.email, env.JOURNEY_ALLOWED_DOMAINS)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Journey feature not available for this account.",
      });
    }

    const cid = ctx.companyId;

    const emptyAggregate = {
      total: 0,
      done: 0,
      awaitingSignoff: 0,
      overdue: 0,
      dueSoon: 0,
      open: 0,
    };

    // NIS 2 only. Without this filter a company holding both a NIS 2 and a
    // GDPR assessment would get whichever was inserted first, and the
    // projection would silently fall apart because category codes would not
    // match CISO_CATS / MSP_CATS.
    const assessment = await getNis2Assessment(ctx.db, cid);
    if (!assessment) {
      return { items: [], isManagement: false, aggregate: emptyAggregate };
    }

    const [rows, signOffRows, currentUserRow] = await Promise.all([
      ctx.db
        .select({
          statusId: companyRequirementStatus.id,
          requirementId: companyRequirementStatus.requirementId,
          status: companyRequirementStatus.status,
          signedOffAt: companyRequirementStatus.signedOffAt,
          nextReviewDate: companyRequirementStatus.nextReviewDate,
          code: requirement.code,
          priority: requirement.priority,
          frequency: requirement.frequency,
          legalRef: requirement.legalRef,
          frameworkRef: requirement.frameworkRef,
          requiredSignOffRole: requirement.requiredSignOffRole,
          sortOrder: requirement.sortOrder,
          categoryCode: requirementCategory.code,
          categorySlug: requirementCategory.slug,
        })
        .from(companyRequirementStatus)
        .innerJoin(
          requirement,
          eq(companyRequirementStatus.requirementId, requirement.id),
        )
        .innerJoin(
          requirementCategory,
          eq(requirement.categoryId, requirementCategory.id),
        )
        .where(eq(companyRequirementStatus.assessmentId, assessment.id))
        .orderBy(asc(requirement.sortOrder)),
      // Per-requirement sign-off progress: one row per assigned signer in
      // requirement_assignment (signedOffAt NULL until they sign). Aggregated
      // here with GROUP BY so there is no per-requirement N+1; count of the
      // nullable signedOffAt column counts only the signed rows. Tenant-scoped
      // by joining through this company's assessment.
      ctx.db
        .select({
          statusId: requirementAssignment.statusId,
          total: count(requirementAssignment.id),
          signed: count(requirementAssignment.signedOffAt),
        })
        .from(requirementAssignment)
        .innerJoin(
          companyRequirementStatus,
          eq(requirementAssignment.statusId, companyRequirementStatus.id),
        )
        .where(eq(companyRequirementStatus.assessmentId, assessment.id))
        .groupBy(requirementAssignment.statusId),
      ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id),
        columns: { isManagement: true },
      }),
    ]);

    // statusId → { signed, total } sign-off progress.
    const signOffByStatusId = new Map<
      string,
      { signed: number; total: number }
    >();
    for (const r of signOffRows) {
      signOffByStatusId.set(r.statusId, {
        signed: Number(r.signed),
        total: Number(r.total),
      });
    }

    // Resolve requirement titles/descriptions in the caller's locale.
    // getRequirementsMessages validates the value and falls back to English
    // per-key for untranslated entries.
    const requirements = await getRequirementsMessages(input?.locale ?? "en");
    const nowDate = new Date();
    const items = rows.map((r) => {
      const status = r.status ?? "not_started";
      const dueAt = r.nextReviewDate ? new Date(r.nextReviewDate) : null;
      // nextReviewDate means a recurring REVIEW date only on review-relevant
      // statuses (matches dashboard.ts). On not-done items the same column
      // holds the initial implementation deadline, a different concept, so we
      // do not surface it as a review here. One canonical calendar-day delta
      // (daysUntilDeadline) drives every overdue/dueSoon/pill decision.
      const dueInDays =
        dueAt && isReviewStatus(status)
          ? daysUntilDeadline(dueAt, nowDate)
          : null;
      return {
        id: r.statusId,
        code: r.code,
        title: getRequirementTitle(requirements, r.code),
        description: getRequirementDescription(requirements, r.code),
        categoryCode: r.categoryCode,
        categorySlug: r.categorySlug,
        status,
        priority: r.priority,
        frequency: r.frequency,
        legalRef: r.legalRef,
        frameworkRef: r.frameworkRef,
        requiredSignOffRole: r.requiredSignOffRole,
        dueAt,
        dueInDays,
        signedOffAt: r.signedOffAt,
        sortOrder: r.sortOrder ?? 999,
        signOff: signOffByStatusId.get(r.statusId) ?? { signed: 0, total: 0 },
      };
    });

    // Company-wide aggregates, a reality check shown across the path view.
    const aggregate = {
      total: items.length,
      done: items.filter((i) => isDoneStatus(i.status)).length,
      awaitingSignoff: items.filter((i) => i.status === "needs_review").length,
      // Recurring-review cycle (only on review-status items, so a never-done
      // item past its initial deadline is NOT mislabelled "review overdue").
      overdue: items.filter((i) => i.dueInDays !== null && i.dueInDays < 0)
        .length,
      dueSoon: items.filter(
        (i) => i.dueInDays !== null && i.dueInDays >= 0 && i.dueInDays <= 30,
      ).length,
      open: items.filter((i) => !isDoneStatus(i.status)).length,
    };

    return {
      items,
      isManagement: currentUserRow?.isManagement ?? false,
      aggregate,
    };
  }),
});
