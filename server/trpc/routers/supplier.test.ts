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

/**
 * The drizzle calls the two procedures make. Conditions are opaque here, so
 * the row is linked or not for the whole test, and an update matches it only
 * when the procedure is looking for the linked row.
 */
function fakeDb(linked: boolean, writes: Write[]) {
  const db = {
    query: {
      supplier: {
        findFirst: async () => ({ supplierCompanyId: linked ? "supplier-co" : null }),
      },
    },
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            writes.push({ op: "update", table, values });
            return linked || table !== supplier ? [{ id: ROW }] : [];
          },
        }),
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

function setup(linked: boolean) {
  const writes: Write[] = [];
  const caller = createCallerFactory(supplierRouter)({
    db: fakeDb(linked, writes) as unknown as TRPCContext["db"],
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
};

describe("supplier.update", () => {
  test("a linked row keeps the supplier's clause answers", async () => {
    const { caller, writes } = setup(true);
    await caller.update(edit);
    const [write] = writes;
    if (write?.op !== "update") throw new Error("expected an update");
    expect(write.values).not.toHaveProperty("acceptRightToAudit");
    expect(write.values).toMatchObject({ name: "Acme", riskLevel: "high" });
  });

  test("an unlinked row is the customer's own and takes every field", async () => {
    const { caller, writes } = setup(false);
    await caller.update(edit);
    const [write] = writes;
    if (write?.op !== "update") throw new Error("expected an update");
    expect(write.values).toMatchObject({ name: "Acme", acceptRightToAudit: false });
  });
});

describe("supplier.delete", () => {
  test("a linked row is revoked and released, never deleted", async () => {
    const { caller, writes } = setup(true);
    expect(await caller.delete({ id: ROW })).toEqual({ deleted: true });

    expect(writes.some((w) => w.op === "delete" && w.table === supplier)).toBe(false);
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
    expect(writes.some((w) => w.op === "delete" && w.table === riskSupplier)).toBe(true);
  });

  test("an unlinked row is still hard-deleted", async () => {
    const { caller, writes } = setup(false);
    await caller.delete({ id: ROW });
    expect(writes.some((w) => w.op === "delete" && w.table === supplier)).toBe(true);
    expect(writes.some((w) => w.table === riskSupplier)).toBe(false);
  });
});
