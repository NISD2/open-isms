import { describe, expect, test } from "bun:test";
import type { AnyScreen } from "@/lib/durchgang/types";
import { type AssistantFill, assistantMarks, type FillRecord } from "./fills";

const screen = (s: Record<string, unknown>) => s as unknown as AnyScreen;

const SCREENS = [
  screen({ kind: "learn", id: "learn" }),
  screen({ kind: "fields", id: "who", fields: ["contactName", "contactEmail"] }),
  screen({ kind: "register", id: "list", module: "supplier" }),
  screen({ kind: "rate", id: "rate" }),
  screen({ kind: "evidence", id: "proof", field: "contractFile" }),
  screen({ kind: "done", id: "done" }),
];

const record = (parts: Partial<FillRecord>): FillRecord => ({
  code: "5.1",
  answers: [],
  screens: [],
  register: false,
  files: 0,
  ...parts,
});

const fill = (
  client: string,
  day: string,
  parts: Partial<FillRecord>,
): AssistantFill => ({
  client,
  at: new Date(`${day}T10:00:00Z`),
  record: record(parts),
});

describe("the screens an assistant wrote", () => {
  test("each screen is marked by the fill that wrote what it shows, and only those", () => {
    const marks = assistantMarks(SCREENS, [
      fill("Claude", "2026-10-16", { answers: ["contactEmail"], screens: ["rate"] }),
    ]);
    expect(marks.map((m) => m?.client ?? null)).toEqual([
      null,
      "Claude",
      null,
      "Claude",
      null,
      null,
    ]);
  });

  test("the newest fill that wrote a screen is the one shown", () => {
    const marks = assistantMarks(SCREENS, [
      fill("Copilot", "2026-10-16", { register: true }),
      fill("Claude", "2026-10-14", { register: true, files: 1 }),
    ]);
    expect(marks[2]).toEqual({ client: "Copilot", at: new Date("2026-10-16T10:00:00Z") });
    expect(marks[4]?.client).toBe("Claude");
  });

  test("an evidence screen counts its field's answer as well as an attached file", () => {
    const marks = assistantMarks(SCREENS, [
      fill("Claude", "2026-10-16", { answers: ["contractFile"] }),
    ]);
    expect(marks[4]?.client).toBe("Claude");
  });

  test("of an item's screens of one kind, only the one the fill saved is marked", () => {
    const ratings = [
      screen({ kind: "rate", id: "software", targets: "software" }),
      screen({ kind: "rate", id: "technology", targets: "technology" }),
      screen({ kind: "rate", id: "suppliers", targets: "suppliers" }),
    ];
    const marks = assistantMarks(ratings, [
      fill("Claude", "2026-10-16", { screens: ["suppliers"] }),
    ]);
    expect(marks.map((m) => m?.client ?? null)).toEqual([null, null, "Claude"]);
  });

  test("no fills, no marks", () => {
    expect(assistantMarks(SCREENS, []).every((m) => m === null)).toBe(true);
  });
});
