import { describe, expect, test } from "bun:test";
import { type SatisfactionEdge, satisfactionTargets } from "./satisfaction-targets";

const FRAMEWORK: Readonly<Record<string, string>> = {
  "nis2-2.1": "nis2",
  "nis2-2.4": "nis2",
  "nis2-7.3": "nis2",
  "iso-6.1": "iso27001",
  "iso-5.2": "iso27001",
  "iso-9.3": "iso27001",
  "iso-8.2": "iso27001",
};
const frameworkOf = (id: string) => FRAMEWORK[id];

const edge = (
  a: string,
  b: string,
  kind: SatisfactionEdge["equivalenceKind"],
): SatisfactionEdge => ({ requirementAId: a, requirementBId: b, equivalenceKind: kind });

// The local data that signed the security policy off: 2.1 equivalent to ISO 6.1, which overlaps 2.4.
const EDGES = [
  edge("iso-6.1", "nis2-2.1", "equivalent"),
  edge("iso-6.1", "nis2-2.4", "overlapping"),
  edge("iso-5.2", "nis2-2.4", "overlapping"),
  edge("iso-8.2", "nis2-2.1", "overlapping"),
  edge("iso-9.3", "nis2-7.3", "equivalent"),
];

describe("satisfactionTargets", () => {
  test("credits the other framework's linked requirements", () => {
    expect(satisfactionTargets(EDGES, "nis2-2.1", frameworkOf).sort()).toEqual([
      "iso-6.1",
      "iso-8.2",
    ]);
  });

  test("never comes back into the source's own framework through a bridge", () => {
    expect(satisfactionTargets(EDGES, "nis2-2.1", frameworkOf)).not.toContain("nis2-2.4");
  });

  test("works the same from the other framework's side", () => {
    expect(satisfactionTargets(EDGES, "iso-6.1", frameworkOf).sort()).toEqual([
      "nis2-2.1",
      "nis2-2.4",
    ]);
  });

  test("does not walk past an overlapping edge", () => {
    const chain = [
      edge("nis2-2.4", "iso-5.2", "overlapping"),
      edge("iso-5.2", "iso-9.3", "equivalent"),
    ];
    const frameworks = { ...FRAMEWORK, "iso-9.3": "other" };
    expect(satisfactionTargets(chain, "nis2-2.4", (id) => frameworks[id])).toEqual([
      "iso-5.2",
    ]);
  });

  test("does not walk through a requirement of the source's own framework", () => {
    const chain = [
      edge("nis2-2.1", "iso-6.1", "equivalent"),
      edge("iso-6.1", "nis2-7.3", "equivalent"),
      edge("nis2-7.3", "iso-9.3", "equivalent"),
    ];
    expect(satisfactionTargets(chain, "nis2-2.1", frameworkOf)).toEqual(["iso-6.1"]);
  });

  test("skips a requirement whose framework is unknown, and credits nothing from an unknown source", () => {
    expect(
      satisfactionTargets(
        [edge("nis2-2.1", "ghost", "equivalent")],
        "nis2-2.1",
        frameworkOf,
      ),
    ).toEqual([]);
    expect(satisfactionTargets(EDGES, "ghost", frameworkOf)).toEqual([]);
  });
});
