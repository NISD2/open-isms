import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { epochSeconds, isRecentSignIn } from "@/lib/auth/session-age";
import { env } from "@/lib/env";
import { issuer } from "@/lib/mcp/config";
import { instanceKey } from "@/lib/mcp/instance-key";
import { readRequest } from "@/lib/mcp/oauth";
import { DEFAULT_ACTIVE_DAYS, MAX_ACTIVE_DAYS } from "@/lib/platform-admin/active-window";
import {
  activeUsers,
  auditLogFor,
  personWithCompanies,
} from "@/lib/platform-admin/users";
import { testResource } from "@/lib/test-mcp/address";
import { recordConnect } from "@/lib/test-mcp/audit";
import { testInstanceKey } from "@/lib/test-mcp/context";
import { DAYS_IN_ORDER, daysInOrder } from "@/lib/test-mcp/inputs";
import { mintTestKey, TEST_KEY_SECONDS } from "@/lib/test-mcp/key";
import { allowTest } from "@/lib/test-mcp/oauth";
import { user } from "@/schema";
import { platformAdminProcedure, router } from "../init";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The newest entries a person's page shows; their whole history can run to thousands. */
export const ACTIVITY_LIMIT = 500;

/**
 * Who used the platform lately, for the platform admin's "Active users" tab. Kept apart from
 * `platformAdmin`, whose file is over the size limit. The reads live in lib/platform-admin/users.ts,
 * which the test endpoint shares.
 */
export const platformAdminUsersRouter = router({
  /** Everyone who signed in during the past `days` days (14 unless asked), the latest first. */
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
