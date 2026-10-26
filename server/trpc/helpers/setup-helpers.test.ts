/**
 * The team named at setup is invited by `processTeamRoleAssignments`. It used to skip anyone
 * whose role owns no category (the DPO owns none in NIS 2), silently, and mailed the others from
 * inside the setup's transaction, before the rows it linked to were committed.
 */
import { describe, expect, test } from "bun:test";
import { ALL_ROLE_KEYS } from "@/lib/compliance/role-keys";
import type { DbOrTx } from "@/lib/db";
import { companySetupInput, processTeamRoleAssignments } from "./setup-helpers";

describe("companySetupInput", () => {
  const company = { name: "Acme", sector: "energy", entityType: "important" } as const;
  const withTeam = (teamRoles: unknown) =>
    companySetupInput.safeParse({ ...company, teamRoles });

  test("takes only the known roles, since everyone named is mailed", () => {
    expect(withTeam([{ roleKey: "dpo", email: "dana@example.test" }]).success).toBe(true);
    expect(withTeam([{ roleKey: "intern", email: "x@example.test" }]).success).toBe(
      false,
    );
  });

  test("names one person per role", () => {
    const everyRole = ALL_ROLE_KEYS.map((roleKey, i) => ({
      roleKey,
      email: `p${i}@example.test`,
    }));
    expect(withTeam(everyRole).success).toBe(true);
    const twice = [
      { roleKey: "ceo", email: "a@example.test" },
      { roleKey: "ceo", email: "b@example.test" },
    ];
    expect(withTeam(twice).success).toBe(false);
  });
});

/** `members` are the addresses already in the company. */
function fakeDb(members: readonly string[] = []) {
  const invites: { email: string; token: string; assignmentContext: unknown }[] = [];
  const asked: string[] = [];
  const db = {
    query: {
      requirementCategory: { findMany: async () => [] },
      // The member check: the fake cannot read the condition, so it answers by call order.
      user: {
        findFirst: async () => {
          const email = pending.shift() ?? "";
          asked.push(email);
          return members.includes(email) ? { id: "member-1" } : undefined;
        },
      },
    },
    // getSlugsForRole: no category lists the role. isMemberOf builds a subquery from it too.
    select: () => ({ from: () => ({ where: async () => [] }) }),
    insert: () => ({
      values: (values: { email: string; token: string; assignmentContext: unknown }) => {
        invites.push(values);
        return { onConflictDoUpdate: async () => undefined };
      },
    }),
  };
  const pending: string[] = [];
  return { db: db as unknown as DbOrTx, invites, pending, asked };
}

const setup = (db: DbOrTx, teamRoles: { roleKey: string; email: string }[]) =>
  processTeamRoleAssignments(db, {
    teamRoles,
    companyId: "company-1",
    userId: "user-1",
    userEmail: "owner@example.test",
    frameworkAssessmentMap: new Map(),
  });

describe("processTeamRoleAssignments", () => {
  test("invites a person whose role owns no category, with the role itself", async () => {
    const { db, invites } = fakeDb();
    const toMail = await setup(db, [{ roleKey: "dpo", email: "Dana@Example.test" }]);

    expect(invites).toHaveLength(1);
    expect(invites[0]).toMatchObject({
      email: "dana@example.test",
      assignmentContext: { roleKeys: ["dpo"], categoryIds: [] },
    });
    expect(toMail).toEqual([
      {
        email: "dana@example.test",
        inviteUrl: expect.stringContaining(`/invite/${invites[0]?.token}`),
        roleKeys: ["dpo"],
      },
    ]);
  });

  test("hands the invites back for mailing instead of mailing them itself", async () => {
    const { db } = fakeDb();
    const toMail = await setup(db, [
      { roleKey: "ceo", email: "ceo@example.test" },
      { roleKey: "cto", email: "ceo@example.test" },
    ]);
    // One person named for two roles is one invite, carrying both.
    expect(toMail.map((i) => [i.email, i.roleKeys])).toEqual([
      ["ceo@example.test", ["ceo", "cto"]],
    ]);
  });

  test("never invites the person doing the setup", async () => {
    const { db, invites } = fakeDb();
    const toMail = await setup(db, [{ roleKey: "ciso", email: "owner@example.test" }]);
    expect(invites).toEqual([]);
    expect(toMail).toEqual([]);
  });

  test("leaves someone already in the company alone, and their accepted invite with them", async () => {
    const { db, invites, pending, asked } = fakeDb(["anna@example.test"]);
    pending.push("anna@example.test", "ben@example.test");
    const toMail = await setup(db, [
      { roleKey: "ceo", email: "anna@example.test" },
      { roleKey: "cto", email: "ben@example.test" },
    ]);
    expect(asked).toEqual(["anna@example.test", "ben@example.test"]);
    expect(invites.map((i) => i.email)).toEqual(["ben@example.test"]);
    expect(toMail.map((i) => i.email)).toEqual(["ben@example.test"]);
  });
});
