/**
 * Tests for the opening steps.
 *
 * Two kinds. The first resolves everything the sidebar claims against the vendored statute, which
 * is the rule that nothing the product says originates with us. The second enumerates the small
 * state space of three facts and checks the properties the flow depends on, the load-bearing one
 * being that no step can ever stop the next one.
 */

import { describe, expect, test } from "bun:test";
import statuteJson from "@/data/law/bsig-2025.json";
import { resumeAt, type Settled, type StatusFacts } from "./policy";
import {
  type Answers,
  canWait,
  isWaiting,
  NOTHING_ANSWERED,
  reduction,
  SECTORS_35_2,
  STEPS,
  type Step,
  type StepId,
  stepAfter,
  stepBefore,
  stepById,
  stepState,
} from "./steps";

const norms = ((): Readonly<Record<string, string>> => {
  const raw: unknown = statuteJson;
  if (typeof raw !== "object" || raw === null)
    throw new Error("bsig-2025.json: not an object");
  const n = (raw as Record<string, unknown>).norms;
  if (typeof n !== "object" || n === null)
    throw new Error("bsig-2025.json: norms missing");
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
})();

const SETTLED: readonly Settled[] = ["yes", "no", "unsettled"];

const answers = (
  over: Partial<StatusFacts> = {},
  waiting: Answers["waiting"] = {},
): Answers => ({
  facts: { ...NOTHING_ANSWERED.facts, ...over },
  waiting,
});

// ---------------------------------------------------------------------------

describe("the sidebar quotes the statute and nothing else", () => {
  for (const step of STEPS) {
    if (!step.sidebar) continue;
    test(`${step.id}`, () => {
      for (const p of step.sidebar.paragraphs) {
        expect(norms[p] ?? "").not.toBe("");
      }
      const corpus = step.sidebar.paragraphs.map((p) => norms[p] ?? "").join("\n");
      for (const phrase of step.sidebar.phrases) {
        expect(corpus).toContain(phrase);
      }
    });
  }

  test("the five sectors are § 35 Abs. 2's own words, in its own order", () => {
    const abs2 = norms["§ 35"]?.slice(norms["§ 35"].indexOf("(2)")) ?? "";
    expect(abs2).not.toBe("");
    let cursor = 0;
    for (const sector of SECTORS_35_2) {
      const at = abs2.indexOf(sector, cursor);
      expect(at).toBeGreaterThan(-1);
      cursor = at;
    }
  });

  test("a sidebar that claims a paragraph the statute does not carry fails", () => {
    // The mutant. Without this the test above could pass by never looking anything up.
    expect(norms["§ 99"] ?? "").toBe("");
  });
});

describe("the order is the design, so it is asserted rather than assumed", () => {
  test("opens on something that asks for nothing", () => {
    expect(STEPS[0]?.kind).toBe("provision");
  });

  test("the three facts are asked one per screen, and each settles a different one", () => {
    const facts = STEPS.filter((s) => s.kind === "fact");
    expect(facts).toHaveLength(3);
    expect(new Set(facts.map((s) => s.settles)).size).toBe(3);
  });

  test("the threshold question is the last of the three", () => {
    // It is the only one that sends someone away to look something up, so it is the only one
    // likely to be left waiting. Putting it earlier puts the first wait in front of the aha.
    const facts = STEPS.filter((s) => s.kind === "fact").map((s) => s.id);
    expect(facts[facts.length - 1]).toBe("critical_installation");
  });

  test("the answers are shown back straight after the last one is given", () => {
    expect(stepAfter("critical_installation")?.kind).toBe("reflection");
  });

  test("every step says why it is where it is", () => {
    for (const s of STEPS) expect(s.why.length).toBeGreaterThan(40);
  });

  test("these screens all serve journey item 12.1, which is what splitting it means", () => {
    expect(new Set(STEPS.map((s) => s.item))).toEqual(new Set(["12.1"]));
  });
});

describe("navigation", () => {
  test("walks forward through every step and stops", () => {
    const walked: StepId[] = [];
    let at: Step | null = STEPS[0] ?? null;
    while (at) {
      walked.push(at.id);
      at = stepAfter(at.id);
    }
    expect(walked).toEqual(STEPS.map((s) => s.id));
  });

  test("back from the first step is nothing, not a wrap-around", () => {
    expect(stepBefore("welcome")).toBeNull();
  });

  test("forward and back are inverses in the middle", () => {
    for (const s of STEPS.slice(1)) {
      const back = stepBefore(s.id);
      expect(back).not.toBeNull();
      expect(back && stepAfter(back.id)?.id).toBe(s.id);
    }
  });

  test("an unknown id is null rather than a crash, because it arrives from the URL", () => {
    expect(stepById("../../etc/passwd")).toBeNull();
    expect(stepById("")).toBeNull();
  });
});

describe("a step that asks nothing is settled and can never wait", () => {
  for (const s of STEPS.filter((x) => x.kind !== "fact")) {
    test(`${s.id}`, () => {
      expect(canWait(s)).toBe(false);
      expect(stepState(s, NOTHING_ANSWERED)).toBe("settled");
    });
  }
});

describe("waiting never stops the flow", () => {
  test("every fact step can be left waiting", () => {
    for (const s of STEPS.filter((x) => x.kind === "fact")) expect(canWait(s)).toBe(true);
  });

  test("a wait on the first question still leaves the next one reachable", () => {
    const a = answers({}, { sector: { reason: "Muss ich intern klären" } });
    const sector = stepById("sector");
    expect(sector && stepState(sector, a)).toBe("blocked");
    // The point: blocked is not a stop. The step after it is still a step.
    expect(stepAfter("sector")?.id).toBe("service_types");
  });

  test("answering clears the wait, so a step is never both", () => {
    const waiting = { sector: { reason: "später" } } as const;
    const sector = stepById("sector");
    if (!sector) throw new Error("sector step missing");
    expect(isWaiting(sector, answers({}, waiting))).toBe(true);
    expect(isWaiting(sector, answers({ sector35_2: "no" }, waiting))).toBe(false);
    expect(stepState(sector, answers({ sector35_2: "no" }, waiting))).toBe("settled");
  });

  test("the next session resumes at the earliest open step, not the earliest waiting one", () => {
    // Someone who left question one waiting and answered nothing else comes back to question two,
    // because there is still work that is not waiting on anybody.
    const a = answers({}, { sector: { reason: "intern zu klären" } });
    expect(resumeAt(STEPS, (s) => stepState(s, a))?.id).toBe("service_types");
  });

  test("when everything left is waiting, it resumes there rather than nowhere", () => {
    const a = answers(
      { serviceTypes: [], criticalInstallation: "no" },
      { sector: { reason: "intern zu klären" } },
    );
    expect(resumeAt(STEPS, (s) => stepState(s, a))?.id).toBe("sector");
  });

  test("nothing left to do resumes nowhere, which is how the flow ends", () => {
    const a = answers({ sector35_2: "no", serviceTypes: [], criticalInstallation: "no" });
    expect(resumeAt(STEPS, (s) => stepState(s, a))).toBeNull();
  });
});

describe("none of these is an answer; nobody said is not", () => {
  test("an empty service list settles the step, an unsettled one does not", () => {
    const step = stepById("service_types");
    if (!step) throw new Error("service_types step missing");
    expect(stepState(step, answers({ serviceTypes: [] }))).toBe("settled");
    expect(stepState(step, answers({ serviceTypes: "unsettled" }))).toBe("open");
  });

  test("the same distinction holds for the two yes-or-no facts", () => {
    for (const [id, key] of [
      ["sector", "sector35_2"],
      ["critical_installation", "criticalInstallation"],
    ] as const) {
      const step = stepById(id);
      if (!step) throw new Error(`${id} step missing`);
      for (const v of SETTLED) {
        expect(stepState(step, answers({ [key]: v }))).toBe(
          v === "unsettled" ? "open" : "settled",
        );
      }
    }
  });
});

describe("the number shown back", () => {
  const register = [
    { addressee: "all" as const },
    { addressee: "all" as const },
    { addressee: "critical_installation" as const },
    { addressee: "service_type_60_1" as const },
    { addressee: "sector_35_2" as const },
  ];

  test("with nothing answered, only the universal items are certain", () => {
    const r = reduction(register, NOTHING_ANSWERED.facts);
    expect(r.addressed).toBe(2);
    expect(r.unsettled).toBe(3);
    expect(r.removed).toEqual([]);
    expect(r.total).toBe(5);
  });

  test("every answer of no removes items, and the reason is carried with the count", () => {
    const r = reduction(register, {
      criticalInstallation: "no",
      serviceTypes: [],
      sector35_2: "no",
    });
    expect(r.addressed).toBe(2);
    expect(r.unsettled).toBe(0);
    expect(r.removed).toEqual([
      { addressee: "critical_installation", count: 1 },
      { addressee: "service_type_60_1", count: 1 },
      { addressee: "sector_35_2", count: 1 },
    ]);
  });

  test("answering yes adds work, which the screen must be willing to say", () => {
    const r = reduction(register, {
      criticalInstallation: "yes",
      serviceTypes: ["dns"],
      sector35_2: "yes",
    });
    expect(r.addressed).toBe(5);
    expect(r.removed).toEqual([]);
  });

  test("the three buckets always account for every item, whatever is answered", () => {
    for (const ci of SETTLED) {
      for (const s of SETTLED) {
        for (const st of [[], ["dns"], "unsettled"] as const) {
          const r = reduction(register, {
            criticalInstallation: ci,
            sector35_2: s,
            serviceTypes: st,
          });
          const removed = r.removed.reduce((n, x) => n + x.count, 0);
          expect(r.addressed + removed + r.unsettled).toBe(r.total);
        }
      }
    }
  });

  test("mutant: a reduction that counted an unsettled item as removed would fail the above", () => {
    const r = reduction([{ addressee: "critical_installation" }], NOTHING_ANSWERED.facts);
    expect(r.removed).toEqual([]);
    expect(r.unsettled).toBe(1);
  });
});
