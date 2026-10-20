import { createTRPCSetup } from "@nisd2/isms-trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { FREE_WALK_PROCEDURES } from "@/lib/billing/access";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { browserAgent } from "@/lib/mcp/agent";
import { keyMayCall } from "@/lib/mcp/procedures";
import { company } from "@/schema";
import { requireBillingAct } from "./helpers/billing-act";

// ============================================================================
// Context
// ============================================================================

export async function createTRPCContext(opts?: { req?: Request }) {
  const session = await getSession();
  const ip = opts?.req ? getClientIp(opts.req.headers) : "unknown";
  const userAgent = browserAgent(opts?.req?.headers.get("user-agent") ?? null);

  return {
    db,
    session,
    userId: session?.user.id ?? null,
    companyId: session?.companyId ?? null,
    ip,
    userAgent,
    /** Signed in by an AI assistant's key (lib/mcp/context.ts) rather than the cookie. */
    viaKey: false,
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

/**
 * A call made with an AI assistant's key (lib/mcp) reaches only the procedures the MCP tools use
 * (lib/mcp/procedures.ts). Every procedure tier below is built with it, so the rule holds for any
 * procedure, including ones added later, and not only by what the tools happen to call.
 */
const refuseUnlistedKeyCall = (viaKey: boolean, path: string) => {
  if (viaKey && !keyMayCall(path)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not available to an assistant." });
  }
};

export const publicProcedure = setup.publicProcedure.use(({ ctx, path, next }) => {
  refuseUnlistedKeyCall(ctx.viaKey, path);
  return next();
});
export const protectedProcedure = setup.protectedProcedure.use(({ ctx, path, next }) => {
  refuseUnlistedKeyCall(ctx.viaKey, path);
  return next();
});

/**
 * Signed in, with no automatic audit row. Only for the mutation that erases its own caller
 * (user.deleteAccount): protectedProcedure's row would name a user who no longer exists, fail on
 * its foreign key, and log the request's details. The handler keeps the erasure record instead.
 */
export const selfErasureProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId, session: ctx.session } });
});

/**
 * The platform operator (PLATFORM_ADMIN_EMAILS, lib/auth/platform-admin), across every company.
 * Never build it on protectedProcedure: that files every mutation, with inputs naming other
 * customers, under the operator's own open company, where that company's reviewers can read it.
 */
export const platformAdminProcedure = setup.platformProcedure.use(({ ctx, next }) => {
  // An assistant's key works in one company; operating the platform takes the person signed in.
  if (ctx.viaKey || !isPlatformAdmin(ctx.session?.user.email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
  }
  return next({ ctx });
});

/**
 * The access gate's refusal as its own class, so the Server Component caller (lib/trpc/server.ts)
 * can tell it from any other FORBIDDEN and send the person to the offer instead. Over HTTP it is an
 * ordinary FORBIDDEN with the same message.
 */
export class MustOrderFirstError extends TRPCError {
  constructor() {
    super({ code: "FORBIDDEN", message: "Order the NIS 2 Durchgang first." });
  }
}

/**
 * The access gate (NIS2 plan, slice 5). Every company tier below (companyProcedure, adminProcedure,
 * reviewerProcedure, and activatedCompanyProcedure built on them) refuses an account whose
 * effective level is free (lib/billing/access.ts). A router added on these tiers is behind the
 * paywall unless it opts out through the account tiers.
 * The portal layout redirects a free account first; this is what stops a direct API call.
 *
 * NOT gated: `protectedProcedure`. A few of its routes read the caller's own company (the gap
 * assessment, the team list, the assessment list) and stay reachable to a free
 * account through the API, though the layout hides their pages. None of them is the journey.
 */
const assertNotFree = (session: TRPCContext["session"], path: string) => {
  if (session?.accessLevel === "free" && !FREE_WALK_PROCEDURES.has(path)) {
    throw new MustOrderFirstError();
  }
};

export const companyProcedure = setup.companyProcedure.use(({ ctx, path, next }) => {
  refuseUnlistedKeyCall(ctx.viaKey, path);
  assertNotFree(ctx.session, path);
  return next({ ctx });
});
export const adminProcedure = setup.adminProcedure.use(({ ctx, path, next }) => {
  refuseUnlistedKeyCall(ctx.viaKey, path);
  assertNotFree(ctx.session, path);
  return next({ ctx });
});
export const reviewerProcedure = setup.reviewerProcedure.use(({ ctx, path, next }) => {
  refuseUnlistedKeyCall(ctx.viaKey, path);
  assertNotFree(ctx.session, path);
  return next({ ctx });
});

/**
 * The company tiers WITHOUT the access gate, for what an account that has not paid must still
 * reach: billing and ordering, notifications, its own company master data, the supplier portal
 * (suppliers answer for paying customers), and the list of its connected AI assistants, each to
 * end. Nothing else uses these.
 */
export const accountProcedure = setup.companyProcedure.use(({ ctx, path, next }) => {
  refuseUnlistedKeyCall(ctx.viaKey, path);
  return next();
});
export const accountAdminProcedure = setup.adminProcedure.use(({ ctx, path, next }) => {
  refuseUnlistedKeyCall(ctx.viaKey, path);
  return next();
});

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
/**
 * A company procedure that signs off (AGB B7): refused to an account that has not ordered, and to
 * one inside its money back that has not confirmed giving it up (`billing.waiveMoneyBack`).
 */
export const signOffProcedure = companyProcedure.use(async ({ ctx, next }) => {
  await requireBillingAct(ctx, "sign_off");
  return next({ ctx });
});

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
