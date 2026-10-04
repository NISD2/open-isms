import { describe, expect, test } from "bun:test";
import type { ScreenKind } from "./index";
import { opensBeforeSetup, SETUP_AFTER, WALK, withSetup } from "./index";

/**
 * Screens whose saves need no set-up company: reading, and answers stored on the requirement
 * (`intake.saveRequirementAnswers` and the walk's state changes run on `companyProcedure`).
 * Every register write runs on `durchgangWrite`, which refuses a company not set up yet.
 */
const DRAFT_SAFE: ReadonlySet<ScreenKind> = new Set([
  "learn",
  "prepare",
  "compare",
  "sample",
  "reading",
  "provision",
  "fields",
  "done",
]);

describe("setting up the company after the registration", () => {
  test("the registration is in the walk", () => {
    expect(WALK.some((item) => item.code === SETUP_AFTER)).toBe(true);
  });

  test("what a company not set up yet may open saves nothing into a register", () => {
    const unsafe = WALK.filter((item) => opensBeforeSetup(item.code)).flatMap((item) =>
      item.screens
        .filter((screen) => !DRAFT_SAFE.has(screen.kind))
        .map((screen) => `${item.code} ${screen.kind}`),
    );
    expect(unsafe).toEqual([]);
  });

  test("only the walk up to the registration opens before setting up", () => {
    const at = WALK.findIndex((item) => item.code === SETUP_AFTER);
    expect(WALK.map((item) => opensBeforeSetup(item.code))).toEqual(
      WALK.map((_, i) => i <= at),
    );
    expect(opensBeforeSetup("unknown")).toBe(false);
  });

  test("the setup step sits right after the registration", () => {
    const walk = WALK.map((item) => ({ code: item.code }));
    const steps = withSetup(walk, { code: "setup" }).map((entry) => entry.code);
    expect(steps[steps.indexOf(SETUP_AFTER) + 1]).toBe("setup");
    expect(steps.filter((code) => code !== "setup")).toEqual(walk.map((e) => e.code));
  });

  test("a walk without the registration starts with setting up", () => {
    expect(withSetup([{ code: "1.1" }], { code: "setup" })).toEqual([
      { code: "setup" },
      { code: "1.1" },
    ]);
  });
});
