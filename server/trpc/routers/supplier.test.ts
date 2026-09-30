/**
 * A register row the supplier's company is linked to is also the supplier's
 * side of the relationship. The customer may edit and remove its own record,
 * but not write the supplier's clause answers or take the supplier's asset
 * offerings and incident broadcasts down with a hard delete.
 */
import { describe, expect, mock, test } from "bun:test";

// The auto-audit middleware and the module recheck would otherwise reach for a
// real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { supplierRouter } = await import("./supplier");
const { riskSupplier, supplier } = await import("@/schema");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const USER = "11111111-1111-4111-8111-111111111111";
const ROW = "22222222-2222-4222-8222-222222222222";

type Write =
  | { op: "update"; table: unknown; values: Record<string, unknown> }
  | { op: "delete"; table: unknown };

/** Whether the caller's register holds the row, and whether it is linked. */
type Row = "linked" | "unlinked" | "absent";

/**
 * The drizzle calls the two procedures make. Conditions are opaque here, so
 * every lookup answers with the one row the test is about.
 */
function fakeDb(row: Row, writes: Write[]) {
  const found =
    row === "absent"
      ? undefined
      : { id: ROW, supplierCompanyId: row === "linked" ? "supplier-co" : null };
  const db = {
    query: {
      supplier: { findFirst: async () => found },
    },
    select: () => ({
      from: () => ({
        where: () => ({ for: async () => (found ? [found] : []) }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          writes.push({ op: "update", table, values });
          return { returning: async () => [{ id: ROW }] };
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        writes.push({ op: "delete", table });
      },
    }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };
  return db;
}

function setup(row: Row) {
  const writes: Write[] = [];
  const caller = createCallerFactory(supplierRouter)({
    db: fakeDb(row, writes) as unknown as TRPCContext["db"],
    session: { role: "admin", accessLevel: "full" } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, writes };
}

const edit = {
  id: ROW,
  name: "Acme",
  riskLevel: "high" as const,
  acceptRightToAudit: false,
  customerEmail: "someone-else@example.com",
  customerOrgName: "Other GmbH",
  source: "manual",
};

describe("supplier.update", () => {
  test("a linked row keeps the supplier's clauses and the relationship identity", async () => {
    const { caller, writes } = setup("linked");
    await caller.update(edit);
    const [write] = writes;
    if (write?.op !== "update") throw new Error("expected an update");
    for (const kept of [
      "acceptRightToAudit",
      "customerEmail",
      "customerOrgName",
      "source",
    ]) {
      expect(write.values).not.toHaveProperty(kept);
    }
    expect(write.values).toMatchObject({ name: "Acme", riskLevel: "high" });
  });

  test("an unlinked row is the customer's own and takes every field", async () => {
    const { caller, writes } = setup("unlinked");
    await caller.update(edit);
    const [write] = writes;
    if (write?.op !== "update") throw new Error("expected an update");
    expect(write.values).toMatchObject({
      name: "Acme",
      acceptRightToAudit: false,
      customerEmail: "someone-else@example.com",
    });
  });
});

const deleted = (writes: Write[], table: unknown) =>
  writes.findIndex((w) => w.op === "delete" && w.table === table);

describe("supplier.delete", () => {
  test("a linked row is revoked and released, never deleted", async () => {
    const { caller, writes } = setup("linked");
    expect(await caller.delete({ id: ROW })).toEqual({ deleted: true });

    expect(deleted(writes, supplier)).toBe(-1);
    const ended = writes.find((w) => w.op === "update" && w.table === supplier);
    if (ended?.op !== "update") throw new Error("expected the row to be updated");
    expect(ended.values).toMatchObject({
      customerCompanyId: null,
      status: "revoked",
      riskLevel: null,
      isCritical: null,
      dueDiligenceProcess: null,
      contactName: null,
    });
    expect(ended.values.unsubscribedAt).toBeInstanceOf(Date);
    for (const kept of [
      "name",
      "customerEmail",
      "acceptRightToAudit",
      "incidentSlaHours",
    ]) {
      expect(ended.values).not.toHaveProperty(kept);
    }
    // The customer's risk links to it go with the customer's record.
    expect(deleted(writes, riskSupplier)).not.toBe(-1);
  });

  // risk_supplier has no ON DELETE, so the links have to go first or the
  // delete fails on the foreign key.
  test("an unlinked row is hard-deleted after its risk links", async () => {
    const { caller, writes } = setup("unlinked");
    await caller.delete({ id: ROW });
    const links = deleted(writes, riskSupplier);
    expect(links).not.toBe(-1);
    expect(deleted(writes, supplier)).toBeGreaterThan(links);
    expect(writes.some((w) => w.op === "update")).toBe(false);
  });

  test("a row outside the caller's register is left alone", async () => {
    const { caller, writes } = setup("absent");
    expect(await caller.delete({ id: ROW })).toEqual({ deleted: true });
    expect(writes).toEqual([]);
  });
});
