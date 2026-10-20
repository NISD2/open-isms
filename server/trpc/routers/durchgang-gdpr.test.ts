/**
 * The GDPR walk's own writes: the record of processing activities (G-ROP.1) and each supplier's
 * GDPR facts (G-DPA.1, G-DPA.2). Pinned here: each write is refused on an item whose screens do
 * not ask it, touches only the company's own rows, writes only the customer's own supplier columns,
 * and sends back only the GDPR sign-offs a GDPR-only fact touches.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  companyRequirementStatus,
  processingActivity,
  processingActivitySupplier,
  supplier,
} from "@/schema";

// Only modules the other router tests mock the same way: `mock.module` is process-wide in Bun, so
// mocking a shared helper here would change what every later test file imports.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
const rechecked: Array<{ module: string; frameworks: unknown }> = [];
mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async (
    _db: unknown,
    _company: string,
    module: string,
    _user: unknown,
    frameworks?: unknown,
  ) => {
    rechecked.push({ module, frameworks });
  },
  recheckModuleRequirements: async () => {},
}));
const { createCallerFactory } = await import("../init");
const { durchgangGdprRouter } = await import("./durchgang-gdpr");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const USER = "11111111-1111-4111-8111-111111111111";
const P1 = "a1a1a1a1-0000-4000-8000-000000000001";
const S1 = "5e5e5e5e-0000-4000-8000-000000000001";
const S2 = "5e5e5e5e-0000-4000-8000-000000000002";
const FOREIGN = "f0f0f0f0-0000-4000-8000-000000000009";

const dialect = new PgDialect();
const paramsOf = (where: SQL) => dialect.sqlToQuery(where).params;

type Write = {
  op: "insert" | "update" | "delete";
  table: unknown;
  values: unknown;
  where?: SQL;
};

interface World {
  readonly activities: ReadonlyArray<Record<string, unknown> & { id: string }>;
  readonly suppliers: ReadonlyArray<{ id: string; name: string }>;
  readonly links?: ReadonlyArray<{ activityId: string; supplierId: string }>;
}

/** A database that answers from `world`; reads filter by the ids the query names, as Postgres would. */
function setup(world: World) {
  const writes: Write[] = [];
  rechecked.length = 0;
  const rowsOf = (table: unknown, params: readonly unknown[]) => {
    const ids = params.slice(1);
    const named = <T extends { id: string }>(rows: readonly T[]) =>
      ids.length === 0 ? rows : rows.filter((r) => ids.includes(r.id));
    if (table === processingActivity) return named(world.activities);
    if (table === supplier) return named(world.suppliers);
    if (table === processingActivitySupplier)
      return (world.links ?? []).filter((l) => ids.includes(l.activityId));
    return [];
  };
  const select = () => ({
    from: (table: unknown) => {
      const state = { where: undefined as SQL | undefined };
      const rows = new Promise<readonly unknown[]>((resolve) =>
        queueMicrotask(() =>
          resolve(rowsOf(table, state.where ? paramsOf(state.where) : [])),
        ),
      );
      const chain = Object.assign(rows, {
        innerJoin: () => chain,
        where: (where: SQL) => {
          state.where = where;
          return chain;
        },
      });
      return chain;
    },
  });
  const remove = (table: unknown) => ({
    where: async (where: SQL) => {
      writes.push({ op: "delete", table, values: paramsOf(where), where });
    },
  });
  const insert = (table: unknown) => ({
    values: (values: unknown) => {
      writes.push({ op: "insert", table, values });
      return Object.assign(Promise.resolve(), { onConflictDoNothing: async () => {} });
    },
  });
  const update = (table: unknown) => ({
    set: (values: unknown) => ({
      where: async (where: SQL) => {
        writes.push({ op: "update", table, values, where });
      },
    }),
  });
  // What finding the item reads: the company's walk, its GDPR assessment, the requirement and
  // its status row. An admin needs no category assignment.
  const db = {
    select,
    insert,
    update,
    delete: remove,
    transaction: async (work: (tx: unknown) => Promise<void>) => work(db),
    query: {
      company: {
        findFirst: async () => ({
          activatedAt: new Date(),
          entityType: "important",
          criticalInstallation: false,
          country: "DE",
        }),
      },
      user: { findFirst: async () => ({ locale: "de" }) },
      complianceFramework: { findFirst: async () => ({ id: "framework-gdpr" }) },
      companyAssessment: { findFirst: async () => ({ id: "assessment-1" }) },
      requirement: { findFirst: async () => ({ id: "req-1", categoryId: "category-1" }) },
      companyRequirementStatus: {
        findFirst: async () => ({ id: "status-1", status: "in_progress" }),
      },
    },
  };
  const caller = createCallerFactory(durchgangGdprRouter)({
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
  // The trail lines appended to the item's status row, read from the SQL that appends them.
  const notes = () =>
    writesTo(companyRequirementStatus).flatMap((w) => {
      const { internalNotes } = w.values as { internalNotes?: SQL };
      return internalNotes
        ? paramsOf(internalNotes).filter((p) => typeof p === "string")
        : [];
    });
  return { caller, writesTo, notes };
}

/** What an update set, without the time it was made. */
const setOf = (values: unknown) => {
  const {
    updatedAt: _,
    processorCheckedAt,
    transferCheckedAt,
    ...rest
  } = values as Record<string, unknown>;
  const checked = processorCheckedAt ?? transferCheckedAt;
  return checked === undefined ? rest : { ...rest, checked: true };
};

describe("adding processing activities (G-ROP.1)", () => {
  test("adds ticked catalogue activities in the record language and the company's own, once each", async () => {
    const { caller, writesTo, notes } = setup({
      activities: [{ id: P1, name: "Lohnabrechnung", catalogId: "payroll" }],
      suppliers: [],
    });
    const result = await caller.addActivities({
      code: "G-ROP.1",
      catalogIds: ["payroll", "applicants", "applicants", "not-in-catalogue"],
      custom: ["Betriebsarzt", " betriebsarzt "],
    });
    expect(result.added).toBe(2);
    const values = writesTo(processingActivity)[0]?.values as Array<
      Record<string, unknown>
    >;
    expect(values.map((v) => v.catalogId)).toEqual(["applicants", null]);
    expect(values.every((v) => v.companyId === COMPANY)).toBe(true);
    expect(values[1]?.name).toBe("Betriebsarzt");
    expect(notes()).toHaveLength(1);
    // A new row in a register every framework may read: no framework filter.
    expect(rechecked).toEqual([{ module: "processing_activity", frameworks: undefined }]);
  });

  test("is refused on an item that keeps no record", async () => {
    const { caller } = setup({ activities: [], suppliers: [] });
    await expect(
      caller.addActivities({ code: "G-DPA.1", catalogIds: ["payroll"], custom: [] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("describing processing activities (G-ROP.1)", () => {
  test("writes only the facts that changed, and sends back only GDPR sign-offs", async () => {
    const { caller, writesTo } = setup({
      activities: [
        { id: P1, name: "Lohnabrechnung", purpose: "Lohn zahlen", retention: null },
      ],
      suppliers: [],
    });
    await caller.describeActivities({
      code: "G-ROP.1",
      rows: [{ id: P1, purpose: "Lohn zahlen", retention: "10 Jahre" }],
    });
    expect(writesTo(processingActivity).map((w) => setOf(w.values))).toEqual([
      { retention: "10 Jahre" },
    ]);
    expect(rechecked).toEqual([{ module: "processing_activity", frameworks: ["gdpr"] }]);
  });

  test("touches no other company's activity", async () => {
    const { caller, writesTo } = setup({ activities: [], suppliers: [] });
    await expect(
      caller.describeActivities({
        code: "G-ROP.1",
        rows: [{ id: FOREIGN, purpose: "x" }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writesTo(processingActivity)).toEqual([]);
  });
});

describe("the suppliers that receive an activity's data (G-ROP.1)", () => {
  const activities = [{ id: P1, name: "Lohnabrechnung" }];
  const suppliers = [
    { id: S1, name: "Lohnbüro Muster" },
    { id: S2, name: "Cloud Muster" },
  ];

  test("replaces the activity's list as one, and sends back only GDPR sign-offs", async () => {
    const { caller, writesTo } = setup({
      activities,
      suppliers,
      links: [{ activityId: P1, supplierId: S1 }],
    });
    const result = await caller.describeActivities({
      code: "G-ROP.1",
      rows: [{ id: P1, supplierIds: [S2, S2] }],
    });
    expect(result.changed).toBe(1);
    expect(writesTo(processingActivitySupplier).map((w) => [w.op, w.values])).toEqual([
      ["delete", [P1]],
      ["insert", [{ activityId: P1, supplierId: S2 }]],
    ]);
    expect(rechecked).toEqual([{ module: "processing_activity", frameworks: ["gdpr"] }]);
  });

  test("an unchanged list writes nothing", async () => {
    const { caller, writesTo } = setup({
      activities,
      suppliers,
      links: [{ activityId: P1, supplierId: S1 }],
    });
    const result = await caller.describeActivities({
      code: "G-ROP.1",
      rows: [{ id: P1, supplierIds: [S1] }],
    });
    expect(result.changed).toBe(0);
    expect(writesTo(processingActivitySupplier)).toEqual([]);
    expect(rechecked).toEqual([]);
  });

  test("links no other company's supplier", async () => {
    const { caller, writesTo } = setup({ activities, suppliers });
    await expect(
      caller.describeActivities({
        code: "G-ROP.1",
        rows: [{ id: P1, supplierIds: [S1, FOREIGN] }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writesTo(processingActivitySupplier)).toEqual([]);
  });
});

describe("recording suppliers' GDPR facts (G-DPA.1, G-DPA.2)", () => {
  const suppliers = [
    { id: S1, name: "Lohnbüro Muster" },
    { id: S2, name: "Paketdienst" },
  ];

  test("a role writes the relationship, whether personal data flows, and that it was looked at", async () => {
    const { caller, writesTo, notes } = setup({ activities: [], suppliers });
    await caller.recordProcessors({
      code: "G-DPA.1",
      rows: [
        { supplierId: S1, answer: { fact: "role", role: "processor" } },
        { supplierId: S2, answer: { fact: "role", role: "none" } },
      ],
    });
    expect(writesTo(supplier).map((w) => setOf(w.values))).toEqual([
      { processesPersonalData: true, relationshipType: "processor", checked: true },
      { processesPersonalData: false, relationshipType: null, checked: true },
    ]);
    expect(rechecked).toEqual([{ module: "supplier", frameworks: ["gdpr"] }]);
    expect(notes()[0]).toContain("Lohnbüro Muster");
  });

  test("a transfer inside the EEA keeps no basis", async () => {
    const { caller, writesTo } = setup({ activities: [], suppliers });
    await caller.recordProcessors({
      code: "G-DPA.1",
      rows: [
        {
          supplierId: S1,
          answer: {
            fact: "transfer",
            outside: false,
            mechanism: "sccs",
            countries: "US",
          },
        },
      ],
    });
    // Recorded as answered, so the column's default "no" is never mistaken for an answer.
    expect(writesTo(supplier).map((w) => setOf(w.values))).toEqual([
      {
        internationalTransfer: false,
        transferMechanism: null,
        transferCountries: null,
        checked: true,
      },
    ]);
  });

  test("a transfer outside the EEA keeps its basis and countries", async () => {
    const { caller, writesTo } = setup({ activities: [], suppliers });
    await caller.recordProcessors({
      code: "G-DPA.1",
      rows: [
        {
          supplierId: S1,
          answer: {
            fact: "transfer",
            outside: true,
            mechanism: "sccs",
            countries: "USA",
          },
        },
      ],
    });
    expect(writesTo(supplier).map((w) => setOf(w.values))).toEqual([
      {
        internationalTransfer: true,
        transferMechanism: "sccs",
        transferCountries: "USA",
        checked: true,
      },
    ]);
  });

  test("is refused when one screen sends answers to two facts", async () => {
    const { caller, writesTo } = setup({ activities: [], suppliers });
    await expect(
      caller.recordProcessors({
        code: "G-DPA.1",
        rows: [
          { supplierId: S1, answer: { fact: "role", role: "processor" } },
          { supplierId: S2, answer: { fact: "contract", concluded: true } },
        ],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(writesTo(supplier)).toEqual([]);
  });

  test("is refused for a fact the item does not ask", async () => {
    const { caller, writesTo } = setup({ activities: [], suppliers });
    await expect(
      caller.recordProcessors({
        code: "G-DPA.2",
        rows: [{ supplierId: S1, answer: { fact: "role", role: "processor" } }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(writesTo(supplier)).toEqual([]);
  });

  test("touches no other company's supplier", async () => {
    const { caller, writesTo } = setup({ activities: [], suppliers });
    await expect(
      caller.recordProcessors({
        code: "G-DPA.2",
        rows: [
          {
            supplierId: FOREIGN,
            answer: { fact: "subprocessing", authorisation: "general" },
          },
        ],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writesTo(supplier)).toEqual([]);
  });
});
