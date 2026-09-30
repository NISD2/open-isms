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
  companyInvite,
  companyMembership,
  notification,
  requirementAssignment,
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

/** Just the drizzle calls the procedure makes, over an in-memory role map. */
function fakeDb(roles: Map<string, Role>, writes: { userId: string; role: Role }[]) {
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
      from: () => ({
        where: () => ({
          for: async () =>
            [...roles].filter(([, r]) => r === "admin").map(([userId]) => ({ userId })),
        }),
      }),
    }),
    update: () => ({
      set: (values: { role: Role }) => ({
        where: async () => {
          writes.push({ userId: target.userId, role: values.role });
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
  const caller = createCallerFactory(teamRouter)({
    db: fakeDb(roles, writes) as unknown as TRPCContext["db"],
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
  return { setRole, writes };
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
});

/**
 * `removeMember` takes the person off everything that waits on them. A pending
 * sign-off row left behind kept them on the requirement's roster, where
 * sign-off waited for a signature that could never come. Their signed rows are
 * receipts of sign-offs they made and stay.
 */
type AssignmentRow = { id: string; userId: string; signedOffAt: Date | null };
type Write = { op: "delete" | "update"; table: unknown; where: SQL; inTx: boolean };

function removalDb(assignments: AssignmentRow[]) {
  const writes: Write[] = [];
  const state = { inTx: false };
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
    // A select either becomes a subquery or, for the leaving member's rows, is
    // read under a lock; only the locked read returns rows.
    select: () => ({
      from: () => ({
        where: () => ({ for: async () => assignments }),
      }),
    }),
    delete: (table: unknown) => ({
      where: async (where: SQL) => {
        writes.push({ op: "delete", table, where, inTx: state.inTx });
      },
    }),
    update: (table: unknown) => ({
      set: () => ({
        where: async (where: SQL) => {
          writes.push({ op: "update", table, where, inTx: state.inTx });
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
  return { db, writes };
}

async function removeMember(assignments: AssignmentRow[]) {
  const { db, writes } = removalDb(assignments);
  const caller = createCallerFactory(teamRouter)({
    db: db as unknown as TRPCContext["db"],
    session: { role: "admin", accessLevel: "full" } as TRPCContext["session"],
    userId: OWNER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  await caller.removeMember({ userId: MEMBER });
  return writes;
}

const deletedAssignmentIds = (writes: Write[]) =>
  writes
    .filter((w) => w.op === "delete" && w.table === requirementAssignment)
    .flatMap((w) => new PgDialect().sqlToQuery(w.where).params);

describe("team.removeMember", () => {
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
    },
    // isMemberOf builds a subquery from this; nothing reads it.
    select: () => ({ from: () => ({ where: () => ({}) }) }),
    insert: () => ({
      values: (values: unknown) => {
        stored.values = values;
        return {
          onConflictDoUpdate: ({ set }: { set: unknown }) => {
            stored.set = set;
            return { returning: async () => [{ id: "invite-1" }] };
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
