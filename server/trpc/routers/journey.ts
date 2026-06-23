import { eq, and, asc, count } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../init";
import {
  companyRequirementStatus,
  companyAssessment,
  requirement,
  requirementCategory,
  requirementAssignment,
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
      signOff: signOffByStatusId.get(r.statusId) ?? { signed: 0, total: 0 },
    }));

    // Company-wide aggregates, a reality check shown across the path view.
    const now = Date.now();
    const aggregate = {
      total: items.length,
      done: items.filter((i) => isDoneStatus(i.status)).length,
      awaitingSignoff: items.filter((i) => i.status === "needs_review").length,
      overdue: items.filter(
        (i) => !isDoneStatus(i.status) && i.dueAt && i.dueAt.getTime() < now,
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
