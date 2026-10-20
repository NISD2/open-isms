/**
 * The platform admin's list of active users. Pinned here: only a platform admin reads it, and it
 * keeps exactly the people whose last sign-in falls in the past seven days.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const ADMIN = "ops@example.com";
// Set here rather than through PLATFORM_ADMIN_EMAILS: other test files mock this module for the
// whole run.
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [ADMIN],
  isPlatformAdmin: (email: string | null | undefined) => email === ADMIN,
  requirePlatformAdmin: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { ACTIVE_WINDOW_MS, platformAdminUsersRouter } = await import(
  "./platform-admin-users"
);
type TRPCContext = import("../init").TRPCContext;

const dialect = new PgDialect();

/** A caller signed in as `email`, over a database that records the query's filter. */
function setup(email: string) {
  const wheres: SQL[] = [];
  const chain = {
    from: () => chain,
    leftJoin: () => chain,
    where: (where: SQL) => {
      wheres.push(where);
      return chain;
    },
    orderBy: async () => [],
  };
  const caller = createCallerFactory(platformAdminUsersRouter)({
    db: { select: () => chain } as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: "full",
      user: { id: "11111111-1111-4111-8111-111111111111", email },
    } as TRPCContext["session"],
    userId: "11111111-1111-4111-8111-111111111111",
    companyId: "44444444-4444-4444-8444-444444444444",
    ip: "test",
    userAgent: null,
    viaKey: false,
  } as TRPCContext);
  return { caller, wheres };
}

describe("active users (platform admin)", () => {
  test("is closed to anyone who is not a platform admin", async () => {
    const { caller, wheres } = setup("someone@example.com");
    await expect(caller.active()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(wheres).toEqual([]);
  });

  test("keeps the sign-ins of the past seven days", async () => {
    const { caller, wheres } = setup(ADMIN);
    const now = Date.now();
    await caller.active();
    const [cutoff] = dialect.sqlToQuery(wheres[0] as SQL).params as [string | Date];
    const at = new Date(cutoff).getTime();
    expect(ACTIVE_WINDOW_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(Math.abs(at - (now - ACTIVE_WINDOW_MS))).toBeLessThan(5_000);
  });
});
