/**
 * The one list of procedures an AI assistant's key may reach, and the two rules it drives: the
 * tools' caller type, and the refusal every procedure tier gives a key call off the list.
 */
import { describe, expect, test } from "bun:test";
import { KEY_PROCEDURES, type KeyCaller, keyMayCall } from "./procedures";

// What the type leaves out does not compile when a tool reaches for it.
type Has<K extends PropertyKey, T> = K extends keyof T ? true : false;
const noBilling: Has<"billing", KeyCaller> = false;
const noTeam: Has<"team", KeyCaller> = false;
const noApproval: Has<"approvePolicies", KeyCaller["durchgang"]> = false;
const noFinish: Has<"finish", KeyCaller["durchgang"]> = false;
const noDelete: Has<"delete", KeyCaller["supplier"]> = false;

describe("what an assistant's key may reach", () => {
  test("the procedures the tools call, by their tRPC path", () => {
    expect(keyMayCall("durchgang.walk")).toBe(true);
    expect(keyMayCall("durchgang.rate")).toBe(true);
    expect(keyMayCall("evidence.confirmUpload")).toBe(true);
    expect(keyMayCall("supplierInvite.create")).toBe(true);
  });

  test("the records only through the one read, and never giving up the money back to read them", () => {
    expect(keyMayCall("records.readPart")).toBe(true);
    expect(KEY_PROCEDURES.records).toEqual(["readPart"]);
    expect(keyMayCall("billing.waiveMoneyBack")).toBe(false);
    // An assistant never lets itself read them: that is the admin's switch, in the app.
    expect(keyMayCall("assistants.setReadRecords")).toBe(false);
  });

  test("of the supplier invites, only sending one: never listing or revoking them", () => {
    expect(keyMayCall("supplierInvite.list")).toBe(false);
    expect(keyMayCall("supplierInvite.revoke")).toBe(false);
  });

  test("never a decision, a signature, a deletion, billing or the team", () => {
    for (const path of [
      "durchgang.approvePolicies",
      "durchgang.finish",
      "durchgang.decline",
      "durchgang.planMeasure",
      "supplier.delete",
      "evidence.deleteEvidence",
      "billing.place",
      "team.invite",
      "user.createMcpKey",
      "user.disconnectMcp",
      "assistants.setAllowed",
    ]) {
      expect(keyMayCall(path)).toBe(false);
    }
    expect([noBilling, noTeam, noApproval, noFinish, noDelete]).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  test("a path is a router and one procedure, so a router alone opens nothing", () => {
    expect(keyMayCall("durchgang")).toBe(false);
    expect(Object.keys(KEY_PROCEDURES)).not.toContain("user");
  });
});
