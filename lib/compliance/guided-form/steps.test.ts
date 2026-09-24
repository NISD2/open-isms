/**
 * Tests for the opening steps.
 *
 * Three kinds. Everything the sidebar claims resolves against the vendored statute, which is the
 * rule that nothing the product says originates with us. Every field a step names exists in the
 * schema that owns it, so a screen cannot collect a field the category does not have. And the
 * waiting behaviour is enumerated, because the load-bearing property is that no step stops the
 * next one.
 *
 * There is deliberately nothing here about a status-fact interview or a reduction count. Both were
 * deleted on 25.09.2026: twenty-one options to move four of fifty-three items is the proportionality
 * engine's failure ratio, and it was retired for exactly that.
 */

import { describe, expect, test } from "bun:test";
import statuteJson from "@/data/law/bsig-2025.json";
import { REG_SCHEMA } from "@/lib/compliance/category-schemas";
import { resumeAt } from "./policy";
import {
  type Answers,
  canWait,
  hasValue,
  NOTHING_ANSWERED,
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

const SCHEMA_KEYS = new Set(Object.keys(REG_SCHEMA.shape));
const REQUIRED = new Set(
  Object.entries(REG_SCHEMA.shape)
    .filter(([, v]) => !v.safeParse(undefined).success)
    .map(([k]) => k),
);

const answers = (
  values: Record<string, unknown> = {},
  waiting: Answers["waiting"] = {},
): Answers => ({ values, waiting });

// ---------------------------------------------------------------------------

describe("the sidebar quotes the statute and nothing else", () => {
  for (const step of STEPS) {
    if (!step.sidebar) continue;
    test(`${step.id}`, () => {
      for (const p of step.sidebar.paragraphs) expect(norms[p] ?? "").not.toBe("");
      const corpus = step.sidebar.paragraphs.map((p) => norms[p] ?? "").join("\n");
      for (const phrase of step.sidebar.phrases) expect(corpus).toContain(phrase);
    });
  }

  test("a sidebar claiming a paragraph the statute does not carry would fail", () => {
    // The mutant. Without it the loop above could pass by never looking anything up.
    expect(norms["§ 99"] ?? "").toBe("");
  });
});

describe("the thresholds shown on the classification screen are § 28's own", () => {
  // These numbers reach a buyer on the second screen they ever see. They are compressions of the
  // statute, and the error in a compression lives in what was cut, so each one is resolved here.
  const abs1 = norms["§ 28"]?.slice(0, norms["§ 28"].indexOf("(2)")) ?? "";
  const abs2 = norms["§ 28"]?.slice(norms["§ 28"].indexOf("(2)")) ?? "";

  test("besonders wichtig: 250 employees, or over 50 million turnover and over 43 million balance", () => {
    expect(abs1).toContain("mindestens 250 Mitarbeiter");
    expect(abs1).toContain("über 50 Millionen Euro");
    expect(abs1).toContain("über 43 Millionen Euro");
    expect(abs1).toContain("in Anlage 1 bestimmten Einrichtungsarten");
  });

  test("wichtig: 50 employees, or both over 10 million, and it names BOTH Anlagen", () => {
    expect(abs2).toContain("mindestens 50 Mitarbeiter");
    expect(abs2).toContain("jeweils über 10 Millionen Euro");
    // The easy compression error: Absatz 1 says Anlage 1, Absatz 2 says Anlagen 1 und 2.
    expect(abs2).toContain("in den Anlagen 1 und 2 bestimmten Einrichtungsarten");
  });
});

describe("every field a screen collects exists in the schema that owns it", () => {
  for (const step of STEPS) {
    if (step.fields.length === 0) continue;
    test(`${step.id}`, () => {
      for (const f of step.fields) expect(SCHEMA_KEYS.has(f)).toBe(true);
    });
  }

  test("no field is collected twice across screens", () => {
    const all = STEPS.flatMap((s) => s.fields);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("the order is the journey's own", () => {
  test("opens on something that asks for nothing", () => {
    expect(STEPS[0]?.kind).toBe("provision");
  });

  test("classification comes before registration, because the BSI form asks for it", () => {
    const ids = STEPS.map((s) => s.id);
    expect(ids.indexOf("classification")).toBeLessThan(ids.indexOf("registration"));
  });

  test("item 12.1 is finished before item 12.2 begins", () => {
    const items = STEPS.filter((s) => s.kind === "question").map((s) => s.item);
    expect(items).toEqual([...items].sort());
  });

  test("every step says why it is where it is", () => {
    for (const s of STEPS) expect(s.why.length).toBeGreaterThan(40);
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

describe("hasValue: an empty string is not an answer", () => {
  test("blank, whitespace, null and undefined are all unanswered", () => {
    for (const v of ["", "   ", null, undefined]) expect(hasValue(v)).toBe(false);
  });

  test("a real value is an answer, including ones that look falsy", () => {
    for (const v of ["important", 0, false, new Date()]) expect(hasValue(v)).toBe(true);
  });
});

describe("waiting never stops the flow", () => {
  test("the provision screen asks nothing, so it can never wait and is always settled", () => {
    const welcome = stepById("welcome");
    if (!welcome) throw new Error("welcome missing");
    expect(canWait(welcome)).toBe(false);
    expect(stepState(welcome, NOTHING_ANSWERED, REQUIRED)).toBe("settled");
  });

  test("every question screen can be left waiting", () => {
    for (const s of STEPS.filter((x) => x.kind === "question"))
      expect(canWait(s)).toBe(true);
  });

  test("a wait on the classification still leaves the next screen reachable", () => {
    const a = answers({}, { classification: { reason: "Weiß ich nicht" } });
    const step = stepById("classification");
    expect(step && stepState(step, a, REQUIRED)).toBe("blocked");
    expect(stepAfter("classification")?.id).toBe("sectors");
  });

  test("answering clears the wait, so a step is never both", () => {
    const waiting = { classification: { reason: "später" } } as const;
    const step = stepById("classification");
    if (!step) throw new Error("classification missing");
    expect(stepState(step, answers({}, waiting), REQUIRED)).toBe("blocked");
    expect(
      stepState(step, answers({ entityClassification: "important" }, waiting), REQUIRED),
    ).toBe("settled");
  });

  test("the next session resumes at the earliest open step, not the earliest waiting one", () => {
    const a = answers({}, { classification: { reason: "intern zu klären" } });
    expect(resumeAt(STEPS, (s) => stepState(s, a, REQUIRED))?.id).toBe("sectors");
  });

  test("when everything left is waiting, it resumes there rather than nowhere", () => {
    const a = answers(
      {
        applicableSectors: "Gesundheitswesen",
        mukAccountId: "MUK-1",
        bsiRegistrationDate: new Date(),
      },
      { classification: { reason: "intern zu klären" } },
    );
    expect(resumeAt(STEPS, (s) => stepState(s, a, REQUIRED))?.id).toBe("classification");
  });

  test("the BSI registration, which answers by post, does not block anything after it", () => {
    // The worked example from mvnis2.md §4.11: a step that waits on the outside world must not
    // stop the Durchgang on day one.
    const a = answers(
      { entityClassification: "important", applicableSectors: "Gesundheitswesen" },
      { registration: { reason: "Läuft gerade" } },
    );
    const reg = stepById("registration");
    expect(reg && stepState(reg, a, REQUIRED)).toBe("blocked");
    expect(resumeAt(STEPS, (s) => stepState(s, a, REQUIRED))?.id).toBe("registration");
  });

  test("nothing left to do resumes nowhere, which is how the flow ends", () => {
    const a = answers({
      entityClassification: "important",
      applicableSectors: "Gesundheitswesen",
      mukAccountId: "MUK-1",
      bsiRegistrationDate: new Date("2026-03-01"),
    });
    expect(resumeAt(STEPS, (s) => stepState(s, a, REQUIRED))).toBeNull();
  });
});

describe("an optional field never holds a step open", () => {
  test("the registration proof is optional, so the step settles without it", () => {
    expect(REQUIRED.has("registrationProofUploaded")).toBe(false);
    const reg = stepById("registration");
    if (!reg) throw new Error("registration missing");
    expect(reg.fields).toContain("registrationProofUploaded");
    const a = answers({ mukAccountId: "MUK-1", bsiRegistrationDate: new Date() });
    expect(stepState(reg, a, REQUIRED)).toBe("settled");
  });
});
