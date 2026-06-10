import { db } from "@/lib/db";
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
