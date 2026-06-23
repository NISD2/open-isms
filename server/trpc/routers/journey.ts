import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import {
  companyRequirementStatus,
  companyAssessment,
  requirement,
  requirementCategory,
  requirementPrerequisite,
  complianceFramework,
  user,
} from "@/schema";
import { env } from "@/lib/env";
import { isJourneyAllowed } from "@/lib/journey-flag";
import requirementsEn from "@/messages/requirements/en.json";
import requirementsDe from "@/messages/requirements/de.json";

const I18N = {
  en: requirementsEn.requirements as Record<
    string,
    { title?: string; description?: string }
  >,
  de: requirementsDe.requirements as Record<
    string,
    { title?: string; description?: string }
  >,
} as const;

type Locale = keyof typeof I18N;

function resolveTitle(code: string, locale: Locale): string {
  const key = code.replace(/\./g, "_");
  return I18N[locale][key]?.title ?? I18N.en[key]?.title ?? code;
}

function resolveDescription(code: string, locale: Locale): string | null {
  const key = code.replace(/\./g, "_");
  return (
    I18N[locale][key]?.description ?? I18N.en[key]?.description ?? null
  );
}

/**
 * Journey view data source.
 *
 * Returns the flat list of items the projection functions need. One row per
 * requirement × company for the NIS2 framework specifically, joined with
 * requirement + category metadata, with the i18n title resolved server-side.
 *
 * Sparse-assignment note: we don't read requirement_assignment for
 * accountability because it's currently populated only at sign-off time.
 * Accountability is computed dynamically in views.ts using
 * requiredSignOffRole + isManagement + cisoUserId.
 *
 * blocksCount: number of downstream requirements that have THIS requirement
 * as a prerequisite AND are not yet at signed_current status. Used by the
 * CEO view's "Blocked on me" queue to show items that — if signed — would
 * unblock other work.
 */
export const journeyRouter = router({
  getItems: companyProcedure
    .input(z.object({ locale: z.enum(["en", "de"]).optional() }).optional())
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

    // Resolve the NIS2 framework. Without this filter, a company with both
    // NIS2 and GDPR assessments would get whichever was inserted first —
    // typically GDPR for our seed data — and the projection would silently
    // fall apart because category codes won't match CISO_CATS / MSP_CATS.
    const nis2 = await ctx.db.query.complianceFramework.findFirst({
      where: eq(complianceFramework.code, "nis2"),
      columns: { id: true },
    });
    const emptyAggregate = {
      total: 0,
      done: 0,
      awaitingSignoff: 0,
      overdue: 0,
      open: 0,
    };

    if (!nis2) {
      return { items: [], isManagement: false, aggregate: emptyAggregate };
    }

    const assessment = await ctx.db.query.companyAssessment.findFirst({
      where: and(
        eq(companyAssessment.companyId, cid),
        eq(companyAssessment.frameworkId, nis2.id),
      ),
      columns: { id: true },
    });
    if (!assessment) {
      return { items: [], isManagement: false, aggregate: emptyAggregate };
    }

    const [rows, prereqRows, currentUserRow] = await Promise.all([
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
      // Prereq graph: which requirements block which. Used to compute
      // blocksCount per item below.
      ctx.db
        .select({
          requirementId: requirementPrerequisite.requirementId,
          prerequisiteId: requirementPrerequisite.prerequisiteId,
        })
        .from(requirementPrerequisite),
      ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id),
        columns: { isManagement: true },
      }),
    ]);

    // Build a map: prereqRequirementId → array of requirementIds that
    // depend on it. So if A is prereq of B, then prereqsBlockingByReqId[A]
    // includes B.
    const downstreamByPrereq = new Map<string, string[]>();
    for (const row of prereqRows) {
      const arr = downstreamByPrereq.get(row.prerequisiteId);
      if (arr) arr.push(row.requirementId);
      else downstreamByPrereq.set(row.prerequisiteId, [row.requirementId]);
    }

    // Map requirementId → current status (for computing blocksCount).
    const statusByReqId = new Map<string, string>();
    for (const r of rows) statusByReqId.set(r.requirementId, r.status ?? "not_started");

    // For each row, count downstream requirements that are NOT signed.
    function unsignedDownstreamCount(requirementId: string): number {
      const downstream = downstreamByPrereq.get(requirementId);
      if (!downstream) return 0;
      let n = 0;
      for (const dId of downstream) {
        if (statusByReqId.get(dId) !== "signed_current") n += 1;
      }
      return n;
    }

    // Resolve requirement titles/descriptions in the caller's locale (NL falls
    // back to EN: only en/de message bundles exist for requirement strings).
    const locale: Locale = input?.locale ?? "en";
    const items = rows.map((r) => ({
      id: r.statusId,
      code: r.code,
      title: resolveTitle(r.code, locale),
      description: resolveDescription(r.code, locale),
      categoryCode: r.categoryCode,
      categorySlug: r.categorySlug,
      status: r.status ?? "not_started",
      priority: r.priority,
      frequency: r.frequency,
      legalRef: r.legalRef,
      frameworkRef: r.frameworkRef,
      requiredSignOffRole: r.requiredSignOffRole,
      dueAt: r.nextReviewDate ? new Date(r.nextReviewDate) : null,
      signedOffAt: r.signedOffAt,
      sortOrder: r.sortOrder ?? 999,
      blocksCount: unsignedDownstreamCount(r.requirementId),
    }));

    // Company-wide aggregates so CEO empty state can show "you have nothing
    // personally, but the company has X overdue / Y open."
    const now = Date.now();
    const aggregate = {
      total: items.length,
      done: items.filter(
        (i) => i.status === "approved" || i.status === "not_applicable",
      ).length,
      awaitingSignoff: items.filter((i) => i.status === "needs_review").length,
      overdue: items.filter(
        (i) =>
          i.status !== "approved" &&
          i.status !== "not_applicable" &&
          i.dueAt &&
          i.dueAt.getTime() < now,
      ).length,
      open: items.filter(
        (i) => i.status !== "approved" && i.status !== "not_applicable",
      ).length,
    };

    return {
      items,
      isManagement: currentUserRow?.isManagement ?? false,
      aggregate,
    };
  }),
});
