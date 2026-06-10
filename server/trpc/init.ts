import { db } from "@/lib/db";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createTRPCSetup } from "@nisd2/isms-trpc";

// ============================================================================
// Context
// ============================================================================

/** Pull a best-effort client IP from the standard proxy headers. */
function extractClientIp(headers: Headers): string {
  // Prefer Cloudflare's header, then the first hop in X-Forwarded-For,
  // then the platform-specific real IP. Fall back to "unknown" so the
  // rate limiter still bucketed traffic that we cannot identify.
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function createTRPCContext(opts?: { req?: Request }) {
  const session = await getSession();
  const ip = opts?.req ? extractClientIp(opts.req.headers) : "unknown";
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
