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
type Write = {
  op: "delete" | "update";
  table: unknown;
  where: SQL;
  inTx: boolean;
  values?: Record<string, unknown>;
};

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

const DAY_MS = 24 * 60 * 60 * 1000;
const INVITE_ID = "44444444-4444-4444-8444-444444444444";

const adminCaller = (db: unknown) =>
  createCallerFactory(teamRouter)({
    db: db as TRPCContext["db"],
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

type ExistingInvite = { token: string; status: string; expiresAt: Date };

/** `invite` to an address that already has a row in this company. */
async function reinvite(existing: ExistingInvite) {
  const stored: { values?: { token?: string }; set?: { token?: string } } = {};
  const db = {
    query: {
      user: { findFirst: async () => undefined },
      company: { findFirst: async () => ({ name: "Acme" }) },
      companyInvite: { findFirst: async () => existing },
    },
    select: () => ({ from: () => ({ where: () => ({}) }) }),
    insert: () => ({
      values: (values: { token?: string }) => {
        stored.values = values;
        return {
          onConflictDoUpdate: ({ set }: { set: { token?: string } }) => {
            stored.set = set;
            return { returning: async () => [{ id: "invite-1" }] };
          },
        };
      },
    }),
  };
  const result = await adminCaller(db).invite({ email: "anna@example.test" });
  return { stored, result };
}

describe("team.invite to an address invited before", () => {
  test("keeps the link of the invite still open, so the first mail keeps working", async () => {
    const { stored, result } = await reinvite({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    expect(stored.values?.token).toBe("first-mail");
    expect(stored.set?.token).toBe("first-mail");
    expect(result.inviteUrl.endsWith("/invite/first-mail")).toBe(true);
  });

  test("issues a new link once the old one has expired", async () => {
    const { stored } = await reinvite({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() - DAY_MS),
    });
    expect(stored.set?.token).not.toBe("first-mail");
    expect(stored.set?.token).toHaveLength(64);
  });

  test("issues a new link after a withdrawal, so the withdrawn one stays dead", async () => {
    const { stored } = await reinvite({
      token: "first-mail",
      status: "revoked",
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    expect(stored.set?.token).not.toBe("first-mail");
  });
});

/** `resendInvite` over one stored invite, or none. */
async function resend(stored: (ExistingInvite & { email: string }) | undefined) {
  const writes: { set: { token: string; expiresAt: Date }; params: unknown[] }[] = [];
  const db = {
    query: {
      company: { findFirst: async () => ({ name: "Acme" }) },
      companyInvite: {
        findFirst: async () =>
          stored && {
            ...stored,
            assignmentContext: { roleKeys: ["ceo"], categoryIds: [] },
          },
      },
    },
    update: () => ({
      set: (set: { token: string; expiresAt: Date }) => ({
        where: (where: SQL) => ({
          returning: async () => {
            writes.push({ set, params: new PgDialect().sqlToQuery(where).params });
            return [{ id: INVITE_ID }];
          },
        }),
      }),
    }),
  };
  const result = await adminCaller(db).resendInvite({ inviteId: INVITE_ID });
  return { result, writes };
}

describe("team.resendInvite", () => {
  test("an open invite keeps its link and gets seven more days", async () => {
    const before = Date.now();
    const { result, writes } = await resend({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(before + DAY_MS),
      email: "anna@example.test",
    });
    expect(result.inviteUrl.endsWith("/invite/first-mail")).toBe(true);
    expect(writes[0]?.set.token).toBe("first-mail");
    expect(writes[0]?.set.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 7 * DAY_MS,
    );
  });

  test("an expired invite gets a new link", async () => {
    const { result, writes } = await resend({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() - DAY_MS),
      email: "anna@example.test",
    });
    expect(writes[0]?.set.token).not.toBe("first-mail");
    expect(result.inviteUrl.endsWith(`/invite/${writes[0]?.set.token}`)).toBe(true);
  });

  test("writes only to an open invite of the caller's own company", async () => {
    const { writes } = await resend({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() + DAY_MS),
      email: "anna@example.test",
    });
    expect(writes[0]?.params).toEqual(
      expect.arrayContaining([INVITE_ID, COMPANY, "pending"]),
    );
  });

  test("refuses an invite that is not open in this company", async () => {
    await expect(resend(undefined)).rejects.toThrow("no longer open");
  });
});

describe("team.listInvites", () => {
  test("says which links have expired and hands over nothing but what the page shows", async () => {
    const now = Date.now();
    const rows = [
      {
        id: "a",
        email: "open@example.test",
        token: "t-open",
        expiresAt: new Date(now + DAY_MS),
        assignmentContext: {
          roleKeys: ["cto"],
          categoryIds: ["55555555-5555-4555-8555-555555555555"],
        },
      },
      {
        id: "b",
        email: "late@example.test",
        token: "t-late",
        expiresAt: new Date(now - DAY_MS),
        assignmentContext: null,
      },
    ];
    let columns: unknown;
    const db = {
      query: {
        companyInvite: {
          findMany: async (opts: { columns: unknown }) => {
            columns = opts.columns;
            return rows;
          },
        },
      },
    };
    const listed = await adminCaller(db).listInvites();
    expect(listed.map((i) => [i.email, i.expired, i.role])).toEqual([
      ["open@example.test", false, "cto"],
      ["late@example.test", true, null],
    ]);
    expect(Object.keys(columns as object).sort()).toEqual(
      ["assignmentContext", "email", "expiresAt", "id", "token"].sort(),
    );
    expect(Object.keys(listed[0] ?? {}).sort()).toEqual(
      ["email", "expired", "expiresAt", "id", "role", "token"].sort(),
    );
  });
});
