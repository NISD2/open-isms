/**
 * What management sees before it signs: each gap is a fact the company recorded, and a company
 * whose answers leave nothing open sees none.
 */
import { describe, expect, test } from "bun:test";
import { type GapFacts, gapsOf, withPlanSlot } from "./gaps";

const TODAY = new Date("2026-10-03T10:00:00Z");

const complete: GapFacts = {
  signIns: [
    { name: "Microsoft 365", hasMfa: true },
    { name: "DATEV", hasMfa: true },
  ],
  suppliers: [
    { name: "Systemhaus", riskLevel: "high", security: true, incidents: false },
  ],
  backups: [{ name: "NAS", lastRestore: "2026-09-01" }],
  continuity: {
    processes: [{ id: "p1", name: "Auftragsannahme", maxOutage: "day" }],
    systems: [{ id: "s1", name: "ERP", restoreTime: "hours", restoreTimeUnknown: false }],
    links: [{ processId: "p1", assetId: "s1" }],
  },
  reporting: true,
  managers: 1,
  managementTrainings: [{ name: "Anna Beispiel", completedAt: new Date("2025-02-01") }],
  setAside: [],
  today: TODAY,
};

describe("the gaps management sees before it signs", () => {
  test("none when the answers leave nothing open", () => {
    expect(gapsOf(complete)).toEqual([]);
  });

  test("a needed system that comes back too late, and one nobody knows about", () => {
    const facts: GapFacts = {
      ...complete,
      continuity: {
        processes: [{ id: "p1", name: "Auftragsannahme", maxOutage: "hours" }],
        systems: [
          { id: "s1", name: "ERP", restoreTime: "day", restoreTimeUnknown: false },
          { id: "s2", name: "Ablage", restoreTime: null, restoreTimeUnknown: true },
          { id: "s3", name: "Drucker", restoreTime: null, restoreTimeUnknown: false },
        ],
        links: [
          { processId: "p1", assetId: "s1" },
          { processId: "p1", assetId: "s2" },
        ],
      },
    };
    expect(gapsOf(facts)).toEqual([
      { kind: "recovery_slow", names: ["ERP"] },
      { kind: "recovery_unknown", names: ["Ablage"] },
    ]);
  });

  test("a process that must keep running without a tolerance is a gap of its own, and never lets a shared system pass as in time", () => {
    const facts: GapFacts = {
      ...complete,
      continuity: {
        processes: [
          { id: "p1", name: "Auftragsannahme", maxOutage: "hours" },
          { id: "p2", name: "Versand", maxOutage: null },
        ],
        systems: [
          { id: "s1", name: "ERP", restoreTime: "day", restoreTimeUnknown: false },
        ],
        links: [
          { processId: "p1", assetId: "s1" },
          { processId: "p2", assetId: "s1" },
        ],
      },
    };
    expect(gapsOf(facts)).toEqual([
      { kind: "tolerance", names: ["Versand"] },
      { kind: "recovery_slow", names: ["ERP"] },
    ]);
    // Alone, the unrated process makes the system "unrated", which is no recovery gap; the
    // missing tolerance still is.
    expect(
      gapsOf({
        ...facts,
        continuity: { ...facts.continuity, links: [{ processId: "p2", assetId: "s1" }] },
      }),
    ).toEqual([{ kind: "tolerance", names: ["Versand"] }]);
  });

  test("programs without a second factor, and whether none has one", () => {
    expect(
      gapsOf({
        ...complete,
        signIns: [...complete.signIns, { name: "Shop", hasMfa: false }],
      }),
    ).toEqual([{ kind: "second_factor", names: ["Shop"], all: false }]);
    expect(
      gapsOf({ ...complete, signIns: [{ name: "Shop", hasMfa: false }] })[0],
    ).toEqual({ kind: "second_factor", names: ["Shop"], all: true });
  });

  test("a high-risk supplier with nothing agreed, not a low-risk one", () => {
    const suppliers = [
      { name: "Cloud", riskLevel: "critical", security: false, incidents: false },
      { name: "Kantine", riskLevel: "low", security: false, incidents: false },
    ];
    expect(gapsOf({ ...complete, suppliers })).toEqual([
      { kind: "supplier", names: ["Cloud"] },
    ]);
  });

  test("a backup system without a restore that worked", () => {
    expect(
      gapsOf({ ...complete, backups: [{ name: "Band", lastRestore: null }] }),
    ).toEqual([{ kind: "restore", names: ["Band"] }]);
  });

  test("reporting not set up, but not an unanswered question", () => {
    expect(gapsOf({ ...complete, reporting: false })).toEqual([{ kind: "reporting" }]);
    expect(gapsOf({ ...complete, reporting: null })).toEqual([]);
  });

  test("management trained more than three years ago, or fewer trained than hold the role", () => {
    const old = [{ name: "Anna Beispiel", completedAt: new Date("2023-10-02") }];
    expect(gapsOf({ ...complete, managementTrainings: old })).toEqual([
      { kind: "training", trained: [], managers: 1 },
    ]);
    expect(gapsOf({ ...complete, managers: 2 })).toEqual([
      { kind: "training", trained: ["Anna Beispiel"], managers: 2 },
    ]);
    const exactlyThreeYears = [
      { name: "Anna Beispiel", completedAt: new Date("2023-10-03") },
    ];
    expect(gapsOf({ ...complete, managementTrainings: exactlyThreeYears })).toEqual([]);
  });

  test("steps set aside, which the approval does not sign", () => {
    expect(gapsOf({ ...complete, setAside: ["9.1"] })).toEqual([
      { kind: "set_aside", codes: ["9.1"] },
    ]);
  });
});

describe("withPlanSlot", () => {
  test("a step's plan shows once, under its first open point", () => {
    const lines = [
      { code: "11.1", text: "Ohne zweiten Faktor: DATEV" },
      { code: "4.4", text: "Noch keine Wiederherstellung" },
      { code: "11.1", text: "Noch zur Seite gelegt: Zweiter Faktor" },
    ];
    expect(withPlanSlot(lines).map((slot) => slot.showsPlan)).toEqual([
      true,
      true,
      false,
    ]);
  });
});
