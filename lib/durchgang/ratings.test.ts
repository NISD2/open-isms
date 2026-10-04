import { describe, expect, test } from "bun:test";
import { FREQUENCIES, IMPACTS } from "@/lib/compliance/bsi-200-3";
import {
  asksHosting,
  byLevel,
  cellCount,
  fromScale,
  hostingOf,
  inCell,
  levelGroups,
  levelOfStanding,
  type MappedRisk,
  ratingRows,
  recoveryOrder,
  signsIn,
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
      note: "",
    });
  });

  test("carries the risk's own note with its one rating", () => {
    const rated = standingOf([
      { id: "r1", likelihood: 3, impact: 2, note: "Backups every night" },
    ]);
    expect(rated.kind === "rated" && rated.note).toBe("Backups every night");
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
      {
        id: "a1",
        catalogId: "fin-accounting",
        name: "DATEV",
        type: "application",
        description: "Accounting and payroll, with every employee's salary",
      },
      { id: "a2", catalogId: null, name: "Server room", type: "room", description: null },
      { id: "a3", catalogId: null, name: "Sales", type: "process", description: null },
    ],
    suppliers: [
      { id: "s1", name: "DATEV eG" },
      { id: "s2", name: "Cleaning company" },
      { id: "s3", name: "Systemhaus Muster" },
    ],
    // DATEV is sold by its maker and looked after by the IT provider: two providers.
    links: [
      { assetId: "a1", supplierId: "s1" },
      { assetId: "a1", supplierId: "s3" },
    ],
    assetRisks: [{ id: "r1", likelihood: 2, impact: 3, linked: ["a1"] }],
    supplierRisks: [],
  };

  test("names what each asset is for, its kind and every provider, and carries what the register holds", () => {
    expect(ratingRows("software", lists)).toEqual([
      {
        kind: "asset",
        key: "asset:a1",
        id: "a1",
        name: "DATEV",
        about: "Accounting and payroll, with every employee's salary",
        catalogId: "fin-accounting",
        providers: ["DATEV eG", "Systemhaus Muster"],
        standing: {
          kind: "rated",
          riskId: "r1",
          rating: { frequency: "medium", impact: "considerable" },
          note: "",
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
      ["DATEV"],
    ]);
    expect(rows.every((r) => r.standing.kind === "open")).toBe(true);
  });
});

describe("where a thing runs", () => {
  test("asks it of software and servers, never of devices, rooms or lines", () => {
    for (const type of [
      "application",
      "cloud_service",
      "database",
      "data_store",
      "server",
    ]) {
      expect(asksHosting(type)).toBe(true);
    }
    for (const type of ["endpoint", "room", "network", "iot", "ot_ics", "physical"]) {
      expect(asksHosting(type)).toBe(false);
    }
  });

  test("shows the answer, else the cloud for a cloud service and nothing for the rest", () => {
    expect(hostingOf({ type: "cloud_service", hosting: null })).toBe("cloud");
    expect(hostingOf({ type: "cloud_service", hosting: "in_house" })).toBe("in_house");
    expect(hostingOf({ type: "application", hosting: null })).toBeNull();
    expect(hostingOf({ type: "server", hosting: "cloud" })).toBe("cloud");
  });
});

describe("where people sign in, and which gap comes first", () => {
  test("asks about software and the network, never devices, rooms or processes", () => {
    for (const type of [
      "application",
      "cloud_service",
      "database",
      "data_store",
      "network",
    ]) {
      expect(signsIn(type)).toBe(true);
    }
    for (const type of ["endpoint", "room", "server", "process", "ot_ics"]) {
      expect(signsIn(type)).toBe(false);
    }
  });

  test("orders the highest level first and unrated rows last", () => {
    const rows = [
      { name: "a", level: null },
      { name: "b", level: "medium" },
      { name: "c", level: "very_high" },
    ] as const;
    expect([...rows].sort(byLevel).map((r) => r.name)).toEqual(["c", "b", "a"]);
  });

  test("reads a level off each standing", () => {
    expect(levelOfStanding({ kind: "open" })).toBeNull();
    expect(
      levelOfStanding({
        kind: "rated",
        riskId: "r",
        rating: { frequency: "rare", impact: "negligible" },
      }),
    ).toBe("low");
    expect(levelOfStanding({ kind: "kept", count: 2, highest: "high" })).toBe("high");
  });
});

describe("the company's risks on the matrix", () => {
  const risks: readonly MappedRisk[] = [
    {
      key: "asset:erp",
      name: "ERP",
      rating: { frequency: "rare", impact: "existential" },
      level: "medium",
    },
    {
      key: "asset:datev",
      name: "DATEV",
      rating: { frequency: "rare", impact: "existential" },
      level: "medium",
    },
    {
      key: "asset:web",
      name: "Website",
      rating: { frequency: "medium", impact: "negligible" },
      level: "low",
    },
    { key: "asset:server", name: "Server", rating: null, level: "very_high" },
    { key: "asset:printer", name: "Drucker", rating: null, level: null },
  ];
  const names = (list: readonly MappedRisk[]) => list.map((r) => r.name);

  test("counts each rated thing in its cell, and a thing with several risks in none", () => {
    expect(names(inCell(risks, "rare", "existential"))).toEqual(["ERP", "DATEV"]);
    expect(cellCount(risks, "rare", "existential")).toBe(2);
    expect(cellCount(risks, "medium", "negligible")).toBe(1);
    expect(cellCount(risks, "frequent", "existential")).toBe(0);
    const total = FREQUENCIES.flatMap((f) => IMPACTS.map((i) => cellCount(risks, f, i)));
    expect(total.reduce((a, b) => a + b, 0)).toBe(3);
  });

  test("lists every thing with a level by level, highest first, and skips empty levels", () => {
    expect(
      levelGroups(risks).map((g) => ({ level: g.level, names: names(g.risks) })),
    ).toEqual([
      { level: "very_high", names: ["Server"] },
      { level: "medium", names: ["ERP", "DATEV"] },
      { level: "low", names: ["Website"] },
    ]);
  });
});

describe("the order systems come back in", () => {
  const assets = [
    { id: "a", name: "Website", type: "application" },
    { id: "b", name: "ERP", type: "application" },
    { id: "c", name: "VPN", type: "network" },
    { id: "d", name: "Laptops", type: "endpoint" },
    { id: "e", name: "Büro", type: "room" },
    { id: "f", name: "Ablage", type: "data_store" },
    { id: "g", name: "Server", type: "server" },
  ];
  const risk = (id: string, likelihood: number, impact: number, linked: string) => ({
    id,
    likelihood,
    impact,
    linked: [linked],
  });

  test("puts the largest damage first, then the more frequent, then by name; unrated last", () => {
    const risks = [
      risk("r1", 1, 4, "a"), // rare, existential
      risk("r2", 3, 4, "b"), // frequent, existential
      risk("r3", 4, 2, "c"), // very frequent, limited
      risk("r4", 3, 4, "d"), // a laptop: never in the order
    ];
    expect(recoveryOrder(assets, risks)).toEqual([
      "ERP",
      "Website",
      "VPN",
      "Ablage",
      "Server",
    ]);
  });

  test("leaves out devices and rooms, which are not brought back from a backup", () => {
    expect(recoveryOrder(assets, [])).not.toContain("Laptops");
    expect(recoveryOrder(assets, [])).not.toContain("Büro");
  });
});
