/**
 * What management sees before it signs: each gap is a fact the company recorded, and a company
 * whose answers leave nothing open sees none.
 */
import { describe, expect, test } from "bun:test";
import { type GapFacts, gapsOf } from "./gaps";

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
