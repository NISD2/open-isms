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

const PERSON = "22222222-2222-4222-8222-222222222222";

/**
 * A caller signed in as `email`, over a database that records every query's filter and knows one
 * person, or none.
 */
function setup(email: string, person: { id: string; name: string } | null = null) {
  const wheres: SQL[] = [];
  const chain = {
    from: () => chain,
    leftJoin: () => chain,
    innerJoin: () => chain,
    where: (where: SQL) => {
      wheres.push(where);
      return chain;
    },
    orderBy: () => Object.assign(Promise.resolve([]), { limit: async () => [] }),
  };
  const db = {
    select: () => chain,
    query: {
      user: {
        findFirst: async ({ where }: { where: SQL }) => {
          wheres.push(where);
          return person;
        },
      },
    },
  };
  const caller = createCallerFactory(platformAdminUsersRouter)({
    db: db as unknown as TRPCContext["db"],
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

describe("one user's details (platform admin)", () => {
  test("is closed to anyone who is not a platform admin", async () => {
    const { caller, wheres } = setup("someone@example.com");
    await expect(caller.detail({ id: PERSON })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(wheres).toEqual([]);
  });

  test("reads the account, its companies and its activity for that person only", async () => {
    const { caller, wheres } = setup(ADMIN, { id: PERSON, name: "Anna Beispiel" });
    const result = await caller.detail({ id: PERSON });
    expect(result?.person.name).toBe("Anna Beispiel");
    expect(wheres.map((w) => dialect.sqlToQuery(w).params)).toEqual([
      [PERSON],
      [PERSON],
      [PERSON],
    ]);
  });

  test("names nobody for an id no account has, an erased one included", async () => {
    const { caller } = setup(ADMIN, null);
    expect(await caller.detail({ id: PERSON })).toBeNull();
  });
});
