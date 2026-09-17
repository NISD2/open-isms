import { describe, expect, test } from "bun:test";
import { pendingSignersOf } from "./sign-off-roster";

describe("pendingSignersOf", () => {
  test("a requirement nobody was assigned to has no pending roster", () => {
    expect(pendingSignersOf([])).toEqual([]);
  });

  // The regression this function exists for. A single sign-off leaves one row
  // behind as the receipt of who signed; counting it as a roster made that
  // person the only user who could ever sign the requirement again.
  test("a receipt from a past sign-off is not a roster", () => {
    const rows = [{ userId: "alice", signedOffAt: new Date() }];
    expect(pendingSignersOf(rows)).toEqual([]);
  });

  test("an assignee who has not signed is pending", () => {
    const rows = [{ userId: "alice", signedOffAt: null }];
    expect(pendingSignersOf(rows)).toHaveLength(1);
  });

  // Mid-flight N-of-M: one signed, two still owed. The requirement is still
  // the assignment flow's, and only those two may move it.
  test("keeps only the unsigned half of a partly signed roster", () => {
    const rows = [
      { userId: "alice", signedOffAt: new Date() },
      { userId: "bob", signedOffAt: null },
      { userId: "carol", signedOffAt: null },
    ];
    expect(pendingSignersOf(rows).map((r) => r.userId)).toEqual(["bob", "carol"]);
  });

  test("a fully signed roster leaves nobody pending", () => {
    const rows = [
      { userId: "alice", signedOffAt: new Date() },
      { userId: "bob", signedOffAt: new Date() },
    ];
    expect(pendingSignersOf(rows)).toEqual([]);
  });

  // The client reads these rows after a server-component boundary, where the
  // timestamp has become a string. Same answer, or the button and the server
  // disagree about who may sign.
  test("reads a serialized timestamp the same as a Date", () => {
    const rows = [
      { userId: "alice", signedOffAt: "2026-09-17T08:00:00.000Z" },
      { userId: "bob", signedOffAt: null },
    ];
    expect(pendingSignersOf(rows).map((r) => r.userId)).toEqual(["bob"]);
  });
});
