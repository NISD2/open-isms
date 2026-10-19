import { describe, expect, test } from "bun:test";
import { type ItemState, SETUP_AFTER, walkOf } from "@/lib/durchgang";
import { walkProgress } from "./walk-progress";

const walk = walkOf({ entityType: "important", criticalInstallation: "unsettled" });
const [first, second] = walk;
const filled: ItemState = { kind: "filled", since: new Date("2026-10-01T08:00:00Z") };
const waiting: ItemState = {
  kind: "waiting",
  reason: "ask",
  since: new Date("2026-10-01T08:00:00Z"),
};

describe("walkProgress", () => {
  test("a locked walk shows every step open and names the first", () => {
    const progress = walkProgress({ walk, states: null, setUp: true });
    expect(progress.total).toBe(walk.length);
    expect(progress.done).toBe(0);
    expect(progress.next).toEqual({ kind: "item", item: first });
  });

  test("a company not set up yet walks setting itself up, right after the registration", () => {
    const progress = walkProgress({
      walk,
      states: new Map([[SETUP_AFTER, filled]]),
      setUp: false,
    });
    expect(walk[0]?.code).toBe(SETUP_AFTER);
    expect(progress.total).toBe(walk.length + 1);
    expect(progress.done).toBe(1);
    expect(progress.next).toEqual({ kind: "setup" });
  });

  test("filled counts as done, and Continue skips it", () => {
    if (!first || !second) throw new Error("walk too short");
    const progress = walkProgress({
      walk,
      states: new Map([[first.code, filled]]),
      setUp: true,
    });
    expect(progress.done).toBe(1);
    expect(progress.next).toEqual({ kind: "item", item: second });
  });

  test("an open step comes before a waiting one; with only waiting ones left, the first of them", () => {
    if (!first || !second) throw new Error("walk too short");
    const allButTwo = new Map(walk.slice(2).map((item) => [item.code, filled] as const));
    const progress = walkProgress({
      walk,
      states: new Map([...allButTwo, [first.code, waiting]]),
      setUp: true,
    });
    expect(progress.next).toEqual({ kind: "item", item: second });

    const onlyWaiting = walkProgress({
      walk,
      states: new Map([...allButTwo, [first.code, waiting], [second.code, filled]]),
      setUp: true,
    });
    expect(onlyWaiting.next).toEqual({ kind: "item", item: first });
  });

  test("everything finished leaves nothing to name", () => {
    const progress = walkProgress({
      walk,
      states: new Map(walk.map((item) => [item.code, filled] as const)),
      setUp: true,
    });
    expect(progress.done).toBe(walk.length);
    expect(progress.next).toBeNull();
  });
});
