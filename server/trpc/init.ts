import { createTRPCSetup } from "@nisd2/isms-trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { company } from "@/schema";

// ============================================================================
// Context
// ============================================================================

export async function createTRPCContext(opts?: { req?: Request }) {
  const session = await getSession();
  const ip = opts?.req ? getClientIp(opts.req.headers) : "unknown";
  const userAgent = opts?.req?.headers.get("user-agent") ?? null;

  return {
    db,
    session,
    userId: session?.user.id ?? null,
    companyId: session?.companyId ?? null,
    ip,
    userAgent,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const setup = createTRPCSetup<TRPCContext>({
  logAudit,
  hasReviewAccess,
});

export const router = setup.router;
export const mergeRouters = setup.mergeRouters;
export const createCallerFactory = setup.createCallerFactory;
export const publicProcedure = setup.publicProcedure;
export const protectedProcedure = setup.protectedProcedure;

/**
 * The platform operator (PLATFORM_ADMIN_EMAILS, lib/auth/platform-admin), across every company.
 * Never build it on protectedProcedure: that files every mutation, with inputs naming other
 * customers, under the operator's own open company, where that company's reviewers can read it.
 */
export const platformAdminProcedure = setup.platformProcedure.use(({ ctx, next }) => {
  if (!isPlatformAdmin(ctx.session?.user.email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
  }
  return next({ ctx });
});

/**
 * The access gate (NIS2 plan, slice 5). Every company tier below (companyProcedure, adminProcedure,
 * reviewerProcedure, and activatedCompanyProcedure built on them) refuses an account whose
 * effective level is free, which only exists once billing is launched (lib/billing/access.ts). A
 * router added on these tiers is behind the paywall unless it opts out through the account tiers.
 * The portal layout redirects a free account first; this is what stops a direct API call.
 *
 * NOT gated: `protectedProcedure`. A few of its routes read the caller's own company (the gap
 * assessment, the team list, the assessment list) and stay reachable to a free
 * account through the API, though the layout hides their pages. None of them is the journey.
 */
const assertNotFree = (session: TRPCContext["session"]) => {
  if (session?.accessLevel === "free") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Order the NIS 2 Durchgang first.",
    });
  }
};

export const companyProcedure = setup.companyProcedure.use(({ ctx, next }) => {
  assertNotFree(ctx.session);
  return next({ ctx });
});
export const adminProcedure = setup.adminProcedure.use(({ ctx, next }) => {
  assertNotFree(ctx.session);
  return next({ ctx });
});
export const reviewerProcedure = setup.reviewerProcedure.use(({ ctx, next }) => {
  assertNotFree(ctx.session);
  return next({ ctx });
});

/**
 * The company tiers WITHOUT the access gate, for what an account that has not paid must still
 * reach: billing and ordering, notifications, its own company master data, and the supplier
 * portal (suppliers answer for paying customers). Nothing else uses these.
 */
export const accountProcedure = setup.companyProcedure;
export const accountAdminProcedure = setup.adminProcedure;

/**
 * A company that has completed activation (activatedAt stamped). Extends
 * companyProcedure with a DB read of the company's lifecycle state. The primary
 * tenant-write mutations (assets, incidents) require this, so a draft shell —
 * auto-provisioned at email verification — is steered to activation before it
 * can create real work. Combined with the portal layout gating drafts to the
 * journey + onboarding, this keeps the common draft clean; discardDraftCompany
 * is best-effort and orphans anything that slips through. The base
 * companyProcedure still gates reads and lets a draft user browse the seeded
 * journey.
 */
export const activatedCompanyProcedure = companyProcedure.use(async ({ ctx, next }) => {
  const c = await ctx.db.query.company.findFirst({
    where: eq(company.id, ctx.companyId),
    columns: { activatedAt: true },
  });
  if (!c?.activatedAt) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Finish setting up your organization first.",
    });
  }
  return next({ ctx });
});
