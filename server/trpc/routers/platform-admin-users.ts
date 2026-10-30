import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { epochSeconds, isRecentSignIn } from "@/lib/auth/session-age";
import { env } from "@/lib/env";
import { issuer } from "@/lib/mcp/config";
import { instanceKey } from "@/lib/mcp/instance-key";
import { readRequest } from "@/lib/mcp/oauth";
import {
  companyOwnerId,
  findMembershipRole,
  lockCompanyOwner,
} from "@/lib/organization/membership";
import {
  cancelOpenTransfers,
  makeOwner,
  transferExpiry,
} from "@/lib/organization/ownership-transfer";
import { DEFAULT_ACTIVE_DAYS, MAX_ACTIVE_DAYS } from "@/lib/platform-admin/active-window";
import { bestTimeToReach, REACH_DAYS } from "@/lib/platform-admin/best-time";
import {
  activeUsers,
  activityTimes,
  auditLogFor,
  personWithCompanies,
} from "@/lib/platform-admin/users";
import { rateLimit } from "@/lib/rate-limit";
import { testResource } from "@/lib/test-mcp/address";
import { recordConnect } from "@/lib/test-mcp/audit";
import { companyOverview } from "@/lib/test-mcp/company";
import { testInstanceKey } from "@/lib/test-mcp/context";
import { DAYS_IN_ORDER, daysInOrder } from "@/lib/test-mcp/inputs";
import { mintTestKey, TEST_KEY_SECONDS } from "@/lib/test-mcp/key";
import { allowTest } from "@/lib/test-mcp/oauth";
import { company, ownershipTransfer, user } from "@/schema";
import { mailOwnershipNotice } from "../helpers/ownership-mail";
import { platformAdminProcedure, router } from "../init";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The newest entries a person's page shows; their whole history can run to thousands. */
export const ACTIVITY_LIMIT = 500;

/** The newest entries a company's page shows. */
export const COMPANY_ACTIVITY_LIMIT = 200;

/**
 * Who used the platform lately, for the platform admin's "Active users" tab. Kept apart from
 * `platformAdmin`, whose file is over the size limit. The reads live in lib/platform-admin/users.ts,
 * which the test endpoint shares.
 */
export const platformAdminUsersRouter = router({
  /**
   * Everyone who signed in or did something during the past `days` days (14 unless asked), the
   * latest of the two first.
   */
  active: platformAdminProcedure
    .input(
      z
        .object({
          days: z.number().int().min(1).max(MAX_ACTIVE_DAYS).default(DEFAULT_ACTIVE_DAYS),
        })
        .default({ days: DEFAULT_ACTIVE_DAYS }),
    )
    .query(({ ctx, input }) =>
      activeUsers(ctx.db, new Date(Date.now() - input.days * DAY_MS)),
    ),

  /**
   * One person, for the admin's user dialog: the account, every company they belong to, and what
   * they did, from the audit log, newest first, with what each entry stored; optionally between
   * two calendar days in Berlin. Null for an id that names nobody (erased).
   */
  detail: platformAdminProcedure
    .input(
      z
        .object({
          id: z.string().uuid(),
          fromDay: z.iso.date().optional(),
          toDay: z.iso.date().optional(),
        })
        .refine(daysInOrder, DAYS_IN_ORDER),
    )
    .query(async ({ ctx, input }) => {
      const { id, fromDay, toDay } = input;
      const [found, log] = await Promise.all([
        personWithCompanies(ctx.db, id),
        auditLogFor(ctx.db, { kind: "user", id }, { fromDay, toDay }, ACTIVITY_LIMIT),
      ]);
      return found ? { ...found, activity: log.rows } : null;
    }),

  /**
   * When this person is likely at their desk, for "Good time to message or call" at the top of the
   * user dialog: read from the past `REACH_DAYS` days of what they did in the app and their last
   * sign-in, in Berlin time (lib/platform-admin/best-time). Apart from `detail`, so the days the
   * admin picks for the log do not change it.
   */
  reach: platformAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [rows, person] = await Promise.all([
        activityTimes(ctx.db, input.id, new Date(Date.now() - REACH_DAYS * DAY_MS)),
        ctx.db.query.user.findFirst({
          where: eq(user.id, input.id),
          columns: { lastLoginAt: true },
        }),
      ]);
      const times = rows.map((r) => new Date(r.at));
      return bestTimeToReach(
        person?.lastLoginAt ? [...times, person.lastLoginAt] : times,
      );
    }),

  /**
   * One company, for the modal opened from a person's company: its profile and plan, how far the
   * walkthrough is, every member with their courses and work, and what the company did, newest
   * first. The overview is the one the test endpoint reads (lib/test-mcp/company). Null for an id
   * that names no company.
   */
  company: platformAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [overview, log, ownerId] = await Promise.all([
        companyOverview(ctx.db, input.id),
        auditLogFor(
          ctx.db,
          { kind: "company", id: input.id },
          {},
          COMPANY_ACTIVITY_LIMIT,
        ),
        companyOwnerId(ctx.db, input.id),
      ]);
      return overview ? { ...overview, ownerId, activity: log.rows } : null;
    }),

  /**
   * Make a member the owner when the owner cannot hand it over themselves: they left the company,
   * or their account is gone. Only after the request was verified outside the app (who asked, and
   * that they speak for the company), which the reason records. The company's own activity log and
   * a notice to the old owner, the new one and the admins show it, so a handover nobody asked for
   * is seen. The inputs are named like eraseUser's, so the automatic platform row scrubs them.
   */
  assignOwner: platformAdminProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        toUserId: z.string().uuid(),
        /** Why, and how the request was verified. Kept on the transfer row. */
        notes: z.string().trim().min(20).max(1000),
        /** The company's name, typed as a confirmation. */
        confirmOrgName: z.string().trim().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!(await rateLimit(`assign-owner:${ctx.userId}`, 10, 60 * 60 * 1000))) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Owner assignment limit reached. Wait before assigning more.",
        });
      }
      const now = new Date();
      const done = await ctx.db.transaction(async (tx) => {
        // The company row first, the order every owner change locks in.
        const ownerId = await lockCompanyOwner(tx, input.companyId);
        const target = await tx.query.company.findFirst({
          where: eq(company.id, input.companyId),
          columns: { name: true },
        });
        if (!target)
          throw new TRPCError({ code: "NOT_FOUND", message: "No such company." });
        if (target.name.trim().toLowerCase() !== input.confirmOrgName.toLowerCase()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The name typed does not match the company.",
          });
        }
        if (ownerId === input.toUserId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This person already owns it.",
          });
        }
        if (
          !(await findMembershipRole(tx, {
            userId: input.toUserId,
            companyId: input.companyId,
          }))
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The new owner must be a member of the company.",
          });
        }
        await cancelOpenTransfers(tx, input.companyId, ctx.userId, now);
        const [row] = await tx
          .insert(ownershipTransfer)
          .values({
            companyId: input.companyId,
            fromUserId: ownerId,
            toUserId: input.toUserId,
            initiatedBy: ctx.userId,
            method: "platform_admin",
            status: "accepted",
            reason: input.notes,
            decidedBy: ctx.userId,
            decidedAt: now,
            createdAt: now,
            expiresAt: transferExpiry(now),
          })
          .returning({ id: ownershipTransfer.id });
        if (!row) throw new Error("ownership_transfer insert returned no row");
        await makeOwner(tx, { companyId: input.companyId, userId: input.toUserId });
        return { id: row.id, fromUserId: ownerId };
      });

      // In the company's own log, where its admins see it; the reason stays on the transfer row.
      await logAudit({
        companyId: input.companyId,
        userId: ctx.userId,
        action: "ownership.owner_assigned",
        entityType: "ownership_transfer",
        entityId: done.id,
        description: `Owner assigned by the platform operator from ${done.fromUserId ?? "nobody"} to ${input.toUserId}, after verification outside the app`,
        previousValue: { ownerId: done.fromUserId },
        newValue: { ownerId: input.toUserId, method: "platform_admin" },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      mailOwnershipNotice({
        db: ctx.db,
        companyId: input.companyId,
        actorId: ctx.userId,
        kind: "assigned",
        fromUserId: done.fromUserId,
        toUserId: input.toUserId,
        expiresAt: null,
      });
      return { transferId: done.id };
    }),

  /**
   * A key and address for the test endpoint (lib/test-mcp), shown once and stored nowhere. It ends
   * after a few hours, when the person signs out or disconnects their assistants in Settings, or
   * when their address leaves PLATFORM_ADMIN_EMAILS (which a running instance reads from its
   * environment, so that takes a deploy). Needs a sign-in from the last few minutes, because a key
   * outlives the browser session it was made in. Never reachable with an assistant's key (the
   * tier refuses it).
   */
  createTestKey: platformAdminProcedure.mutation(async ({ ctx }) => {
    const path = env.TEST_MCP_PATH;
    if (!path) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "TEST_MCP_PATH is not set on this instance.",
      });
    }
    const nowS = epochSeconds(new Date());
    if (!isRecentSignIn(ctx.session?.authTime ?? null, nowS)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "reauth" });
    }
    const versions = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.userId),
      columns: { mcpKeyVersion: true, sessionVersion: true },
    });
    if (!versions) throw new TRPCError({ code: "NOT_FOUND" });
    return {
      key: mintTestKey(
        testInstanceKey(),
        { sub: ctx.userId, ver: versions.mcpKeyVersion, sv: versions.sessionVersion },
        nowS,
      ),
      url: `${issuer()}/api/t/${path}`,
      hours: TEST_KEY_SECONDS / 3600,
    };
  }),

  /**
   * The address of the test endpoint, for an assistant that signs in through the browser instead
   * of holding a made key (`allowTestClient`). The address alone opens nothing: it takes a
   * sign-in the operator allows. Never reachable with an assistant's key (the tier refuses it).
   */
  testAddress: platformAdminProcedure.mutation(() => {
    const path = env.TEST_MCP_PATH;
    if (!path) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "TEST_MCP_PATH is not set on this instance.",
      });
    }
    return { url: testResource(path) };
  }),

  /**
   * The operator allowed an assistant's browser sign-in for the test endpoint (lib/test-mcp/oauth):
   * back to its address with a code for this person at their key and sign-in versions of now, so
   * signing out or ending their assistants in Settings ends what it buys. Needs a sign-in from the
   * last few minutes, as a made key does, because the grant outlives this browser session. A
   * `test.connect` audit row, written first, records who allowed which application and where it
   * went back to. Only a request made for the test endpoint is allowed here, and only the
   * customer one on the company consent page.
   */
  allowTestClient: platformAdminProcedure
    .input(z.object({ request: z.string().max(8192) }))
    .mutation(async ({ ctx, input }) => {
      if (!env.TEST_MCP_PATH) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "TEST_MCP_PATH is not set on this instance.",
        });
      }
      const nowS = epochSeconds(new Date());
      if (!isRecentSignIn(ctx.session?.authTime ?? null, nowS)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "reauth" });
      }
      const request = readRequest(instanceKey(), input.request, nowS);
      if (request?.res !== "test") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This request has expired. Connect again from the assistant.",
        });
      }
      const versions = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { mcpKeyVersion: true, sessionVersion: true },
      });
      if (!versions) throw new TRPCError({ code: "NOT_FOUND" });
      // Written before the code exists: a sign-in that cannot be recorded is not allowed.
      await recordConnect(
        ctx.db,
        ctx.userId,
        { client: request.client ?? null, returnHost: new URL(request.redirectUri).host },
        { ip: ctx.ip === "unknown" ? null : ctx.ip, userAgent: ctx.userAgent },
      );
      return {
        url: allowTest(
          instanceKey(),
          request,
          { sub: ctx.userId, ver: versions.mcpKeyVersion, sv: versions.sessionVersion },
          issuer(),
          nowS,
        ),
      };
    }),
});
