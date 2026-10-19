import { describe, expect, test } from "bun:test";
import { approvalLapses, sha256Hex } from "./policy-approval";

const approved = {
  status: "approved",
  title: "Leitlinie",
  content: "Text v1",
  fileKey: null,
};

describe("approvalLapses", () => {
  // Management approved this text; a changed text carries no approval.
  test("an edit to the text, title or file of an approved policy ends its approval", () => {
    expect(approvalLapses(approved, { content: "Text v2" })).toBe(true);
    expect(approvalLapses(approved, { title: "Neue Leitlinie" })).toBe(true);
    expect(approvalLapses(approved, { fileKey: "c/1/policy.pdf" })).toBe(true);
  });

  test("an edit that leaves the text as it is keeps the approval", () => {
    expect(approvalLapses(approved, { content: "Text v1" })).toBe(false);
    expect(approvalLapses(approved, {})).toBe(false);
  });

  test("a draft has no approval to lose", () => {
    expect(approvalLapses({ ...approved, status: "draft" }, { content: "Text v2" })).toBe(
      false,
    );
  });
});

test("sha256Hex is the lowercase hex digest the database check accepts", () => {
  expect(sha256Hex("abc")).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});
