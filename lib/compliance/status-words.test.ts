import { describe, expect, test } from "bun:test";
import { requirementStatusLabel } from "./status-words";

describe("requirementStatusLabel", () => {
  const own = { coveredBy: null, approved: false } as const;

  test("a requirement's own state, in the journey's words", () => {
    expect(requirementStatusLabel({ ...own, state: "awaiting" }, "de")).toBe(
      "Wartet auf Freigabe",
    );
    expect(requirementStatusLabel({ ...own, state: "todo" }, "en")).toBe("Open");
  });

  test("a reviewer's approval reads as reviewed, a plain signature as signed off", () => {
    expect(
      requirementStatusLabel({ ...own, state: "signed", approved: true }, "en"),
    ).toBe("Reviewed");
    expect(requirementStatusLabel({ ...own, state: "signed" }, "en")).toBe("Signed off");
  });

  test("names the walk items that met a requirement, signed or still waiting", () => {
    const coveredBy = { kind: "walk", codes: ["7.1", "7.3"] } as const;
    expect(
      requirementStatusLabel({ state: "signed", coveredBy, approved: false }, "de"),
    ).toBe("Im Durchgang mit 7.1 und 7.3 freigegeben");
    expect(
      requirementStatusLabel({ state: "awaiting", coveredBy, approved: false }, "en"),
    ).toBe("In the walkthrough with 7.1 and 7.3, awaiting sign-off");
    expect(
      requirementStatusLabel(
        { state: "na", coveredBy: { kind: "not_required" }, approved: false },
        "en",
      ),
    ).toBe("Not required by law");
  });
});
