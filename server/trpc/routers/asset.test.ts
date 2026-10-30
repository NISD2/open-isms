/**
 * asset.update and 4.2's links: a process that stops being a process, or stops having to keep
 * running, loses what it needs, through the company's own rows only. The fake database applies the
 * update first and answers each delete against the rows as they stand after it, as Postgres would
 * run the two statements in that order.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { asset, processAsset } from "@/schema";

mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const COMPANY = "44444444-4444-4444-8444-444444444444";
const OTHER = "88888888-8888-4888-8888-888888888888";
const USER = "11111111-1111-4111-8111-111111111111";
const SALES = "99999999-9999-4999-8999-999999999981";
const ERP = "99999999-9999-4999-8999-999999999983";
const SERVER = "99999999-9999-4999-8999-999999999984";

type Row = {
  readonly id: string;
  readonly companyId: string;
  readonly type: string;
  readonly isCritical: boolean;
  readonly maxOutage: string | null;
};
type Link = { readonly processId: string; readonly assetId: string };

const dialect = new PgDialect();

type TRPCContext = import("../init").TRPCContext;
const { createCallerFactory } = await import("../init");
const { assetRouter } = await import("./asset");

function setup(rows: readonly Row[], links: readonly Link[]) {
  // The fake's tables: the update rewrites a row, a delete takes links out.
  const table = new Map(rows.map((r) => [r.id, r]));
  const stored = [...links];
  const deletes: SQL[] = [];

  /** Whether the row is one the subquery the delete embeds would return. */
  const inSubquery = (id: string, sql: string) => {
    const row = table.get(id);
    if (!row || row.companyId !== COMPANY) return false;
    return !sql.includes('"asset"."type" = ') || row.type === "process";
  };

  const db = {
    query: {
      company: { findFirst: async () => ({ activatedAt: new Date() }) },
    },
    // Only ever a subquery here; its WHERE is what the delete embeds.
    select: () => ({
      from: () => ({ where: (where: SQL) => ({ getSQL: () => where }) }),
    }),
    update: (target: unknown) => ({
      set: (values: Partial<Row>) => ({
        where: (where: SQL) => ({
          returning: async () => {
            if (target !== asset) return [];
            const { params } = dialect.sqlToQuery(where);
            const hit = [...table.values()].find(
              (r) => params.includes(r.id) && params.includes(r.companyId),
            );
            if (!hit) return [];
            const updated = { ...hit, ...values };
            table.set(hit.id, updated);
            return [updated];
          },
        }),
      }),
    }),
    delete: (target: unknown) => ({
      where: async (where: SQL) => {
        if (target !== processAsset) return;
        deletes.push(where);
        const { sql, params } = dialect.sqlToQuery(where);
        const [named] = params;
        const byNeed = sql.startsWith('("process_asset"."asset_id" = ');
        const gone = stored.filter(
          (l) =>
            (byNeed ? l.assetId : l.processId) === named && inSubquery(l.processId, sql),
        );
        for (const l of gone) stored.splice(stored.indexOf(l), 1);
      },
    }),
  };

  const caller = createCallerFactory(assetRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      jobTitle: null,
      accessLevel: "full",
      user: { id: USER, email: "someone@example.com" },
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);

  return { caller, table, stored, deletes };
}

const sales: Row = {
  id: SALES,
  companyId: COMPANY,
  type: "process",
  isCritical: true,
  maxOutage: "day",
};
const needs: readonly Link[] = [
  { processId: SALES, assetId: ERP },
  { processId: SALES, assetId: SERVER },
];

describe("asset.update and what a process needs (4.2)", () => {
  test("re-typing a process deletes its links and its tolerance, through the company's rows", async () => {
    const { caller, table, stored, deletes } = setup([sales], needs);
    await caller.update({ id: SALES, type: "application" });

    expect(stored).toEqual([]);
    expect(table.get(SALES)).toMatchObject({ type: "application", maxOutage: null });
    const [unlink] = deletes;
    if (!unlink) throw new Error("no delete");
    expect(dialect.sqlToQuery(unlink).params).toEqual([SALES, COMPANY]);
  });

  test("unticking a process deletes its links", async () => {
    const { caller, stored } = setup([sales], needs);
    await caller.update({ id: SALES, isCritical: false });
    expect(stored).toEqual([]);
  });

  test("another company's row is not updated and none of its links are deleted", async () => {
    const foreign: Row = { ...sales, companyId: OTHER };
    const { caller, stored, deletes } = setup([foreign], needs);
    await caller.update({ id: SALES, type: "application" });
    expect(deletes).toEqual([]);
    expect(stored).toEqual(needs);
  });
});
