/**
 * The record of processing activities as a register. Pinned here: every query names the session's
 * company, and taking an activity off the record is an admin's act.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { processingActivityRouter } = await import("./processing-activity");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const USER = "11111111-1111-4111-8111-111111111111";
const ROW = "a1a1a1a1-0000-4000-8000-000000000001";
const dialect = new PgDialect();

function setup(role: string) {
  const wheres: SQL[] = [];
  const deleted: SQL[] = [];
  const db = {
    query: {
      processingActivity: {
        findMany: async ({ where }: { where: SQL }) => {
          wheres.push(where);
          return [];
        },
      },
      company: { findFirst: async () => ({ activatedAt: new Date() }) },
    },
    // The suppliers linked to the activities: a join, read through the same filter.
    select: () => {
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        where: (where: SQL) => {
          wheres.push(where);
          return chain;
        },
        orderBy: async () => [],
      };
      return chain;
    },
    delete: () => ({
      where: async (where: SQL) => {
        deleted.push(where);
      },
    }),
  };
  const caller = createCallerFactory(processingActivityRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role,
      accessLevel: "full",
      user: { id: USER, email: "someone@example.com" },
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, wheres, deleted };
}

describe("the record of processing activities", () => {
  test("lists only the session's company's activities and suppliers", async () => {
    const { caller, wheres } = setup("member");
    await caller.list();
    expect(wheres.map((w) => dialect.sqlToQuery(w).params)).toEqual([
      [COMPANY],
      [COMPANY, COMPANY],
    ]);
  });

  test("an admin takes an activity off, scoped to the company", async () => {
    const { caller, deleted } = setup("admin");
    await caller.delete({ id: ROW });
    expect(dialect.sqlToQuery(deleted[0] as SQL).params).toEqual([ROW, COMPANY]);
  });

  test("a member may not take an activity off", async () => {
    const { caller, deleted } = setup("member");
    await expect(caller.delete({ id: ROW })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(deleted).toEqual([]);
  });
});
