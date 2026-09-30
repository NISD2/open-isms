/**
 * The Durchgang router writes a legal trail, so what it may touch is pinned here: only paying
 * accounts (or the platform admin) reach it, only the ten walk codes resolve, every lookup is
 * scoped to the session's company, the free-text note stays out of the audit JSON, and the asset
 * batch adds only names the company does not have yet.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { AuditEntry } from "@/lib/audit";
import { asset, companyRequirementStatus } from "@/schema";

const audits: AuditEntry[] = [];
mock.module("@/lib/audit", () => ({
  logAudit: async (entry: AuditEntry) => {
    audits.push(entry);
  },
}));

const { createCallerFactory } = await import("../init");
const { durchgangRouter } = await import("./durchgang");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const USER = "11111111-1111-4111-8111-111111111111";
const ASSESSMENT = "22222222-2222-4222-8222-222222222222";
const REQUIREMENT = "55555555-5555-4555-8555-555555555555";
const STATUS = "66666666-6666-4666-8666-666666666666";

const dialect = new PgDialect();
const paramsOf = (where: SQL) => dialect.sqlToQuery(where).params;

type Write = { op: "insert" | "update"; table: unknown; values: unknown };

function setup(opts: {
  accessLevel: "full" | "grandfathered" | "free";
  statusRow?: boolean;
  existingAssets?: readonly string[];
}) {
  const writes: Write[] = [];
  const wheres: Array<{ table: string; where: SQL }> = [];
  const captured =
    (table: string, result: unknown) =>
    async ({ where }: { where: SQL }) => {
      wheres.push({ table, where });
      return result;
    };

  const db = {
    query: {
      complianceFramework: { findFirst: async () => ({ id: "framework-1" }) },
      companyAssessment: { findFirst: captured("companyAssessment", { id: ASSESSMENT }) },
      requirement: {
        findFirst: captured("requirement", { id: REQUIREMENT }),
        findMany: async () => [{ id: REQUIREMENT, code: "12.2" }],
      },
      companyRequirementStatus: {
        findFirst: captured(
          "companyRequirementStatus",
          opts.statusRow === false ? undefined : { id: STATUS },
        ),
        findMany: async () => [],
      },
      company: { findFirst: async () => ({ activatedAt: new Date(), country: "DE" }) },
      user: { findFirst: async () => ({ locale: "de" }) },
      asset: {
        findMany: captured(
          "asset",
          (opts.existingAssets ?? []).map((name) => ({ name })),
        ),
      },
    },
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: async () => {
          writes.push({ op: "update", table, values });
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        writes.push({ op: "insert", table, values });
        return Object.assign(Promise.resolve(), { onConflictDoUpdate: async () => {} });
      },
    }),
    selectDistinctOn: () => ({
      from: () => ({ where: () => ({ orderBy: async () => [] }) }),
    }),
  };

  const caller = createCallerFactory(durchgangRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: opts.accessLevel,
      user: { id: USER, email: "someone@example.com" },
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);

  return { caller, writes, wheres };
}

describe("durchgang router", () => {
  test("is closed to accounts that have not bought the Durchgang", async () => {
    const { caller, writes } = setup({ accessLevel: "grandfathered" });
    await expect(caller.walk()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.wait({ code: "12.2", reason: "letter" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.addAssets({ catalogIds: [] })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(writes).toEqual([]);
  });

  test("resolves only the codes the walk contains", async () => {
    const { caller, writes } = setup({ accessLevel: "full" });
    await expect(caller.finish({ code: "7.3" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(writes).toEqual([]);
  });

  test("finds the item through the session's company and its own assessment", async () => {
    const { caller, wheres } = setup({ accessLevel: "full" });
    await caller.finish({ code: "12.2" });
    const assessment = wheres.find((w) => w.table === "companyAssessment");
    const status = wheres.find((w) => w.table === "companyRequirementStatus");
    expect(assessment && paramsOf(assessment.where)).toContain(COMPANY);
    expect(status && paramsOf(status.where)).toContain(ASSESSMENT);
  });

  test("writes nothing when the company has no status row for the item", async () => {
    const { caller, writes } = setup({ accessLevel: "full", statusRow: false });
    await expect(caller.wait({ code: "12.2", reason: "ask" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(writes).toEqual([]);
  });

  test("waiting keeps the note in the trail and only the reason code in the audit row", async () => {
    audits.length = 0;
    const { caller, writes } = setup({ accessLevel: "full" });
    await caller.wait({
      code: "12.2",
      reason: "letter",
      note: "IT-Dienstleister fragen",
    });

    const note = writes.find(
      (w) => w.op === "update" && w.table === companyRequirementStatus,
    );
    expect(note).toBeDefined();
    const event = audits.find((a) => a.action === "durchgang.waiting");
    expect(event).toMatchObject({
      companyId: COMPANY,
      entityType: "requirement",
      entityId: REQUIREMENT,
      newValue: { reason: "letter" },
    });
    expect(JSON.stringify(event?.newValue)).not.toContain("IT-Dienstleister");
  });

  test("adds only catalogue items the company does not list yet, with their category as type", async () => {
    const { caller, writes, wheres } = setup({
      accessLevel: "full",
      existingAssets: ["vertrieb und kundenservice"],
    });
    const result = await caller.addAssets({
      catalogIds: ["bp-sales-cs", "bp-production-service", "no-such-item"],
    });
    expect(result).toEqual({ added: 1 });
    const insert = writes.find((w) => w.op === "insert" && w.table === asset);
    expect(insert?.values).toEqual([
      expect.objectContaining({ companyId: COMPANY, type: expect.any(String) }),
    ]);
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toContain(COMPANY);
  });

  test("keeps the person's own entries, once each, as type other", async () => {
    const { caller, writes } = setup({ accessLevel: "full", existingAssets: ["Kasse"] });
    const result = await caller.addAssets({
      catalogIds: [],
      custom: [{ name: "Laborsoftware" }, { name: " laborsoftware " }, { name: "kasse" }],
    });
    expect(result).toEqual({ added: 1 });
    const insert = writes.find((w) => w.op === "insert" && w.table === asset);
    expect(insert?.values).toEqual([
      { companyId: COMPANY, name: "Laborsoftware", type: "other" },
    ]);
  });
});
