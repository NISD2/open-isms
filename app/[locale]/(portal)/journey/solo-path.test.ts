/**
 * The rail beside the guided path has one stop per window. Since the journey
 * runs prerequisites first (#189) a window recurs along the path, and the rail
 * listed it once per run: the same window three times, duplicate React keys,
 * and every copy lit as the current one.
 */
import { describe, expect, test } from "bun:test";
import type { Band, FlowNode, NodeStatus } from "./path-nodes";
import { buildSoloSections, buildStageProgress } from "./solo-path";

const node = (
  code: string,
  band: Band,
  categoryCode: string,
  status: NodeStatus,
): FlowNode => ({
  id: code,
  code,
  label: code,
  categorySlug: categoryCode.toLowerCase(),
  categoryCode,
  band,
  column: "leadership",
  ownerRole: "ciso",
  status,
  rawStatus: status === "done" ? "signed" : "todo",
  state: status === "done" ? "signed" : "todo",
  isOverdue: false,
  dueInDays: null,
  priority: null,
  description: null,
  legalRef: null,
  frequency: null,
  sortOrder: 0,
  signOff: { signed: 0, total: 0 },
});

// Prerequisites first: the windows alternate along the path.
const path = [
  node("1.1", "minimum", "REG", "done"),
  node("1.2", "year", "REG", "upcoming"),
  node("2.1", "minimum", "GOV", "current"),
  node("2.2", "year", "GOV", "upcoming"),
  node("3.1", "minimum", "RISK", "upcoming"),
  node("3.2", "later", "RISK", "upcoming"),
];

describe("buildSoloSections", () => {
  test("gives a category that runs twice in one window two distinct keys", () => {
    const twice = [
      node("2.1", "year", "GOV", "upcoming"),
      node("3.1", "year", "RISK", "upcoming"),
      node("2.2", "year", "GOV", "upcoming"),
    ];
    const keys = buildSoloSections(twice, false).map((s) => s.key);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
  });

  test("still merges neighbouring steps of the same window and category", () => {
    const sections = buildSoloSections(
      [node("2.1", "year", "GOV", "upcoming"), node("2.2", "year", "GOV", "upcoming")],
      false,
    );
    expect(sections).toHaveLength(1);
    expect(sections[0]?.steps).toHaveLength(2);
  });
});

describe("buildStageProgress", () => {
  test("lists each window once, in window order, however often the path returns to it", () => {
    const stages = buildStageProgress(buildSoloSections(path, false));
    expect(stages.map((s) => s.band)).toEqual(["minimum", "year", "later"]);
    expect(new Set(stages.map((s) => s.index)).size).toBe(stages.length);
  });

  test("adds a window's steps up across every run of it", () => {
    const [firstMonth] = buildStageProgress(buildSoloSections(path, false));
    expect(firstMonth).toMatchObject({ total: 3, done: 1, open: 2 });
  });
});
