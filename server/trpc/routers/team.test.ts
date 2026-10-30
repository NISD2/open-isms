/**
 * `setMemberRole` lets an organization have more than one admin. Two rules keep
 * that from becoming a way to lose or take over an organization: the person who
 * created it always stays an admin, and there is always at least one admin.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  categoryAssignment,
  company,
  companyInvite,
  companyMembership,
  notification,
  requirementAssignment,
  user,
} from "@/schema";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: () => {} }));

const { createCallerFactory } = await import("../init");
const { teamRouter } = await import("./team");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const OWNER = "11111111-1111-4111-8111-111111111111";
const SECOND = "22222222-2222-4222-8222-222222222222";
const MEMBER = "33333333-3333-4333-8333-333333333333";

type Role = "admin" | "member" | "reviewer" | "legal_reviewer";

/**
 * Just the drizzle calls the procedure makes, over an in-memory role map. `locks` records which
 * table each `for update` read locked, in order.
 */
function fakeDb(
  roles: Map<string, Role>,
  writes: { userId: string; role: Role }[],
  locks: string[] = [],
) {
  const db = {
    query: {
      company: { findFirst: async () => ({ ownerId: OWNER }) },
      companyMembership: {
        // findMembershipRole passes a condition we cannot read, so the test
        // routes the lookup through the one user it is about.
        findFirst: async () => {
          const role = roles.get(target.userId);
          return role ? { role } : undefined;
        },
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          for: async () => {
            const locked = table === company ? "company" : "company_membership";
            locks.push(locked);
            return locked === "company"
              ? [{ ownerId: OWNER }]
              : [...roles]
                  .filter(([, r]) => r === "admin")
                  .map(([userId]) => ({ userId }));
          },
        }),
      }),
    }),
    update: () => ({
      set: (values: { role: Role }) => ({
        where: () => {
          writes.push({ userId: target.userId, role: values.role });
          return { returning: async () => [{ userId: target.userId }] };
        },
      }),
    }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };
  return db;
}

const target = { userId: "" };

function setup(initial: [string, Role][]) {
  const roles = new Map(initial);
  const writes: { userId: string; role: Role }[] = [];
  const locks: string[] = [];
  const caller = createCallerFactory(teamRouter)({
    db: fakeDb(roles, writes, locks) as unknown as TRPCContext["db"],
    session: { role: "admin", accessLevel: "full" } as TRPCContext["session"],
    userId: OWNER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  const setRole = (userId: string, role: Role) => {
    target.userId = userId;
    return caller.setMemberRole({ userId, role });
  };
  return { setRole, writes, locks };
}

describe("team.setMemberRole", () => {
  test("promotes a member to a second admin", async () => {
    const { setRole, writes } = setup([
      [OWNER, "admin"],
      [MEMBER, "member"],
    ]);
    expect(await setRole(MEMBER, "admin")).toEqual({ changed: true });
    expect(writes).toEqual([{ userId: MEMBER, role: "admin" }]);
  });

  test("demotes a second admin while another remains", async () => {
    const { setRole, writes } = setup([
      [OWNER, "admin"],
      [SECOND, "admin"],
    ]);
    expect(await setRole(SECOND, "member")).toEqual({ changed: true });
    expect(writes).toEqual([{ userId: SECOND, role: "member" }]);
  });

  test("never demotes the person who created the organization", async () => {
    const { setRole, writes } = setup([
      [OWNER, "admin"],
      [SECOND, "admin"],
    ]);
    await expect(setRole(OWNER, "member")).rejects.toThrow("stays an admin");
    expect(writes).toEqual([]);
  });

  test("never demotes the last admin", async () => {
    // The creator has left, so the one remaining admin is someone else.
    const { setRole, writes } = setup([
      [SECOND, "admin"],
      [MEMBER, "member"],
    ]);
    await expect(setRole(SECOND, "member")).rejects.toThrow("at least one admin");
    expect(writes).toEqual([]);
  });

  test("refuses someone who is not a member", async () => {
    const { setRole } = setup([[OWNER, "admin"]]);
    await expect(setRole(MEMBER, "admin")).rejects.toThrow("not found");
  });

  // The owner is read under the company lock, taken before the admin rows as ownership.accept
  // takes it before the rows it changes, so a handover cannot slip between the read and the write.
  test("reads the owner with the company row locked, before the admin rows", async () => {
    const { setRole, locks } = setup([
      [OWNER, "admin"],
      [SECOND, "admin"],
    ]);
    await setRole(SECOND, "member");
    expect(locks).toEqual(["company", "company_membership"]);
  });
});

/**
 * `removeMember` takes the person off everything that waits on them. A pending
 * sign-off row left behind kept them on the requirement's roster, where
 * sign-off waited for a signature that could never come. Their signed rows are
 * receipts of sign-offs they made and stay.
 */
type AssignmentRow = { id: string; userId: string; signedOffAt: Date | null };
type Write = {
  op: "delete" | "update";
  table: unknown;
  where: SQL;
  inTx: boolean;
  values?: Record<string, unknown>;
};

function removalDb(assignments: AssignmentRow[], ownerId = OWNER) {
  const writes: Write[] = [];
  const state = { inTx: false };
  const locks: { table: string; inTx: boolean }[] = [];
  const db = {
    query: {
      user: {
        findFirst: async () => ({
          id: MEMBER,
          email: "member@example.test",
          name: "Mia Member",
        }),
      },
      company: { findFirst: async () => ({ ownerId: OWNER, name: "Acme" }) },
      companyAssessment: { findMany: async () => [{ id: "assessment-1" }] },
      companyMembership: { findFirst: async () => undefined },
      // No NIS 2 framework, so the background module recheck finds nothing.
      complianceFramework: { findFirst: async () => undefined },
    },
    // A select either becomes a subquery or is read under a lock: the company
    // row for its owner, or the leaving member's rows.
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          for: async () => {
            locks.push({
              table: table === company ? "company" : "other",
              inTx: state.inTx,
            });
            return table === company ? [{ ownerId }] : assignments;
          },
        }),
      }),
    }),
    delete: (table: unknown) => ({
      where: async (where: SQL) => {
        writes.push({ op: "delete", table, where, inTx: state.inTx });
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: (where: SQL) => {
          writes.push({ op: "update", table, where, inTx: state.inTx, values });
          // Awaited as is, or asked for the new key version (lib/mcp/key-version.ts).
          return Object.assign(Promise.resolve(), {
            returning: async () => [{ version: 2 }],
          });
        },
      }),
    }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => {
      state.inTx = true;
      try {
        return await fn(db);
      } finally {
        state.inTx = false;
      }
    },
  };
  return { db, writes, locks };
}

function removalCaller(db: unknown) {
  return createCallerFactory(teamRouter)({
    db: db as TRPCContext["db"],
    session: { role: "admin", accessLevel: "full" } as TRPCContext["session"],
    userId: OWNER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
}

async function removeMember(assignments: AssignmentRow[]) {
  const { db, writes } = removalDb(assignments);
  await removalCaller(db).removeMember({ userId: MEMBER });
  return writes;
}

const deletedAssignmentIds = (writes: Write[]) =>
  writes
    .filter((w) => w.op === "delete" && w.table === requirementAssignment)
    .flatMap((w) => new PgDialect().sqlToQuery(w.where).params);

describe("team.removeMember", () => {
  // The member was handed the company a moment ago: the owner is read inside the transaction,
  // under the company lock ownership.accept also takes, so the removal sees the new owner.
  test("refuses a member who has just become the owner, read under the lock", async () => {
    const { db, writes, locks } = removalDb([], MEMBER);
    await expect(removalCaller(db).removeMember({ userId: MEMBER })).rejects.toThrow(
      "cannot be removed",
    );
    expect(locks[0]).toEqual({ table: "company", inTx: true });
    expect(writes).toEqual([]);
  });

  test("drops the member's pending sign-off rows and keeps their receipts", async () => {
    const writes = await removeMember([
      { id: "pending-row", userId: MEMBER, signedOffAt: null },
      { id: "receipt-row", userId: MEMBER, signedOffAt: new Date("2026-09-01") },
    ]);
    expect(deletedAssignmentIds(writes)).toEqual(["pending-row"]);
  });

  test("deletes no sign-off rows when the member only holds receipts", async () => {
    const writes = await removeMember([
      { id: "receipt-row", userId: MEMBER, signedOffAt: new Date("2026-09-01") },
    ]);
    expect(deletedAssignmentIds(writes)).toEqual([]);
  });

  test("makes every removal write inside one transaction", async () => {
    const writes = await removeMember([
      { id: "pending-row", userId: MEMBER, signedOffAt: null },
    ]);
    const tables = writes.map((w) => w.table);
    for (const table of [
      categoryAssignment,
      requirementAssignment,
      notification,
      companyInvite,
      companyMembership,
    ]) {
      expect(tables).toContain(table);
    }
    expect(writes.every((w) => w.inTx)).toBe(true);
  });

  test("ends the member's AI assistants for good, in the same transaction", async () => {
    const writes = await removeMember([]);
    const disconnect = writes.filter(
      (w) => w.table === user && w.values !== undefined && "mcpKeyVersion" in w.values,
    );
    expect(disconnect).toHaveLength(1);
    expect(disconnect.every((w) => w.inTx)).toBe(true);
  });
});

/**
 * `invite` stores where accepting the invite lands. Any new account is the
 * admin of its own draft company, so the value is attacker-supplied and has to
 * be a same-origin path by the time it reaches the row.
 */
async function storedRedirectPath(redirectPath: string) {
  const stored: { values?: unknown; set?: unknown } = {};
  const db = {
    query: {
      user: { findFirst: async () => undefined },
      company: { findFirst: async () => ({ name: "Acme" }) },
      companyInvite: { findFirst: async () => undefined },
    },
    // isMemberOf builds a subquery from this; nothing reads it.
    select: () => ({ from: () => ({ where: () => ({}) }) }),
    insert: () => ({
      values: (values: unknown) => {
        stored.values = values;
        return {
          onConflictDoUpdate: ({ set }: { set: unknown }) => {
            stored.set = set;
            return { returning: async () => [{ id: "invite-1", token: "t" }] };
          },
        };
      },
    }),
  };
  const caller = createCallerFactory(teamRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: "full",
      user: { name: "Olga Owner" },
    } as TRPCContext["session"],
    userId: OWNER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  await caller.invite({ email: "new@example.test", redirectPath });
  return stored;
}

describe("team.invite", () => {
  test("keeps a same-origin path", async () => {
    const stored = await storedRedirectPath("/compliance/risk-management");
    expect(stored.values).toMatchObject({ redirectPath: "/compliance/risk-management" });
    expect(stored.set).toMatchObject({ redirectPath: "/compliance/risk-management" });
  });

  test("stores the start page for anything that leaves the origin", async () => {
    for (const raw of [
      "https://evil.invalid/login",
      "//evil.invalid",
      "/\\evil.invalid",
      "/.//evil.invalid",
      "javascript:alert(1)",
    ]) {
      const stored = await storedRedirectPath(raw);
      expect(stored.values).toMatchObject({ redirectPath: "/" });
      expect(stored.set).toMatchObject({ redirectPath: "/" });
    }
  });
});
