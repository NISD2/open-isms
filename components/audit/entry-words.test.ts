import { describe, expect, test } from "bun:test";
import {
  failedCallCode,
  failedCallDescription,
} from "@nisd2/isms-trpc/audit/failed-call";
import { entryWords } from "./entry-words";

describe("failedCallCode", () => {
  test("reads back the code the audit middleware writes", () => {
    const description = failedCallDescription("risk.update", "FORBIDDEN");
    expect(description).toBe("risk.update failed (FORBIDDEN)");
    expect(failedCallCode("risk.update", description)).toBe("FORBIDDEN");
  });

  test("only the failure of the row's own action counts", () => {
    expect(failedCallCode("risk.update", "risk.create failed (FORBIDDEN)")).toBeNull();
    expect(failedCallCode("risk.update", "risk.update")).toBeNull();
    expect(failedCallCode("risk.update", "risk.update failed ()")).toBeNull();
    expect(
      failedCallCode("risk.update", "Risk updated, the save failed (twice)"),
    ).toBeNull();
  });
});

describe("entryWords", () => {
  const failed = {
    action: "risk.update",
    description: "risk.update failed (BAD_REQUEST)",
  };

  test("a failed call shows the action's label and the marker, never the raw path", () => {
    expect(entryWords(failed, "Risk updated")).toEqual({
      title: "Risk updated",
      detail: null,
      failed: true,
    });
  });

  test("a failed call without a label falls back to the action, as a successful one does", () => {
    expect(entryWords(failed, null)).toEqual({
      title: "risk.update",
      detail: null,
      failed: true,
    });
  });

  test("a successful call keeps its label, and a written sentence as the second line", () => {
    const sentence = { action: "risk.update", description: "Rating raised to high" };
    expect(entryWords(sentence, "Risk updated")).toEqual({
      title: "Risk updated",
      detail: "Rating raised to high",
      failed: false,
    });
    expect(entryWords(sentence, null).title).toBe("Rating raised to high");
    expect(
      entryWords({ action: "risk.update", description: "risk.update" }, null),
    ).toEqual({
      title: "risk.update",
      detail: null,
      failed: false,
    });
  });
});
