import { describe, expect, test } from "bun:test";
import { FREQUENCIES, IMPACTS } from "@/lib/compliance/bsi-200-3";
import {
  fromScale,
  ratingRows,
  sliceOf,
  standingOf,
  toScale,
  treatmentFor,
} from "./ratings";

describe("the 200-3 scales as a risk row stores them", () => {
  test("round-trips every pair through the stored steps", () => {
    for (const frequency of FREQUENCIES) {
      for (const impact of IMPACTS) {
        const { likelihood, impact: damage } = toScale({ frequency, impact });
        expect(fromScale(likelihood, damage)).toEqual({ frequency, impact });
      }
    }
  });

  test("reads a row on another scale as none of its own", () => {
    expect(fromScale(0, 2)).toBeNull();
    expect(fromScale(5, 2)).toBeNull();
    expect(fromScale(2, 5)).toBeNull();
  });
});

describe("what a listed thing already has", () => {
  test("is open without a risk, rated with exactly one on these scales", () => {
    expect(standingOf([])).toEqual({ kind: "open" });
    expect(standingOf([{ id: "r1", likelihood: 3, impact: 2 }])).toEqual({
      kind: "rated",
      riskId: "r1",
      rating: { frequency: "frequent", impact: "limited" },
    });
  });

  test("is kept for the register with several risks, or one on another scale", () => {
    expect(
      standingOf([
        { id: "r1", likelihood: 1, impact: 4 },
        { id: "r2", likelihood: 3, impact: 2 },
      ]),
    ).toEqual({ kind: "kept", count: 2, highest: "medium" });
    expect(standingOf([{ id: "r1", likelihood: 5, impact: 5 }])).toEqual({
      kind: "kept",
      count: 1,
      highest: null,
    });
  });
});

test("proposes to accept only low risks, as 200-3 describes the practice", () => {
  expect(treatmentFor("low")).toBe("accept");
  expect(treatmentFor("medium")).toBe("mitigate");
  expect(treatmentFor("very_high")).toBe("mitigate");
});

test("puts processes on no screen, software and technology on their own", () => {
  expect(sliceOf("process")).toBeNull();
  expect(sliceOf("application")).toBe("software");
  expect(sliceOf("cloud_service")).toBe("software");
  expect(sliceOf("server")).toBe("technology");
  expect(sliceOf("room")).toBe("technology");
  expect(sliceOf("other")).toBe("technology");
});

describe("the rows of a rating screen", () => {
  const lists = {
    assets: [
      { id: "a1", name: "DATEV", type: "application", supplierId: "s1" },
      { id: "a2", name: "Server room", type: "room", supplierId: null },
      { id: "a3", name: "Sales", type: "process", supplierId: null },
    ],
    suppliers: [
      { id: "s1", name: "DATEV eG" },
      { id: "s2", name: "Cleaning company" },
    ],
    assetRisks: [{ id: "r1", likelihood: 2, impact: 3, linked: ["a1"] }],
    supplierRisks: [],
  };

  test("names each asset's provider and carries what the register holds for it", () => {
    expect(ratingRows("software", lists)).toEqual([
      {
        kind: "asset",
        key: "asset:a1",
        id: "a1",
        name: "DATEV",
        provider: "DATEV eG",
        standing: {
          kind: "rated",
          riskId: "r1",
          rating: { frequency: "medium", impact: "considerable" },
        },
      },
    ]);
    expect(ratingRows("technology", lists).map((r) => r.id)).toEqual(["a2"]);
  });

  test("lists every supplier with the assets it provides", () => {
    const rows = ratingRows("suppliers", lists);
    expect(rows.map((r) => (r.kind === "supplier" ? r.provides : null))).toEqual([
      ["DATEV"],
      [],
    ]);
    expect(rows.every((r) => r.standing.kind === "open")).toBe(true);
  });
});
