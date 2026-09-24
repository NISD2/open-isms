/**
 * Tests for splitting the journey into screens.
 *
 * The load-bearing properties are that the split never loses an item, that a register-backed
 * requirement costs rows x fields rather than one screen, and that no screen can stop the next one.
 *
 * There is deliberately nothing here about a status-fact interview. Two were built and deleted:
 * the proportionality engine moved 4 decisions of about 144, and the onboarding rebuild of it asked
 * 21 options to move 4 of 53 items.
 */

import { describe, expect, test } from "bun:test";
import { resumeAt } from "./policy";
import {
  type Answers,
  answerKey,
  buildTemplates,
  canWait,
  expand,
  fieldsOf,
  hasValue,
  type ItemSource,
  itemStates,
  NOTHING_ANSWERED,
  type Row,
  screenAfter,
  screenBefore,
  screenById,
  screenCount,
  screenState,
} from "./steps";

const f = (key: string): string => key;

const item = (over: Partial<ItemSource> = {}): ItemSource => ({
  code: "1.1",
  categoryCode: "GOV",
  position: 100,
  fields: [],
  moduleRef: null,
  rowFields: [],
  ...over,
});

const rows =
  (n: number) =>
  (module: string): readonly Row[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `${module}-${i + 1}`,
      label: `Row ${i + 1}`,
    }));

const answers = (
  values: Record<string, unknown> = {},
  waiting: Answers["waiting"] = {},
): Answers => ({ values, waiting });

// ---------------------------------------------------------------------------

describe("one item is one screen: reach, not count", () => {
  test("all of an item's fields land on the same screen", () => {
    // Simon on the BSI registration: "it's literally the number, the date of you registering, and
    // the evidence... It's really one item but with three inputs." They come off one letter.
    const templates = buildTemplates([
      item({ code: "12.2", fields: [f("muk"), f("date"), f("proof")] }),
    ]);
    expect(templates).toHaveLength(1);
    expect(fieldsOf({ ...templates[0], id: "x", row: null } as never)).toEqual([
      "muk",
      "date",
      "proof",
    ]);
  });

  test("the schema's own field order survives", () => {
    const templates = buildTemplates([item({ fields: [f("c"), f("a"), f("b")] })]);
    expect(templates[0]?.ask.kind === "fields" && templates[0].ask.fields).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  test("an item with one field is still one screen", () => {
    expect(buildTemplates([item({ fields: [f("only")] })])).toHaveLength(1);
  });
});

describe("building templates from the journey", () => {
  test("journey order decides, and it is the shared ordering function's output", () => {
    const templates = buildTemplates([
      item({ code: "9.9", position: 900, fields: [f("late")] }),
      item({ code: "1.1", position: 100, fields: [f("early")] }),
    ]);
    expect(templates.map((t) => t.item)).toEqual(["1.1", "9.9"]);
  });

  test("per-row fields win over intake fields, because that IS the work", () => {
    const templates = buildTemplates([
      item({ moduleRef: "supplier", fields: [f("x")], rowFields: [f("a"), f("b")] }),
    ]);
    expect(templates).toHaveLength(1);
    expect(templates[0]?.ask.kind).toBe("row");
  });

  test("an item with nothing at all still gets exactly one screen", () => {
    // Dropping it would hide an item from the Durchgang and the counts would stop matching.
    const templates = buildTemplates([item({ code: "2.1" })]);
    expect(templates).toHaveLength(1);
    expect(templates[0]?.ask.kind).toBe("register");
  });

  test("every item in gets at least one screen out", () => {
    const items = [
      item({ code: "1.1", position: 1, fields: [f("a")] }),
      item({ code: "1.2", position: 2 }),
      item({ code: "1.3", position: 3, moduleRef: "asset" }),
      item({ code: "1.4", position: 4, moduleRef: "supplier", rowFields: [f("r")] }),
    ];
    const seen = new Set(buildTemplates(items).map((t) => t.item));
    expect(seen).toEqual(new Set(items.map((i) => i.code)));
  });
});

describe("expanding against what the company actually has", () => {
  const templates = buildTemplates([
    item({
      code: "5.2",
      position: 1,
      moduleRef: "supplier",
      rowFields: [f("a"), f("b")],
    }),
  ]);

  test("no rows collapses to one register screen, which is the no-object case", () => {
    const screens = expand(templates, rows(0));
    expect(screens).toHaveLength(1);
    expect(screens[0]?.ask.kind).toBe("register");
  });

  test("one screen per row: this is why an item is variable length", () => {
    // Every field about one supplier sits on that supplier's screen, so the length tracks the
    // register and not the schema. Measured on the real journey: 49 screens with empty registers,
    // 79 with ten rows in each.
    expect(expand(templates, rows(1))).toHaveLength(1);
    expect(expand(templates, rows(10))).toHaveLength(10);
    expect(expand(templates, rows(40))).toHaveLength(40);
  });

  test("every row screen names its row, or the question cannot be answered", () => {
    for (const s of expand(templates, rows(3))) {
      expect(s.row).not.toBeNull();
      expect(s.row?.label).toBeTruthy();
    }
  });

  test("screen ids are unique across rows and fields", () => {
    const screens = expand(templates, rows(12));
    expect(new Set(screens.map((s) => s.id)).size).toBe(screens.length);
  });

  test("a non-row template is unaffected by how many rows exist", () => {
    const plain = buildTemplates([item({ fields: [f("a")] })]);
    expect(expand(plain, rows(0))).toHaveLength(1);
    expect(expand(plain, rows(40))).toHaveLength(1);
  });

  test("screenCount attributes the screens to their items", () => {
    const counts = screenCount(expand(templates, rows(10)));
    expect(counts.get("5.2")).toBe(10);
  });
});

describe("answers are keyed per screen, not per field", () => {
  const templates = buildTemplates([
    item({ code: "5.2", moduleRef: "supplier", rowFields: [f("auditFrequency")] }),
  ]);
  const screens = expand(templates, rows(2));

  test("the same field about two rows is two different answers", () => {
    const [first, second] = screens;
    if (!first || !second) throw new Error("expected two screens");
    expect(answerKey(first, "auditFrequency")).not.toBe(
      answerKey(second, "auditFrequency"),
    );
  });

  test("answering one row does not settle the other", () => {
    const [first, second] = screens;
    if (!first || !second) throw new Error("expected two screens");
    const required = new Set(["auditFrequency"]);
    const a = answers({ [answerKey(first, "auditFrequency")]: "jährlich" });
    expect(screenState(first, a, required)).toBe("settled");
    expect(screenState(second, a, required)).toBe("open");
  });
});

describe("hasValue: an empty string is not an answer", () => {
  test("blank, whitespace, null and undefined are unanswered", () => {
    for (const v of ["", "   ", null, undefined]) expect(hasValue(v)).toBe(false);
  });

  test("a real value is an answer, including ones that look falsy", () => {
    for (const v of ["x", 0, false, new Date()]) expect(hasValue(v)).toBe(true);
  });
});

describe("an optional field never holds the journey open", () => {
  const screens = expand(buildTemplates([item({ fields: [f("maybe")] })]), rows(0));

  test("a screen whose only field is optional is settled on arrival", () => {
    const screen = screens[0];
    if (!screen) throw new Error("expected a screen");
    expect(screenState(screen, NOTHING_ANSWERED, new Set())).toBe("settled");
    expect(screenState(screen, NOTHING_ANSWERED, new Set(["maybe"]))).toBe("open");
  });
});

describe("waiting never stops the flow", () => {
  const screens = expand(
    buildTemplates([
      item({ code: "12.1", position: 1, fields: [f("a")] }),
      item({ code: "12.2", position: 2, fields: [f("b")] }),
      item({ code: "1.1", position: 3, fields: [f("c")] }),
    ]),
    rows(0),
  );
  const required = new Set(["a", "b", "c"]);
  const idOf = (i: number) => screens[i]?.id ?? "";

  test("every screen can be left waiting", () => {
    expect(canWait()).toBe(true);
  });

  test("a wait on the first screen still leaves the next one reachable", () => {
    const a = answers({}, { [idOf(0)]: { reason: "Später klären" } });
    const first = screens[0];
    if (!first) throw new Error("expected a screen");
    expect(screenState(first, a, required)).toBe("blocked");
    expect(screenAfter(screens, first.id)?.id).toBe(idOf(1));
  });

  test("answering clears the wait, so a screen is never both", () => {
    const first = screens[0];
    if (!first) throw new Error("expected a screen");
    const waiting = { [first.id]: { reason: "später" } };
    expect(screenState(first, answers({}, waiting), required)).toBe("blocked");
    expect(
      screenState(first, answers({ [answerKey(first, "a")]: "ja" }, waiting), required),
    ).toBe("settled");
  });

  test("the next session resumes at the earliest OPEN screen, not the earliest waiting one", () => {
    // The BSI registration answers by post. Leaving it open must not stop what comes after.
    const a = answers({}, { [idOf(0)]: { reason: "Läuft gerade" } });
    expect(resumeAt(screens, (s) => screenState(s, a, required))?.id).toBe(idOf(1));
  });

  test("when everything left is waiting, it resumes there rather than nowhere", () => {
    const first = screens[0];
    const second = screens[1];
    const third = screens[2];
    if (!first || !second || !third) throw new Error("expected three screens");
    const a = answers(
      { [answerKey(second, "b")]: "x", [answerKey(third, "c")]: "y" },
      { [first.id]: { reason: "offen" } },
    );
    expect(resumeAt(screens, (s) => screenState(s, a, required))?.id).toBe(first.id);
  });

  test("nothing left to do resumes nowhere, which is how the journey ends", () => {
    const a = answers(
      Object.fromEntries(
        screens.map((s, i) => [answerKey(s, ["a", "b", "c"][i] ?? ""), "done"]),
      ),
    );
    expect(resumeAt(screens, (s) => screenState(s, a, required))).toBeNull();
  });
});

describe("navigation", () => {
  const screens = expand(
    buildTemplates([
      item({ code: "1.1", position: 1, fields: [f("a")] }),
      item({ code: "1.2", position: 2, fields: [f("b")] }),
    ]),
    rows(0),
  );

  test("back from the first screen is nothing, not a wrap-around", () => {
    expect(screenBefore(screens, screens[0]?.id ?? "")).toBeNull();
  });

  test("forward and back are inverses in the middle", () => {
    for (const s of screens.slice(1)) {
      const back = screenBefore(screens, s.id);
      expect(back).not.toBeNull();
      expect(back && screenAfter(screens, back.id)?.id).toBe(s.id);
    }
  });

  test("an unknown id is null rather than a crash, because it arrives from the URL", () => {
    expect(screenById(screens, "../../etc/passwd")).toBeNull();
    expect(screenById(screens, "")).toBeNull();
  });
});

describe("item state rolls up from its screens", () => {
  const screens = expand(
    buildTemplates([item({ code: "5.2", moduleRef: "supplier", rowFields: [f("a")] })]),
    rows(3),
  );
  const required = new Set(["a"]);

  test("open while any row is unanswered", () => {
    expect(itemStates(screens, NOTHING_ANSWERED, required).get("5.2")).toBe("open");
  });

  test("blocked only when every remaining row is waiting", () => {
    const waiting = Object.fromEntries(screens.map((s) => [s.id, { reason: "offen" }]));
    expect(itemStates(screens, answers({}, waiting), required).get("5.2")).toBe(
      "blocked",
    );
  });

  test("settled when every row is answered", () => {
    const values = Object.fromEntries(screens.map((s) => [answerKey(s, "a"), "x"]));
    expect(itemStates(screens, answers(values), required).get("5.2")).toBe("settled");
  });
});

describe("fieldsOf", () => {
  test("a register screen asks no fields", () => {
    const screens = expand(buildTemplates([item({ moduleRef: "asset" })]), rows(0));
    expect(fieldsOf(screens[0] ?? ({} as never))).toEqual([]);
  });
});
