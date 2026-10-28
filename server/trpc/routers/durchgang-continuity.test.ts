/**
 * The Durchgang's continuity writes (4.2 and 4.4): the mark and the tolerance per process, what
 * each process needs, and how long each needed system takes back. Pinned here: only the company's
 * own rows are touched, a process is never a need and a need never a process, a process's links
 * are replaced by the row sent for it, the trail names what was recorded, and the comparison
 * reads the company's list with the links of its processes that must keep running only.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  asset,
  companyPolicyConfig,
  companyRequirementStatus,
  processAsset,
} from "@/schema";

mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { durchgangRouter } = await import("./durchgang");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const USER = "11111111-1111-4111-8111-111111111111";
const STATUS = "66666666-6666-4666-8666-666666666666";
const SALES = "99999999-9999-4999-8999-999999999981";
const BOOKS = "99999999-9999-4999-8999-999999999982";
const ERP = "99999999-9999-4999-8999-999999999983";
const SERVER = "99999999-9999-4999-8999-999999999984";
const FOREIGN = "99999999-9999-4999-8999-999999999985";

const dialect = new PgDialect();
const queryOf = (where: SQL) => dialect.sqlToQuery(where);
const paramsOf = (where: SQL) => queryOf(where).params;

type Write = {
  op: "insert" | "update" | "delete";
  table: unknown;
  values: unknown;
  where?: SQL;
};

interface Thing {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly isCritical?: boolean | null;
  readonly maxOutage?: string | null;
  readonly restoreTime?: string | null;
  readonly restoreTimeUnknown?: boolean;
}

interface World {
  readonly assets: readonly Thing[];
  /** 4.2's links as stored: which system each process needs. */
  readonly needs?: ReadonlyArray<{ processId: string; assetId: string }>;
  readonly accessLevel?: "full" | "free";
}

/**
 * A database that answers from `world`. Reads filter by the ids the WHERE names, as Postgres
 * would, so a foreign id comes back missing, and the type clause is read off the SQL: `=` keeps
 * the processes, `<>` leaves them out. Every WHERE is kept to check it names the company.
 */
function setup(world: World) {
  const writes: Write[] = [];
  const wheres: Array<{ table: string; where: SQL }> = [];

  const rowsOf = (table: unknown, where: SQL): readonly unknown[] => {
    const { sql, params } = queryOf(where);
    const ids = params.filter((p) => p !== COMPANY && p !== "process");
    if (table === asset) {
      // A WHERE that names no id reads the company's whole list.
      const named =
        ids.length > 0 ? world.assets.filter((a) => ids.includes(a.id)) : world.assets;
      return sql.includes('"type" = ')
        ? named.filter((a) => a.type === "process")
        : sql.includes('"type" <> ')
          ? named.filter((a) => a.type !== "process")
          : named;
    }
    if (table === processAsset)
      return (world.needs ?? []).filter((l) => ids.includes(l.processId));
    return [];
  };

  const select = () => ({
    from: (table: unknown) => ({
      where: (where: SQL) => {
        wheres.push({
          table:
            table === asset ? "asset" : table === processAsset ? "processAsset" : "other",
          where,
        });
        const rows = rowsOf(table, where);
        return Object.assign(Promise.resolve(rows), {
          for: async () => rows,
          orderBy: async () => rows,
          limit: async () => rows,
        });
      },
      innerJoin: joined,
    }),
  });

  /**
   * The joins, 4.2's links read through their process end (`processLinksOf`), answered from the
   * clauses the WHERE renders as Postgres would: `"is_critical" = ` keeps the processes marked,
   * `"type" = ` the process rows. Dropping either clause from the query shows here.
   */
  const linksOf = (where: SQL): readonly unknown[] => {
    const { sql } = queryOf(where);
    const processes = new Set(
      world.assets
        .filter((a) => !sql.includes('"is_critical" = ') || a.isCritical === true)
        .filter((a) => !sql.includes('"type" = ') || a.type === "process")
        .map((a) => a.id),
    );
    return (world.needs ?? []).filter((l) => processes.has(l.processId));
  };
  interface Joined {
    readonly innerJoin: () => Joined;
    readonly where: (
      where: SQL,
    ) => Promise<readonly unknown[]> & { orderBy: () => Promise<readonly unknown[]> };
  }
  function joined(): Joined {
    return {
      innerJoin: joined,
      where: (where) => {
        wheres.push({ table: "processAsset", where });
        const rows = linksOf(where);
        return Object.assign(Promise.resolve(rows), { orderBy: async () => rows });
      },
    };
  }

  const db = {
    query: {
      complianceFramework: { findFirst: async () => ({ id: "framework-1" }) },
      companyAssessment: {
        findFirst: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
      },
      requirement: {
        findFirst: async () => ({
          id: "55555555-5555-4555-8555-555555555555",
          categoryId: "77777777-7777-4777-8777-777777777777",
          priority: "P1",
        }),
        findMany: async () => [
          { id: "55555555-5555-4555-8555-555555555555", code: "12.2" },
        ],
      },
      categoryAssignment: { findFirst: async () => undefined },
      companyRequirementStatus: {
        findFirst: async () => ({ id: STATUS }),
        findMany: async () => [],
      },
      company: {
        findFirst: async () => ({
          activatedAt: new Date(),
          country: "DE",
          name: "Muster GmbH",
        }),
      },
      user: { findFirst: async () => ({ locale: "de" }) },
      companyRiskMethodology: { findFirst: async () => undefined },
      companyCategoryIntake: { findFirst: async () => undefined },
      companyPolicyConfig: { findFirst: async () => undefined },
      asset: { findMany: async () => [] },
    },
    select,
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: (where: SQL) => {
          writes.push({ op: "update", table, values, where });
          return Object.assign(Promise.resolve(), { returning: async () => [] });
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        writes.push({ op: "insert", table, values });
        return Object.assign(Promise.resolve(), { onConflictDoUpdate: async () => {} });
      },
    }),
    delete: (table: unknown) => ({
      where: async (where: SQL) => {
        writes.push({ op: "delete", table, values: undefined, where });
      },
    }),
    transaction: async <T>(work: (tx: unknown) => Promise<T>) => work(db),
  };

  const caller = createCallerFactory(durchgangRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      jobTitle: null,
      accessLevel: world.accessLevel ?? "full",
      user: { id: USER, email: "someone@example.com" },
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);

  return { caller, writes, wheres };
}

/** The text of the trail line an update appended, read from its SQL parameters. */
const noteOf = (writes: readonly Write[]): string => {
  const values = writes.find(
    (w) => w.op === "update" && w.table === companyRequirementStatus,
  )?.values;
  const notes =
    typeof values === "object" && values !== null && "internalNotes" in values
      ? values.internalNotes
      : undefined;
  return notes ? paramsOf(notes as SQL).join(" ") : "";
};

const sales: Thing = { id: SALES, name: "Vertrieb", type: "process", isCritical: false };
const books: Thing = {
  id: BOOKS,
  name: "Buchhaltung",
  type: "process",
  isCritical: true,
};
const erp: Thing = {
  id: ERP,
  name: "ERP",
  type: "application",
  restoreTime: null,
  restoreTimeUnknown: false,
};
const server: Thing = {
  id: SERVER,
  name: "Server",
  type: "server",
  restoreTime: "day",
  restoreTimeUnknown: false,
};

describe("the processes that must keep running (4.2)", () => {
  const rows = [
    { assetId: SALES, critical: true, how: "Aufträge per Telefon" },
    { assetId: BOOKS, critical: true, how: "" },
  ];

  test("writes the mark and the tolerance only where they changed, only on the company's process assets", async () => {
    const { caller, writes, wheres } = setup({ assets: [sales, books, erp] });
    expect(await caller.recordCritical({ code: "4.2", rows })).toEqual({ changed: 1 });
    const updates = writes.filter((w) => w.op === "update" && w.table === asset);
    expect(updates).toHaveLength(1);
    expect(Object.keys(updates[0]?.values ?? {}).sort()).toEqual([
      "isCritical",
      "maxOutage",
      "updatedAt",
    ]);
    expect(updates[0]?.where && paramsOf(updates[0].where)).toEqual([SALES, COMPANY]);
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toEqual(
      expect.arrayContaining([COMPANY, "process"]),
    );
  });

  test("keeps each line with the plan's choices, and names the processes in the trail", async () => {
    const { caller, writes } = setup({ assets: [sales, books] });
    await caller.recordCritical({ code: "4.2", rows });
    const config = writes.find((w) => w.table === companyPolicyConfig);
    expect(config?.values).toMatchObject({
      policyType: "business_continuity",
      config: { clauses: [], fallbacks: { [SALES]: "Aufträge per Telefon" } },
    });
    expect(noteOf(writes)).toContain("Muss ohne IT weiterlaufen: Vertrieb, Buchhaltung");
  });

  test("writes the tolerance with the mark, keeps it when left out, and clears it for a process that need not run", async () => {
    const on = setup({ assets: [sales] });
    await on.caller.recordCritical({
      code: "4.2",
      rows: [{ assetId: SALES, critical: true, how: "", outage: "day" }],
    });
    const [written] = on.writes.filter((w) => w.op === "update" && w.table === asset);
    expect(written?.values).toMatchObject({ isCritical: true, maxOutage: "day" });

    const kept = setup({ assets: [{ ...sales, isCritical: true, maxOutage: "day" }] });
    expect(
      await kept.caller.recordCritical({
        code: "4.2",
        rows: [{ assetId: SALES, critical: true, how: "" }],
      }),
    ).toEqual({ changed: 0 });

    const off = setup({
      assets: [{ ...sales, isCritical: true, maxOutage: "day" }],
      needs: [{ processId: SALES, assetId: ERP }],
    });
    await off.caller.recordCritical({
      code: "4.2",
      rows: [{ assetId: SALES, critical: false, how: "" }],
    });
    const [cleared] = off.writes.filter((w) => w.op === "update" && w.table === asset);
    expect(cleared?.values).toMatchObject({ isCritical: false, maxOutage: null });
    // Its links go with the mark.
    const unlinked = off.writes.find(
      (w) => w.op === "delete" && w.table === processAsset,
    );
    expect(unlinked?.where && paramsOf(unlinked.where)).toEqual([SALES]);
  });

  test("refuses an asset that is not one of the company's processes, an item without the screen, and accounts without the Durchgang", async () => {
    const one = setup({ assets: [sales, erp] });
    await expect(
      one.caller.recordCritical({
        code: "4.2",
        rows: [...rows, { assetId: ERP, critical: true, how: "" }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(one.writes.filter((w) => w.table === asset)).toEqual([]);
    await expect(one.caller.recordCritical({ code: "12.2", rows })).rejects.toMatchObject(
      {
        code: "BAD_REQUEST",
      },
    );
    const free = setup({ assets: [sales, books], accessLevel: "free" });
    await expect(free.caller.recordCritical({ code: "4.2", rows })).rejects.toMatchObject(
      {
        code: "FORBIDDEN",
      },
    );
    expect(free.writes).toEqual([]);
  });
});

describe("what the processes need (4.2)", () => {
  /** Sales marked as having to keep running, which a process must be to need anything. */
  const kept: Thing = { ...sales, isCritical: true };

  test("replaces a process's links: unlinks what is gone, links what is new, in the trail", async () => {
    const { caller, writes, wheres } = setup({
      assets: [kept, erp, server],
      needs: [{ processId: SALES, assetId: SERVER }],
    });
    expect(
      await caller.recordNeeds({
        code: "4.2",
        rows: [{ processId: SALES, assetIds: [ERP] }],
      }),
    ).toEqual({ changed: 2 });
    // The lookup of both ends names the company, before anything is written.
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toEqual(expect.arrayContaining([COMPANY]));
    const deleted = writes.find((w) => w.op === "delete" && w.table === processAsset);
    expect(deleted?.where && paramsOf(deleted.where)).toEqual([SALES, SERVER]);
    const inserted = writes.find((w) => w.op === "insert" && w.table === processAsset);
    expect(inserted?.values).toEqual([{ processId: SALES, assetId: ERP }]);
    expect(noteOf(writes)).toContain("Vertrieb: ERP");
  });

  test("a system named twice is one link, a process sent twice one row, and a process with nothing left says so in the trail", async () => {
    const twice = setup({ assets: [kept, erp] });
    expect(
      await twice.caller.recordNeeds({
        code: "4.2",
        rows: [{ processId: SALES, assetIds: [ERP, ERP] }],
      }),
    ).toEqual({ changed: 1 });
    const inserted = twice.writes.find(
      (w) => w.op === "insert" && w.table === processAsset,
    );
    expect(inserted?.values).toEqual([{ processId: SALES, assetId: ERP }]);

    // Two rows for one process, as an assistant may send them, are one row: nothing is dropped.
    const split = setup({ assets: [kept, erp, server] });
    expect(
      await split.caller.recordNeeds({
        code: "4.2",
        rows: [
          { processId: SALES, assetIds: [ERP] },
          { processId: SALES, assetIds: [SERVER] },
        ],
      }),
    ).toEqual({ changed: 2 });
    const merged = split.writes.find(
      (w) => w.op === "insert" && w.table === processAsset,
    );
    expect(merged?.values).toEqual([
      { processId: SALES, assetId: ERP },
      { processId: SALES, assetId: SERVER },
    ]);
    expect(noteOf(split.writes)).toContain("Vertrieb: ERP, Server");

    const cleared = setup({
      assets: [kept, erp],
      needs: [{ processId: SALES, assetId: ERP }],
    });
    expect(
      await cleared.caller.recordNeeds({
        code: "4.2",
        rows: [{ processId: SALES, assetIds: [] }],
      }),
    ).toEqual({ changed: 1 });
    expect(noteOf(cleared.writes)).toContain("Vertrieb: keine Angabe");
  });

  test("writes nothing when the links sent are the links stored", async () => {
    const { caller, writes } = setup({
      assets: [kept, erp],
      needs: [{ processId: SALES, assetId: ERP }],
    });
    expect(
      await caller.recordNeeds({
        code: "4.2",
        rows: [{ processId: SALES, assetIds: [ERP] }],
      }),
    ).toEqual({ changed: 0 });
    expect(writes.filter((w) => w.table === processAsset)).toEqual([]);
  });

  test("refuses a need that is not the company's, a process as a need, a process that need not keep running, and an item without the screen", async () => {
    const { caller, writes } = setup({ assets: [kept, books, erp] });
    await expect(
      caller.recordNeeds({
        code: "4.2",
        rows: [{ processId: SALES, assetIds: [FOREIGN] }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    // Sales unticked: its row is refused, so no hidden link is ever written or diffed against.
    const unticked = setup({ assets: [sales, erp] });
    await expect(
      unticked.caller.recordNeeds({
        code: "4.2",
        rows: [{ processId: SALES, assetIds: [ERP] }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(unticked.writes.filter((w) => w.table === processAsset)).toEqual([]);
    await expect(
      caller.recordNeeds({
        code: "4.2",
        rows: [{ processId: SALES, assetIds: [BOOKS] }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller.recordNeeds({ code: "4.2", rows: [{ processId: ERP, assetIds: [SALES] }] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes.filter((w) => w.table === processAsset)).toEqual([]);
    await expect(
      caller.recordNeeds({ code: "4.4", rows: [{ processId: SALES, assetIds: [] }] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("how long the needed systems take back (4.4)", () => {
  test("writes a restore time or unknown only where it changed, on no process", async () => {
    const { caller, writes, wheres } = setup({ assets: [sales, erp, server] });
    expect(
      await caller.recordRestore({
        code: "4.4",
        rows: [
          { assetId: ERP, restore: null, unknown: true },
          { assetId: SERVER, restore: "day", unknown: false },
        ],
      }),
    ).toEqual({ changed: 1 });
    const updates = writes.filter((w) => w.op === "update" && w.table === asset);
    expect(updates).toHaveLength(1);
    expect(updates[0]?.values).toMatchObject({
      restoreTime: null,
      restoreTimeUnknown: true,
    });
    expect(updates[0]?.where && paramsOf(updates[0].where)).toEqual([ERP, COMPANY]);
    expect(noteOf(writes)).toContain("ERP: unbekannt");
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toEqual(
      expect.arrayContaining([COMPANY, "process"]),
    );

    await expect(
      caller.recordRestore({
        code: "4.4",
        rows: [{ assetId: SALES, restore: "day", unknown: false }],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller.recordRestore({
        code: "4.4",
        rows: [{ assetId: ERP, restore: "day", unknown: true }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.recordRestore({
        code: "4.2",
        rows: [{ assetId: ERP, restore: "day", unknown: false }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("the comparison's facts (4.4)", () => {
  test("reads the company's list: the processes that must keep running with their tolerance, everything else with its restore time, and only those processes' links", async () => {
    const { caller, wheres } = setup({
      assets: [sales, { ...books, maxOutage: "hours" }, erp, server],
      needs: [
        { processId: BOOKS, assetId: ERP },
        // Sales need not keep running: its link counts for nothing downstream.
        { processId: SALES, assetId: SERVER },
      ],
    });
    expect(await caller.recovery()).toEqual({
      processes: [{ id: BOOKS, name: "Buchhaltung", maxOutage: "hours" }],
      systems: [
        { id: ERP, name: "ERP", restoreTime: null, restoreTimeUnknown: false },
        { id: SERVER, name: "Server", restoreTime: "day", restoreTimeUnknown: false },
      ],
      links: [{ processId: BOOKS, assetId: ERP }],
    });
    // Both reads, the list and the links, name the company.
    expect(wheres.map((w) => w.table).toSorted()).toEqual(["asset", "processAsset"]);
    for (const { where } of wheres) expect(paramsOf(where)).toContain(COMPANY);
  });
});
