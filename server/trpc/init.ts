import { createTRPCSetup } from "@nisd2/isms-trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { getSession, hasReviewAccess } from "@/lib/auth";
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
 * The access gate (NIS2 plan, slice 5). Every company tier below refuses an account whose effective
 * level is free, which only exists once billing is launched (lib/billing/access.ts). Gated by
 * default, so a router added later is behind the paywall unless it opts out through the account
 * tiers. The portal layout redirects a free account first; this is what stops a direct API call.
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
