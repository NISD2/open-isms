import { and, asc, count, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { daysUntilDeadline } from "@/lib/compliance/deadlines";
import { isDoneState, journeyState } from "@/lib/compliance/journey-position";
import {
  type Covering,
  coveredState,
  type DurchgangAction,
  itemState,
  walkOf,
} from "@/lib/durchgang";
import {
  getRequirementDescription,
  getRequirementsMessages,
  getRequirementTitle,
} from "@/lib/messages";
import {
  auditLog,
  company,
  companyRequirementStatus,
  journeyModeEnum,
  requirement,
  requirementAssignment,
  requirementCategory,
  user,
} from "@/schema";
import { latestWalkEvents } from "../helpers/durchgang";
import { getNis2Assessment } from "../helpers/nis2-scope";
import { companyProcedure, router } from "../init";

/**
 * Statuses where companyRequirementStatus.nextReviewDate is a recurring REVIEW
 * date (vs the initial implementation deadline written to not-done rows by
 * backfillInitialDeadlines / the deadlines cron). Includes needs_review: the
 * cron is the only writer of that status, flipping a completed/approved item
 * whose review date passed, so its date is a real review deadline. This
 * matches dashboard.ts and digest.ts — before, the dashboard counted a
 * cron-flipped item as overdue while this router filed it under "awaiting",
 * and the two headline numbers disagreed. Double-counting is avoided in the
 * aggregate below: an overdue needs_review item counts as overdue only.
 */
function isReviewStatus(s: string): boolean {
  return s === "completed" || s === "approved" || s === "needs_review";
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
      const cid = ctx.companyId;

      const emptyAggregate = {
        total: 0,
        done: 0,
        awaitingSignoff: 0,
        overdue: 0,
        dueSoon: 0,
        open: 0,
      };

      // Two independent reads, so they go together.
      //
      // The assessment lookup is NIS 2 only. Without that filter a company
      // holding both a NIS 2 and a GDPR assessment would get whichever was
      // inserted first, and the projection would silently fall apart because
      // category codes would not match CISO_CATS / MSP_CATS.
      //
      // The layout mode rides along because it is journey state, this view is
      // its only reader, and fetching it here keeps the page to one round
      // trip. null = never answered, which is what makes the view ask.
      const [assessment, companyRows] = await Promise.all([
        getNis2Assessment(ctx.db, cid),
        ctx.db
          .select({
            journeyMode: company.journeyMode,
            sector: company.sector,
            entityType: company.entityType,
          })
          .from(company)
          .where(eq(company.id, cid))
          .limit(1),
      ]);
      const companyRow = companyRows[0];
      const mode = companyRow?.journeyMode ?? null;

      if (!assessment) {
        return {
          items: [],
          isManagement: false,
          aggregate: emptyAggregate,
          lastActivityAt: null,
          mode,
        };
      }

      const [rows, signOffRows, currentUserRow, lastAuditRows, walk] = await Promise.all([
        ctx.db
          .select({
            statusId: companyRequirementStatus.id,
            requirementId: companyRequirementStatus.requirementId,
            status: companyRequirementStatus.status,
            signedOffAt: companyRequirementStatus.signedOffAt,
            reviewedAt: companyRequirementStatus.reviewedAt,
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
        // When this company last changed anything, used only to decide whether
        // the path has stalled. Read from the audit log rather than from
        // companyRequirementStatus.updatedAt: every mutation is logged by the
        // auto-audit middleware, so this covers evidence, risks, assets and
        // sign-offs alike, where the status timestamp is bumped by a handful of
        // call sites and would report a company as idle while it was busy
        // elsewhere. Null for a company that has never mutated anything.
        //
        // isNotNull(userId) is load-bearing. Cron-driven writes carry a real
        // companyId and a null userId: escalation.ts logs
        // notification.escalated_level_N per overdue requirement, and
        // schedule-notifications.ts and module-recheck.ts do the same. Without
        // the filter those machine rows reset the idle clock, so a company that
        // stopped working is marked active by the very escalations that prove it
        // stopped. The tRPC middleware always supplies a real userId, so a
        // non-null userId means a person did something.
        ctx.db
          .select({ at: auditLog.createdAt })
          .from(auditLog)
          .where(and(eq(auditLog.companyId, cid), isNotNull(auditLog.userId)))
          .orderBy(desc(auditLog.createdAt))
          .limit(1),
        // Where the walkthrough has each item, read from these rows and the walk's own events
        // the way the walkthrough reads it, so an item filled in there waits for sign-off here.
        latestWalkEvents(ctx.db, cid),
      ]);

      // statusId → { signed, total } sign-off progress.
      const signOffByStatusId = new Map<string, { signed: number; total: number }>();
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

      // Each requirement's own state, which a requirement met inside the walk reads off the walk
      // items that carry it (`coveredState`).
      const own = new Map(
        rows.map((r): [string, Covering] => {
          const status = r.status ?? "not_started";
          const latest = walk.get(r.requirementId) ?? null;
          return [
            r.code,
            {
              state: journeyState(status, itemState({ ...r, status }, latest)),
              walked:
                latest?.action === ("durchgang.item_done" satisfies DurchgangAction),
            },
          ];
        }),
      );
      const covering = (code: string): Covering =>
        own.get(code) ?? { state: "todo", walked: false };
      const profile = companyRow && {
        sector: companyRow.sector,
        walks: walkOf(companyRow.entityType).map((item) => item.code),
      };

      const items = rows.map((r) => {
        const status = r.status ?? "not_started";
        const ownState = covering(r.code).state;
        const { state, coveredBy } = profile
          ? coveredState(r.code, ownState, profile, covering)
          : { state: ownState, coveredBy: null };
        const dueAt = r.nextReviewDate ? new Date(r.nextReviewDate) : null;
        // nextReviewDate means a recurring REVIEW date only on review-relevant
        // statuses (matches dashboard.ts). On not-done items the same column
        // holds the initial implementation deadline, a different concept, so we
        // do not surface it as a review here. One canonical calendar-day delta
        // (daysUntilDeadline) drives every overdue/dueSoon/pill decision.
        const dueInDays =
          dueAt && isReviewStatus(status) ? daysUntilDeadline(dueAt, nowDate) : null;
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
          state,
          coveredBy,
        };
      });

      // Company-wide aggregates, a reality check shown across the path view.
      const aggregate = {
        total: items.length,
        done: items.filter((i) => isDoneState(i.state)).length,
        // Partition, not overlap: a needs_review item past its review date
        // counts as overdue below, so "awaiting" holds only the ones whose
        // review is not (yet) late. A requirement waiting on the walk item that
        // carries it is signed with that item, so only the item counts.
        awaitingSignoff: items.filter(
          (i) =>
            i.state === "awaiting" &&
            i.coveredBy === null &&
            (i.dueInDays === null || i.dueInDays >= 0),
        ).length,
        // Recurring-review cycle (only on review-status items, so a never-done
        // item past its initial deadline is NOT mislabelled "review overdue").
        overdue: items.filter((i) => i.dueInDays !== null && i.dueInDays < 0).length,
        dueSoon: items.filter(
          (i) => i.dueInDays !== null && i.dueInDays >= 0 && i.dueInDays <= 30,
        ).length,
        open: items.filter((i) => !isDoneState(i.state)).length,
      };

      return {
        items,
        isManagement: currentUserRow?.isManagement ?? false,
        aggregate,
        lastActivityAt: lastAuditRows[0]?.at ?? null,
        mode,
      };
    }),

  /**
   * Answer (or change) "who implements NIS 2 here". companyProcedure, not
   * admin: this is how the path is drawn, not who may change the record, and
   * gating it would lock out exactly the member who needs the other layout.
   */
  setMode: companyProcedure
    .input(z.object({ mode: z.enum(journeyModeEnum.enumValues) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(company)
        .set({ journeyMode: input.mode, updatedAt: new Date() })
        .where(eq(company.id, ctx.companyId));
      return { mode: input.mode };
    }),
});
