import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import { company } from "@/schema";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/client-ip";
import { createTRPCSetup } from "@nisd2/isms-trpc";

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
export const companyProcedure = setup.companyProcedure;
export const adminProcedure = setup.adminProcedure;
export const reviewerProcedure = setup.reviewerProcedure;

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
export const activatedCompanyProcedure = companyProcedure.use(
  async ({ ctx, next }) => {
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
  },
);
