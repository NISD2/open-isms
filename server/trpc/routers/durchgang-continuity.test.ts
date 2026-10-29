/**
 * The Durchgang's continuity writes (4.2 and 4.4): the mark and the tolerance per process, what
 * each process needs, and how long each needed system takes back. Pinned here: only the company's
 * own rows are touched, and every statement on the links carries the company; a process is never
 * a need and a need never a process; a process's links are replaced by the row sent for it and go
 * with its mark; the trail names what was recorded; and the comparison reads the company's list
 * with the links of its processes that must keep running only. The fake database is
 * durchgang-continuity.world.ts.
 */
import { describe, expect, mock, test } from "bun:test";
import { asset, companyPolicyConfig, processAsset } from "@/schema";
import {
  BOOKS,
  books,
  COMPANY,
  ERP,
  erp,
  FOREIGN,
  harness,
  noteOf,
  paramsOf,
  SALES,
  SERVER,
  sales,
  server,
  type Thing,
} from "./durchgang-continuity.world";

mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const { setup } = await harness();

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

  test("writes the tolerance with the mark, keeps it when left out, and clears it with the links for a process that need not run", async () => {
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
    // Its links go with the mark, through the company's own processes.
    const unlinked = off.writes.find(
      (w) => w.op === "delete" && w.table === processAsset,
    );
    expect(unlinked?.where && paramsOf(unlinked.where)).toEqual([
      SALES,
      COMPANY,
      "process",
    ]);
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

  test("replaces a process's links: unlinks what is gone, links what is new, in the trail, every statement through the company", async () => {
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
    // The lookup of both ends names the company, before anything is written; so does the read
    // of the stored links.
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toEqual(expect.arrayContaining([COMPANY]));
    const stored = wheres.find((w) => w.table === "processAsset");
    expect(stored && paramsOf(stored.where)).toEqual(expect.arrayContaining([COMPANY]));
    const deleted = writes.find((w) => w.op === "delete" && w.table === processAsset);
    expect(deleted?.where && paramsOf(deleted.where)).toEqual([
      SALES,
      SERVER,
      COMPANY,
      "process",
    ]);
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
  test("writes a restore time or unknown only where it changed, on no process, in the one record's words", async () => {
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
    expect(noteOf(writes)).toContain("ERP: unbekannt; Server: 1 Tag");
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
