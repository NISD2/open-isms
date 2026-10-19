import { describe, expect, test } from "bun:test";
import {
  type SatisfactionEdge,
  satisfactionTargets,
  takesCredit,
} from "./satisfaction-targets";

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
  // The same record, signed once, counts in the other framework.
  test("credits the other framework's requirement on the same record", () => {
    expect(satisfactionTargets(EDGES, "nis2-2.1", frameworkOf)).toEqual(["iso-6.1"]);
  });

  // A partial overlap leaves a gap the other framework still asks for.
  test("credits nothing through an overlapping edge", () => {
    expect(satisfactionTargets(EDGES, "nis2-2.1", frameworkOf)).not.toContain("iso-8.2");
    expect(satisfactionTargets(EDGES, "nis2-2.4", frameworkOf)).toEqual([]);
  });

  test("never comes back into the source's own framework through a bridge", () => {
    expect(satisfactionTargets(EDGES, "nis2-2.1", frameworkOf)).not.toContain("nis2-2.4");
  });

  test("works the same from the other framework's side", () => {
    expect(satisfactionTargets(EDGES, "iso-6.1", frameworkOf)).toEqual(["nis2-2.1"]);
  });

  test("chains through the same record into a third framework", () => {
    const chain = [
      edge("nis2-2.1", "iso-6.1", "equivalent"),
      edge("iso-6.1", "gdpr-32", "equivalent"),
    ];
    const frameworks = { ...FRAMEWORK, "gdpr-32": "gdpr" };
    expect(satisfactionTargets(chain, "nis2-2.1", (id) => frameworks[id])).toEqual([
      "iso-6.1",
      "gdpr-32",
    ]);
  });

  test("does not walk past an overlapping edge", () => {
    const chain = [
      edge("nis2-2.4", "iso-5.2", "overlapping"),
      edge("iso-5.2", "iso-9.3", "equivalent"),
    ];
    const frameworks = { ...FRAMEWORK, "iso-9.3": "other" };
    expect(satisfactionTargets(chain, "nis2-2.4", (id) => frameworks[id])).toEqual([]);
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

describe("takesCredit", () => {
  const open = { status: "in_progress", requiredSignOffRole: null, rostered: false };

  test("credits an open target the signer could have signed directly", () => {
    expect(takesCredit(open, "ciso")).toBe(true);
    expect(takesCredit({ ...open, status: "not_started" }, "ciso")).toBe(true);
    expect(takesCredit({ ...open, status: "needs_review" }, "ciso")).toBe(true);
    expect(takesCredit({ ...open, status: "rejected" }, "ciso")).toBe(true);
  });

  // A signature, an approval or a recorded "not applicable" is someone's decision; credit
  // from another framework never writes over it.
  test("leaves a signed, approved or set-aside target as it is", () => {
    for (const status of ["completed", "approved", "not_applicable"]) {
      expect(takesCredit({ ...open, status }, "ciso")).toBe(false);
    }
  });

  test("leaves a target whose own assigned signers still owe a signature", () => {
    expect(takesCredit({ ...open, rostered: true }, "ceo")).toBe(false);
  });

  // Signing a CISO item must not put a CISO signature on an item that asks for management.
  test("credits only where the signer holds the target's role, or is management", () => {
    expect(takesCredit({ ...open, requiredSignOffRole: "ceo" }, "ciso")).toBe(false);
    expect(takesCredit({ ...open, requiredSignOffRole: "ceo" }, "ceo")).toBe(true);
    expect(takesCredit({ ...open, requiredSignOffRole: "dpo" }, "ceo")).toBe(true);
    expect(takesCredit(open, "admin")).toBe(false);
  });
});
