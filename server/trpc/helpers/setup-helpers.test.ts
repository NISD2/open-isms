/**
 * The team named at setup is invited by `processTeamRoleAssignments`. It used to skip anyone
 * whose role owns no category (the DPO owns none in NIS 2), silently, and mailed the others from
 * inside the setup's transaction, before the rows it linked to were committed.
 */
import { describe, expect, test } from "bun:test";
import type { DbOrTx } from "@/lib/db";
import { processTeamRoleAssignments } from "./setup-helpers";

function fakeDb() {
  const invites: { email: string; token: string; assignmentContext: unknown }[] = [];
  const db = {
    query: { requirementCategory: { findMany: async () => [] } },
    // getSlugsForRole: no category lists the role.
    select: () => ({ from: () => ({ where: async () => [] }) }),
    insert: () => ({
      values: (values: { email: string; token: string; assignmentContext: unknown }) => {
        invites.push(values);
        return { onConflictDoUpdate: async () => undefined };
      },
    }),
  };
  return { db: db as unknown as DbOrTx, invites };
}

const setup = (db: DbOrTx, teamRoles: { roleKey: string; email: string }[]) =>
  processTeamRoleAssignments(db, {
    teamRoles,
    companyId: "company-1",
    companyName: "Acme",
    userId: "user-1",
    userEmail: "owner@example.test",
    userName: "Olga Owner",
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
});
