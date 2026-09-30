/**
 * `setMemberRole` lets an organization have more than one admin. Two rules keep
 * that from becoming a way to lose or take over an organization: the person who
 * created it always stays an admin, and there is always at least one admin.
 */
import { describe, expect, mock, test } from "bun:test";

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
