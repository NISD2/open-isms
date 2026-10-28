import { describe, expect, test } from "bun:test";
import { OUTAGE_SPANS, type OutageSpan } from "@nisd2/grc-data-model/enums";
import {
  type ContinuityFacts,
  type ContinuitySystem,
  compare,
  gaps,
  requiredOutage,
  spanRank,
} from "./continuity";

const process = (id: string, maxOutage: OutageSpan | null) => ({
  id,
  name: id,
  maxOutage,
});

const system = (
  id: string,
  restoreTime: OutageSpan | null,
  restoreTimeUnknown = false,
): ContinuitySystem => ({ id, name: id, restoreTime, restoreTimeUnknown });

const link = (processId: string, assetId: string) => ({ processId, assetId });

const facts = (partial: Partial<ContinuityFacts>): ContinuityFacts => ({
  processes: [],
  systems: [],
  links: [],
  ...partial,
});

describe("the one scale", () => {
  test("ranks shortest first, longer last", () => {
    expect(OUTAGE_SPANS.map(spanRank)).toEqual([0, 1, 2, 3, 4]);
    expect(spanRank("hours")).toBeLessThan(spanRank("longer"));
  });
});

describe("how long a system may be down", () => {
  test("is the shortest tolerance of the processes that need it", () => {
    const f = facts({
      processes: [process("billing", "week"), process("dispatch", "hours")],
      links: [link("billing", "erp"), link("dispatch", "erp")],
    });
    expect(requiredOutage(f, "erp")).toBe("hours");
  });

  test("ignores a process that has no tolerance yet, and is null when none has one", () => {
    const f = facts({
      processes: [process("billing", null), process("dispatch", "day")],
      links: [link("billing", "erp"), link("dispatch", "erp"), link("billing", "mail")],
    });
    expect(requiredOutage(f, "erp")).toBe("day");
    expect(requiredOutage(f, "mail")).toBeNull();
  });

  test("is null for a system nothing needs", () => {
    expect(requiredOutage(facts({ systems: [system("erp", "day")] }), "erp")).toBeNull();
  });
});

describe("the comparison management sees before it signs", () => {
  const f = facts({
    processes: [
      process("dispatch", "hours"),
      process("billing", "week"),
      process("archive", null),
    ],
    systems: [
      system("erp", "day"), // dispatch needs it within hours: too slow
      system("mail", "day"), // billing can wait a week: fine
      system("files", null, true), // billing needs it, nobody knows the restore time
      system("crm", null), // billing needs it, not asked yet
      system("scanner", "longer"), // archive needs it, archive has no tolerance yet
      system("printer", "hours"), // nothing needs it
    ],
    links: [
      link("dispatch", "erp"),
      link("billing", "erp"),
      link("billing", "mail"),
      link("billing", "files"),
      link("billing", "crm"),
      link("archive", "scanner"),
    ],
  });

  test("gives every system one verdict, in the order of the list", () => {
    expect(compare(f).map((s) => [s.system.id, s.verdict.kind])).toEqual([
      ["erp", "too_slow"],
      ["mail", "ok"],
      ["files", "unknown"],
      ["crm", "not_asked"],
      ["scanner", "unrated"],
      ["printer", "not_needed"],
    ]);
  });

  test("names the processes behind a verdict and the time they need", () => {
    const [erp] = compare(f);
    expect(erp?.verdict).toEqual({
      kind: "too_slow",
      required: "hours",
      restore: "day",
      needs: ["dispatch", "billing"],
    });
  });

  test("lists only what is too slow or unknown as a gap", () => {
    expect(gaps(f).map((s) => s.system.id)).toEqual(["erp", "files"]);
  });

  test("a restore as slow as the tolerance is in time, longer against longer included", () => {
    const g = facts({
      processes: [process("p", "longer"), process("q", "day")],
      systems: [system("a", "longer"), system("b", "day")],
      links: [link("p", "a"), link("q", "b")],
    });
    expect(compare(g).map((s) => s.verdict.kind)).toEqual(["ok", "ok"]);
  });

  test("a link to a process not on the list counts for nothing", () => {
    const g = facts({
      systems: [system("a", "day")],
      links: [link("gone", "a")],
    });
    expect(compare(g)[0]?.verdict).toEqual({ kind: "not_needed" });
  });
});
