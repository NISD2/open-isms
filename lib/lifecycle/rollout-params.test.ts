/**
 * These parameters are the difference between "show me who would get this"
 * and "mail a hundred real prospects, irreversibly". Every case here is a
 * plausible thing to type at 8am; each one must either do what it says or be
 * refused outright, never silently fall through to the full run.
 */
import { describe, expect, test } from "bun:test";
import { parseRolloutParams } from "./rollout-params";

function parse(qs: string) {
  return parseRolloutParams(new URLSearchParams(qs));
}

describe("no parameters means the ordinary scheduled run", () => {
  test("empty query string", () => {
    expect(parse("")).toEqual({ ok: true, dryRun: false, maxPerType: undefined });
  });
});

describe("dryRun asks for the canary", () => {
  for (const qs of [
    "dryRun=1",
    "dryRun=true",
    "dryRun=TRUE",
    "dryRun=True",
    "dryRun=yes",
    "dryRun=on",
    "dryRun", // bare flag, the CLI habit
    "dryRun=",
    "dryRun=%201%20", // whitespace from a copied command
  ]) {
    test(`?${qs}`, () => {
      expect(parse(qs)).toMatchObject({ ok: true, dryRun: true });
    });
  }

  for (const qs of ["dryRun=0", "dryRun=false", "dryRun=no", "dryRun=off"]) {
    test(`?${qs} explicitly declines it`, () => {
      expect(parse(qs)).toMatchObject({ ok: true, dryRun: false });
    });
  }
});

describe("anything unrecognised is refused, never treated as a real run", () => {
  // The whole point: each of these used to mean "send to 100 people".
  for (const qs of [
    "dryrun=1", // one lowercase letter away from the canary
    "DryRun=1",
    "dry_run=1",
    "dry-run=1",
    "limt=1",
    "dryRun=1&extra=whatever",
  ]) {
    test(`?${qs} is rejected as an unknown parameter`, () => {
      const result = parse(qs);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("unreachable");
      expect(result.error).toContain("Unknown parameter");
    });
  }

  for (const qs of ["dryRun=maybe", "dryRun=2", "dryRun=null"]) {
    test(`?${qs} is rejected as an unrecognised value`, () => {
      const result = parse(qs);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("unreachable");
      expect(result.error).toContain("dryRun");
    });
  }
});

describe("limit caps the run, and refuses anything that is not a cap", () => {
  test("?limit=1 is the first real send", () => {
    expect(parse("limit=1")).toEqual({ ok: true, dryRun: false, maxPerType: 1 });
  });

  test("?limit=25 ramps", () => {
    expect(parse("limit=25")).toMatchObject({ maxPerType: 25 });
  });

  test("whitespace around a pasted number survives", () => {
    expect(parse("limit=%205%20")).toMatchObject({ maxPerType: 5 });
  });

  test("dryRun and limit compose", () => {
    expect(parse("dryRun=1&limit=3")).toEqual({
      ok: true,
      dryRun: true,
      maxPerType: 3,
    });
  });

  // Each of these previously became `undefined`, i.e. the full 100-send cap.
  for (const qs of [
    "limit=0",
    "limit=-1",
    "limit=abc",
    "limit=one",
    "limit=",
    "limit=1.5",
    "limit=1e3",
    "limit=NaN",
    "limit=Infinity",
  ]) {
    test(`?${qs} is refused rather than escalating to the full cap`, () => {
      const result = parse(qs);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("unreachable");
      expect(result.error).toContain("limit");
    });
  }
});
