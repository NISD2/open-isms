/**
 * The Durchgang's writes into the company's registers: naming assets and their providers (2.2)
 * and rating assets and suppliers (2.3). Pinned here: only the company's own rows are touched, a
 * provider named twice becomes one supplier, a rating adds one linked risk or re-rates the one
 * that is there and leaves a thing with several risks alone, and a company on other scales than
 * 200-3 gets nothing written.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  asset,
  assetProvider,
  risk,
  riskAsset,
  riskSupplier,
  supplier,
} from "@/schema";

mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
const rechecked: string[] = [];
mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async (_db: unknown, _company: string, module: string) => {
    rechecked.push(module);
  },
  recheckModuleRequirements: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { durchgangRouter } = await import("./durchgang");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const USER = "11111111-1111-4111-8111-111111111111";
const A1 = "a1a1a1a1-0000-4000-8000-000000000001";
const A2 = "a1a1a1a1-0000-4000-8000-000000000002";
const A3 = "a1a1a1a1-0000-4000-8000-000000000003";
const S1 = "5e5e5e5e-0000-4000-8000-000000000001";
const S2 = "5e5e5e5e-0000-4000-8000-000000000002";
const FOREIGN = "f0f0f0f0-0000-4000-8000-000000000009";

const dialect = new PgDialect();
const paramsOf = (where: SQL) => dialect.sqlToQuery(where).params;

type Write = { op: "insert" | "update" | "delete"; table: unknown; values: unknown };
type Link = {
  id: string;
  likelihood: number;
  impact: number;
  treatment: string;
  target: string;
};

interface World {
  readonly assets: ReadonlyArray<{
    id: string;
    name: string;
    description: string | null;
  }>;
  readonly suppliers: ReadonlyArray<{ id: string; name: string }>;
  /** Who provides which asset (`asset_provider`). */
  readonly providers?: ReadonlyArray<{ assetId: string; supplierId: string }>;
  readonly assetLinks?: readonly Link[];
  readonly supplierLinks?: readonly Link[];
  /** Steps of the stored method's two scales; none stored when absent. */
  readonly method?: { likelihood: number; impact: number };
}

/**
 * A database that answers from `world`. Reads filter by the ids the query names, as Postgres
 * would, so a foreign id comes back missing; every WHERE is kept to check it names the company.
 */
function setup(world: World) {
  const writes: Write[] = [];
  const wheres: SQL[] = [];
  const locked: unknown[] = [];
  rechecked.length = 0;

  // `params` is the company followed by the ids a query names; the company alone lists them all.
  const rowsOf = (table: unknown, params: readonly unknown[]): readonly unknown[] => {
    // Links are read by asset id alone: the assets were checked to be the company's first.
    if (table === assetProvider)
      return (world.providers ?? []).filter((l) => params.includes(l.assetId));
    const ids = params.slice(1);
    const named = <T extends { id: string }>(rows: readonly T[]) =>
      ids.length === 0 ? rows : rows.filter((r) => ids.includes(r.id));
    if (table === asset) return named(world.assets);
    if (table === supplier) return named(world.suppliers);
    if (table === riskAsset)
      return (world.assetLinks ?? []).filter((l) => ids.includes(l.target));
    if (table === riskSupplier)
      return (world.supplierLinks ?? []).filter((l) => ids.includes(l.target));
    return [{ id: COMPANY }];
  };

  // The chain is built in one synchronous call, so its rows are read a microtask later, once the
  // WHERE is known.
  const select = () => ({
    from: (table: unknown) => {
      const state = { where: undefined as SQL | undefined };
      const rows = new Promise<readonly unknown[]>((resolve) =>
        queueMicrotask(() =>
          resolve(rowsOf(table, state.where ? paramsOf(state.where) : [])),
        ),
      );
      const chain = Object.assign(rows, {
        where: (where: SQL) => {
          state.where = where;
          wheres.push(where);
          return chain;
        },
        innerJoin: () => chain,
        for: () => {
          locked.push(table);
          return chain;
        },
      });
      return chain;
    },
  });

  const counter = { risks: 0, suppliers: 0 };
  const insert = (table: unknown) => ({
    values: (values: unknown) => {
      writes.push({ op: "insert", table, values });
      const rows = (Array.isArray(values) ? values : [values]).map((v) => {
        if (table === risk) return { id: `risk-${++counter.risks}` };
        if (table === supplier)
          return {
            id: `new-supplier-${++counter.suppliers}`,
            name: (v as { name: string }).name,
          };
        return {};
      });
      return Object.assign(Promise.resolve(), {
        returning: async () => rows,
        onConflictDoNothing: async () => {},
      });
    },
  });
  const update = (table: unknown) => ({
    set: (values: unknown) => ({
      where: async (where: SQL) => {
        wheres.push(where);
        writes.push({ op: "update", table, values });
      },
    }),
  });
  const remove = (table: unknown) => ({
    where: async (where: SQL) => {
      writes.push({ op: "delete", table, values: paramsOf(where) });
    },
  });

  const tx = {
    select,
    insert,
    update,
    delete: remove,
    query: {
      companyRiskMethodology: {
        findFirst: async () =>
          world.method
            ? {
                likelihoodLevels: Array.from({ length: world.method.likelihood }),
                impactLevels: Array.from({ length: world.method.impact }),
              }
            : undefined,
      },
    },
  };
  const db = {
    ...tx,
    transaction: async <T>(work: (t: typeof tx) => Promise<T>) => work(tx),
    query: {
      ...tx.query,
      company: { findFirst: async () => ({ activatedAt: new Date(), country: "DE" }) },
      user: { findFirst: async () => ({ locale: "de" }) },
    },
  };

  const caller = createCallerFactory(durchgangRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: "full",
      user: { id: USER, email: "someone@example.com" },
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);

  const writesTo = (table: unknown) => writes.filter((w) => w.table === table);
  return { caller, writes, writesTo, wheres, locked };
}

const catalogueAssets = [
  { id: A1, name: "Buchhaltung", description: null },
  { id: A2, name: "E-Mail", description: null },
  { id: A3, name: "Server", description: "Im Keller" },
];

describe("naming assets and their providers", () => {
  test("renames, keeps the kind in an empty description, and keeps a provider already linked", async () => {
    const { caller, writesTo } = setup({
      assets: catalogueAssets,
      suppliers: [{ id: S1, name: "Microsoft" }],
      providers: [{ assetId: A2, supplierId: S1 }],
    });
    await caller.specifyAssets({
      rows: [
        { id: A1, name: "DATEV Unternehmen online", providers: [] },
        { id: A2, name: "E-Mail", providers: [" microsoft "] },
        { id: A3, name: "Dell PowerEdge", providers: [] },
      ],
    });
    expect(writesTo(supplier)).toEqual([]);
    expect(writesTo(assetProvider)).toEqual([]);
    expect(writesTo(asset).map((w) => w.values)).toEqual([
      expect.objectContaining({
        name: "DATEV Unternehmen online",
        description: "Buchhaltung",
      }),
      expect.objectContaining({ name: "Dell PowerEdge", description: "Im Keller" }),
    ]);
  });

  test("links several providers, adds one named on two rows once, and unlinks a dropped one", async () => {
    const { caller, writesTo } = setup({
      assets: catalogueAssets,
      suppliers: [{ id: S1, name: "Microsoft" }],
      providers: [{ assetId: A2, supplierId: S1 }],
    });
    await caller.specifyAssets({
      rows: [
        { id: A1, name: "Buchhaltung", providers: ["DATEV eG", "Microsoft"] },
        { id: A3, name: "Server", providers: ["datev eg"] },
        { id: A2, name: "E-Mail", providers: [] },
      ],
    });
    expect(writesTo(supplier).map((w) => w.values)).toEqual([
      [{ name: "DATEV eG", customerCompanyId: COMPANY }],
    ]);
    expect(writesTo(assetProvider).filter((w) => w.op === "insert")).toEqual([
      {
        op: "insert",
        table: assetProvider,
        values: [
          { assetId: A1, supplierId: "new-supplier-1" },
          { assetId: A1, supplierId: S1 },
          { assetId: A3, supplierId: "new-supplier-1" },
        ],
      },
    ]);
    expect(writesTo(assetProvider).filter((w) => w.op === "delete")).toEqual([
      { op: "delete", table: assetProvider, values: [A2, S1] },
    ]);
    expect(writesTo(asset)).toEqual([]);
  });

  test("touches no asset of another company", async () => {
    const { caller, writes } = setup({ assets: catalogueAssets, suppliers: [] });
    await expect(
      caller.specifyAssets({ rows: [{ id: FOREIGN, name: "Fremd", providers: ["X"] }] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes).toEqual([]);
  });
});

describe("rating assets and suppliers", () => {
  test("adds one linked risk, in the seed language, marked for the treatment its level suggests", async () => {
    const { caller, writesTo, locked, wheres } = setup({
      assets: catalogueAssets,
      suppliers: [],
      method: { likelihood: 4, impact: 4 },
    });
    const result = await caller.rate({
      rows: [
        { kind: "asset", id: A1, frequency: "frequent", impact: "negligible" },
        { kind: "asset", id: A3, frequency: "rare", impact: "existential" },
      ],
    });
    expect(result).toEqual({ written: 2 });
    expect(locked).toContain(asset);
    expect(writesTo(risk).map((w) => w.values)).toEqual([
      expect.objectContaining({
        companyId: COMPANY,
        title: "Buchhaltung: Ausfall, Angriff oder Datenverlust",
        likelihood: 3,
        impact: 1,
        riskScore: 3,
        treatment: "accept",
      }),
      expect.objectContaining({
        title: "Server: Ausfall, Angriff oder Datenverlust",
        likelihood: 1,
        impact: 4,
        riskScore: 4,
        // Existential damage is medium even when rare, so it is not marked for acceptance.
        treatment: "mitigate",
      }),
    ]);
    expect(writesTo(riskAsset).map((w) => w.values)).toEqual([
      { riskId: "risk-1", assetId: A1 },
      { riskId: "risk-2", assetId: A3 },
    ]);
    expect(rechecked).toEqual(["risk"]);
    expect(wheres.length).toBeGreaterThan(0);
    expect(wheres.every((w) => paramsOf(w).includes(COMPANY))).toBe(true);
  });

  test("re-rates the one risk there is, and writes nothing for an unchanged or a busy row", async () => {
    const { caller, writes, writesTo } = setup({
      assets: catalogueAssets,
      suppliers: [],
      assetLinks: [
        { id: "r1", likelihood: 2, impact: 2, treatment: "accept", target: A1 },
        { id: "r2", likelihood: 3, impact: 3, treatment: "mitigate", target: A2 },
        { id: "r3", likelihood: 1, impact: 1, treatment: "accept", target: A3 },
        { id: "r4", likelihood: 2, impact: 4, treatment: "mitigate", target: A3 },
      ],
    });
    const result = await caller.rate({
      rows: [
        { kind: "asset", id: A1, frequency: "medium", impact: "limited" },
        { kind: "asset", id: A2, frequency: "very_frequent", impact: "considerable" },
        { kind: "asset", id: A3, frequency: "rare", impact: "negligible" },
      ],
    });
    expect(result).toEqual({ written: 1 });
    expect(writes.filter((w) => w.op === "insert")).toEqual([]);
    expect(writesTo(risk).map((w) => w.values)).toEqual([
      expect.objectContaining({ likelihood: 4, impact: 3, riskScore: 12 }),
    ]);
  });

  test("moves the walk's own treatment with the new level, and keeps one chosen in the register", async () => {
    const { caller, writesTo } = setup({
      assets: catalogueAssets,
      suppliers: [],
      assetLinks: [
        // Low, still on the proposed "accept".
        { id: "r1", likelihood: 1, impact: 1, treatment: "accept", target: A1 },
        // Low, but someone chose "transfer" in the risk register.
        { id: "r2", likelihood: 1, impact: 1, treatment: "transfer", target: A2 },
      ],
    });
    await caller.rate({
      rows: [
        { kind: "asset", id: A1, frequency: "frequent", impact: "existential" },
        { kind: "asset", id: A2, frequency: "frequent", impact: "existential" },
      ],
    });
    expect(
      writesTo(risk).map((w) => (w.values as { treatment: unknown }).treatment),
    ).toEqual(["mitigate", "transfer"]);
  });

  test("rechecks no supplier sign-off when no supplier rating changed", async () => {
    const { caller, writesTo } = setup({
      assets: catalogueAssets,
      suppliers: [{ id: S1, name: "Microsoft" }],
      supplierLinks: [
        { id: "r9", likelihood: 2, impact: 2, treatment: "accept", target: S1 },
      ],
    });
    await caller.rate({
      rows: [
        { kind: "supplier", id: S1, frequency: "medium", impact: "limited" },
        { kind: "asset", id: A1, frequency: "rare", impact: "limited" },
      ],
    });
    expect(writesTo(supplier)).toEqual([]);
    expect(rechecked).toEqual(["risk"]);
  });

  test("links a supplier's risk and sets its register level, the top step as critical", async () => {
    const { caller, writesTo } = setup({
      assets: [],
      suppliers: [
        { id: S1, name: "Microsoft" },
        { id: S2, name: "Putzfirma" },
      ],
    });
    await caller.rate({
      rows: [
        { kind: "supplier", id: S1, frequency: "frequent", impact: "existential" },
        { kind: "supplier", id: S2, frequency: "rare", impact: "limited" },
      ],
    });
    expect(writesTo(riskSupplier).map((w) => w.values)).toEqual([
      { riskId: "risk-1", supplierId: S1 },
      { riskId: "risk-2", supplierId: S2 },
    ]);
    expect(
      writesTo(supplier).map((w) => (w.values as { riskLevel: unknown }).riskLevel),
    ).toEqual(["critical", "low"]);
    expect(writesTo(risk)[0]?.values).toMatchObject({
      title: "Microsoft: Ausfall oder Sicherheitsvorfall beim Lieferanten",
    });
  });

  test("writes nothing for a company whose method has other scales", async () => {
    const { caller, writes } = setup({
      assets: catalogueAssets,
      suppliers: [],
      method: { likelihood: 5, impact: 5 },
    });
    await expect(
      caller.rate({
        rows: [{ kind: "asset", id: A1, frequency: "rare", impact: "limited" }],
      }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(writes).toEqual([]);
  });

  test("rates no supplier of another company, and names the company in every lookup", async () => {
    const { caller, writes, wheres } = setup({
      assets: [],
      suppliers: [{ id: S1, name: "Microsoft" }],
    });
    await expect(
      caller.rate({
        rows: [{ kind: "supplier", id: FOREIGN, frequency: "rare", impact: "limited" }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes).toEqual([]);
    expect(wheres.every((w) => paramsOf(w).includes(COMPANY))).toBe(true);
  });
});
