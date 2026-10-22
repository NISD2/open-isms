/**
 * The company's two switches for AI assistants, as the admin sets them in Settings: reading the
 * records is turned on only while assistants are allowed, only in the admin's own company, never by
 * an assistant, and turning assistants off turns reading off with them.
 *
 * There is no database here: updates go to a fake that records what each one sets and where.
 */
import { describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

// The router reaches lib/db and lib/auth, which read a validated env as they load; CI has none.
// The same values as every other test that mocks it, since a mock holds for the whole run.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
// The auto-audit middleware files a row for every mutation; as in user-mcp.test.ts.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../init");
const { appRouter } = await import("../router");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "33333333-3333-4333-8333-333333333333";
const USER = "44444444-4444-4444-8444-444444444444";
const dialect = new PgDialect();

type Update = { set: Record<string, unknown>; where: { sql: string; params: unknown[] } };

/**
 * A database whose company row allows assistants or not: an update that asks for
 * `assistants_allowed = true` matches it only when `allowed`, as Postgres would.
 */
function fakeDb(allowed: boolean) {
  const updates: Update[] = [];
  const db = {
    update: () => ({
      set: (set: Record<string, unknown>) => ({
        where: (condition: SQL) => {
          const where = dialect.sqlToQuery(condition);
          updates.push({ set, where });
          const matches = allowed || !where.sql.includes('"assistants_allowed"');
          const rows = matches ? [{ id: COMPANY }] : [];
          // Awaited directly, or after `.returning(...)`.
          return Object.assign(Promise.resolve(rows), { returning: async () => rows });
        },
      }),
    }),
    select: () => ({ from: () => ({ where: async () => [{ userId: USER }] }) }),
  };
  return { db: db as unknown as TRPCContext["db"], updates };
}

function callerFor(
  db: TRPCContext["db"],
  { role = "admin", viaKey = false }: { role?: string; viaKey?: boolean } = {},
) {
  return createCallerFactory(appRouter)({
    db,
    session: {
      user: { id: USER },
      role,
      jobTitle: null,
      companyId: COMPANY,
      accessLevel: "full",
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: viaKey ? "mcp: Claude" : "Mozilla/5.0",
    viaKey,
  }).assistants;
}

const codeOf = async (call: Promise<unknown>) =>
  call.then(
    () => null,
    (e: unknown) => (e instanceof TRPCError ? e.code : "not a TRPCError"),
  );

describe("letting assistants read the records", () => {
  test("an admin turns it on while assistants are allowed, in their own company only", async () => {
    const { db, updates } = fakeDb(true);
    expect(await callerFor(db).setReadRecords({ allowed: true })).toEqual({
      allowed: true,
    });
    expect(updates).toHaveLength(1);
    const [update] = updates;
    expect(update?.set).toMatchObject({ assistantsReadRecords: true });
    expect(Object.keys(update?.set ?? {}).toSorted()).toEqual([
      "assistantsReadRecords",
      "updatedAt",
    ]);
    expect(update?.where.sql).toBe(
      '("company"."id" = $1 and "company"."assistants_allowed" = $2)',
    );
    expect(update?.where.params).toEqual([COMPANY, true]);
  });

  test("while assistants are off, it cannot be turned on", async () => {
    const { db } = fakeDb(false);
    expect(await codeOf(callerFor(db).setReadRecords({ allowed: true }))).toBe(
      "PRECONDITION_FAILED",
    );
  });

  test("it can always be turned off, whatever assistants are", async () => {
    for (const allowed of [true, false]) {
      const { db, updates } = fakeDb(allowed);
      expect(await callerFor(db).setReadRecords({ allowed: false })).toEqual({
        allowed: false,
      });
      expect(updates[0]?.where.sql).toBe('"company"."id" = $1');
      expect(updates[0]?.set).toMatchObject({ assistantsReadRecords: false });
    }
  });

  test("only an admin sets it, and never an assistant's key", async () => {
    for (const role of ["member", "reviewer", "legal_reviewer"]) {
      const { db, updates } = fakeDb(true);
      expect(
        await codeOf(callerFor(db, { role }).setReadRecords({ allowed: true })),
      ).toBe("FORBIDDEN");
      expect(updates).toEqual([]);
    }
    const { db, updates } = fakeDb(true);
    expect(
      await codeOf(callerFor(db, { viaKey: true }).setReadRecords({ allowed: true })),
    ).toBe("FORBIDDEN");
    expect(updates).toEqual([]);
  });
});

describe("turning assistants off", () => {
  test("turns reading the records off in the same update", async () => {
    const { db, updates } = fakeDb(true);
    await callerFor(db).setAllowed({ allowed: false });
    expect(updates[0]?.set).toMatchObject({
      assistantsAllowed: false,
      assistantsReadRecords: false,
    });
    expect(updates[0]?.where.sql).toBe('"company"."id" = $1');
  });

  test("turning them on leaves reading the records as the admin set it", async () => {
    const { db, updates } = fakeDb(true);
    await callerFor(db).setAllowed({ allowed: true });
    expect(updates).toHaveLength(1);
    expect(updates[0]?.set).not.toHaveProperty("assistantsReadRecords");
  });
});
