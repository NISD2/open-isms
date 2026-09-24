/**
 * The guided form's policy, enumerated over its whole input space, plus mutants.
 *
 * Two things are checked that a normal unit test would not:
 *
 *   - every rule's statutory anchor is resolved against the VENDORED text of the BSIG, so a claim
 *     about what the law says fails here rather than in a signed document
 *   - each function is tested against the property it must satisfy, and then broken deliberately,
 *     so a check that has never failed cannot be mistaken for a check that works
 */
import { describe, expect, test } from "bun:test";
import statuteJson from "@/data/law/bsig-2025.json";
import {
  type Addressee,
  allowedOutcomes,
  applies,
  bindingReference,
  type ControlGrade,
  type ControlState,
  FACTORS,
  itemState,
  justificationComplete,
  noObjectStale,
  RULES,
  resumeAt,
  SERVICE_TYPES,
  type ServiceType,
  type Settled,
  type StatusFacts,
} from "./policy";

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

/** The text of one Absatz: from "(n)" up to "(n+1)" or the end. */
const absatz = (norm: string, n: number): string => {
  const start = norm.indexOf(`(${n})`);
  if (start < 0) return "";
  const end = norm.indexOf(`(${n + 1})`, start + 1);
  return end < 0 ? norm.slice(start) : norm.slice(start, end);
};

const GRADES: readonly ControlGrade[] = ["required", "expected", "optional"];
const SETTLED: readonly Settled[] = ["yes", "no", "unsettled"];
const ADDRESSEES: readonly Addressee[] = [
  "all",
  "critical_installation",
  "service_type_60_1",
  "sector_35_2",
];

const facts = (over: Partial<StatusFacts> = {}): StatusFacts => ({
  criticalInstallation: "no",
  serviceTypes: [],
  sector35_2: "no",
  ...over,
});

const c = (
  grade: ControlGrade,
  current: ControlState["current"],
  stale = false,
): ControlState => ({ grade, current, stale });

describe("every rule resolves against the vendored statute", () => {
  for (const r of RULES) {
    test(`${r.id} (${r.basis})`, () => {
      for (const p of r.paragraphs) expect(norms[p] ?? "").not.toBe("");
      const text = r.paragraphs.map((p) => norms[p] ?? "").join("\n");
      for (const phrase of r.phrases) {
        expect(text.includes(phrase) ? "" : `missing from the statute: ${phrase}`).toBe(
          "",
        );
      }
    });
  }

  test("the rules are distinct and both kinds are present", () => {
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
    expect(RULES.some((r) => r.basis === "statute")).toBe(true);
    expect(RULES.some((r) => r.basis === "product")).toBe(true);
  });

  test("the five factors are the statute's own words, in § 30 Abs. 1", () => {
    const abs1 = absatz(norms["§ 30"] ?? "", 1);
    for (const f of FACTORS) expect(abs1.includes(f.statutory)).toBe(true);
    expect(FACTORS.length).toBe(5);
  });
});

describe("the two service lists are read off the statute, not remembered", () => {
  const abs3 = absatz(norms["§ 30"] ?? "", 3);
  const s1 = absatz(norms["§ 60"] ?? "", 1);

  for (const s of SERVICE_TYPES as readonly ServiceType[]) {
    test(`${s.id}: each phrase is verbatim in the list that names it`, () => {
      if (s.phrase30Abs3 !== null) expect(abs3.includes(s.phrase30Abs3)).toBe(true);
      if (s.phrase60Abs1 !== null) expect(s1.includes(s.phrase60Abs1)).toBe(true);
    });
  }

  test("the lists differ by exactly the two entries the statute shows", () => {
    const only60 = SERVICE_TYPES.filter(
      (s) => s.phrase60Abs1 !== null && s.phrase30Abs3 === null,
    ).map((s) => s.id);
    const only303 = SERVICE_TYPES.filter(
      (s) => s.phrase30Abs3 !== null && s.phrase60Abs1 === null,
    ).map((s) => s.id);
    expect(only60).toEqual(["registry_service_provider"]);
    expect(only303).toEqual(["trust_service"]);
  });
});

describe("applies", () => {
  test("'all' applies to everyone, whatever the facts", () => {
    for (const k of SETTLED) {
      for (const s of SETTLED) {
        expect(applies("all", facts({ criticalInstallation: k, sector35_2: s }))).toBe(
          "yes",
        );
      }
    }
  });

  test("an unsettled fact stays unsettled wherever it is read", () => {
    expect(
      applies("critical_installation", facts({ criticalInstallation: "unsettled" })),
    ).toBe("unsettled");
    expect(applies("sector_35_2", facts({ sector35_2: "unsettled" }))).toBe("unsettled");
    expect(applies("service_type_60_1", facts({ serviceTypes: "unsettled" }))).toBe(
      "unsettled",
    );
  });

  test("a trust service provider is not on the § 60 list; a registry provider is", () => {
    expect(applies("service_type_60_1", facts({ serviceTypes: ["trust_service"] }))).toBe(
      "no",
    );
    expect(
      applies(
        "service_type_60_1",
        facts({ serviceTypes: ["registry_service_provider"] }),
      ),
    ).toBe("yes");
  });

  test("every addressee returns a settled value over the whole space", () => {
    const lists: readonly StatusFacts["serviceTypes"][] = [
      [],
      ["managed_service"],
      ["trust_service"],
      ["registry_service_provider"],
      "unsettled",
    ];
    for (const a of ADDRESSEES) {
      for (const k of SETTLED) {
        for (const s of SETTLED) {
          for (const l of lists) {
            expect(SETTLED).toContain(
              applies(
                a,
                facts({ criticalInstallation: k, sector35_2: s, serviceTypes: l }),
              ),
            );
          }
        }
      }
    }
  });
});

describe("bindingReference", () => {
  test("the EU act governs a § 30 Abs. 3 provider, the Bausteine everyone else", () => {
    expect(bindingReference(facts())).toBe("bsi_baustein");
    expect(bindingReference(facts({ serviceTypes: ["managed_service"] }))).toBe(
      "eu_implementing_act",
    );
    expect(bindingReference(facts({ serviceTypes: ["trust_service"] }))).toBe(
      "eu_implementing_act",
    );
    expect(bindingReference(facts({ serviceTypes: ["registry_service_provider"] }))).toBe(
      "bsi_baustein",
    );
    expect(bindingReference(facts({ serviceTypes: "unsettled" }))).toBe("unsettled");
  });
});

describe("allowedOutcomes", () => {
  test("required never offers a justification; optional offers nothing; no object needs a register", () => {
    for (const g of GRADES) {
      for (const can of [true, false]) {
        const out = allowedOutcomes(g, can);
        if (g === "optional") {
          expect(out).toEqual([]);
          continue;
        }
        expect(out).toContain("done");
        expect(out).toContain("deferred");
        expect(out).toContain("covered_otherwise");
        expect(out.includes("no_object")).toBe(can);
        expect(out.includes("justified")).toBe(g === "expected");
      }
    }
  });
});

describe("justificationComplete and noObjectStale", () => {
  test("all five factors, each non-blank", () => {
    const full = Object.fromEntries(FACTORS.map((f) => [f.id, "eine Angabe"]));
    expect(justificationComplete(full)).toBe(true);
    expect(justificationComplete({ ...full, size: "  " })).toBe(false);
    expect(justificationComplete({})).toBe(false);
  });

  test("a no-object decision goes stale the moment the register is no longer empty", () => {
    expect(noObjectStale(0, 0)).toBe(false);
    expect(noObjectStale(0, 1)).toBe(true);
  });
});

describe("itemState and resumeAt: a wait never stops the flow", () => {
  test("an unmapped item is never settled, and optional controls never block", () => {
    expect(itemState([])).toBe("unmapped");
    expect(itemState([c("optional", null)])).toBe("settled");
    expect(itemState([c("required", "done"), c("optional", null)])).toBe("settled");
  });

  test("open when work remains, blocked when all that remains is waiting", () => {
    expect(itemState([c("required", null)])).toBe("open");
    expect(itemState([c("required", "deferred")])).toBe("blocked");
    expect(itemState([c("required", "deferred"), c("expected", null)])).toBe("open");
    expect(itemState([c("required", "done"), c("expected", "deferred")])).toBe("blocked");
  });

  test("a stale no-object reopens the item", () => {
    expect(itemState([c("required", "no_object", true)])).toBe("open");
    expect(itemState([c("required", "no_object", false)])).toBe("settled");
  });

  test("covered another way and a justification both settle", () => {
    expect(
      itemState([c("required", "covered_otherwise"), c("expected", "justified")]),
    ).toBe("settled");
  });

  test("resume skips past a waiting step to real work, and returns to the wait when nothing else is left", () => {
    // The BSI registration case: step one is waiting on the post, so the flow moves to step two
    // and the next session comes back to step one rather than stranding them there.
    const items = ["registration", "incidents", "backup"] as const;
    const blockedFirst: Record<string, ReturnType<typeof itemState>> = {
      registration: "blocked",
      incidents: "open",
      backup: "open",
    };
    expect(resumeAt([...items], (i) => blockedFirst[i] ?? "open")).toBe("incidents");

    const onlyWaitLeft: Record<string, ReturnType<typeof itemState>> = {
      registration: "blocked",
      incidents: "settled",
      backup: "settled",
    };
    expect(resumeAt([...items], (i) => onlyWaitLeft[i] ?? "open")).toBe("registration");

    const allDone: Record<string, ReturnType<typeof itemState>> = {
      registration: "settled",
      incidents: "settled",
      backup: "settled",
    };
    expect(resumeAt([...items], (i) => allDone[i] ?? "open")).toBe(null);
  });
});

describe("mutants: each must be caught by the property above it", () => {
  const property = (f: typeof allowedOutcomes): boolean =>
    GRADES.every((g) =>
      [true, false].every((can) => {
        const out = f(g, can);
        if (g === "optional") return out.length === 0;
        return (
          out.includes("done") &&
          out.includes("deferred") &&
          out.includes("covered_otherwise") &&
          out.includes("no_object") === can &&
          out.includes("justified") === (g === "expected")
        );
      }),
    );

  test("the real function satisfies the property", () => {
    expect(property(allowedOutcomes)).toBe(true);
  });

  test("offering a justification on a required control is caught", () => {
    expect(
      property((g, can) =>
        g === "required"
          ? [...allowedOutcomes("expected", can)]
          : allowedOutcomes(g, can),
      ),
    ).toBe(false);
  });

  test("offering no object without a register is caught", () => {
    expect(property((g) => allowedOutcomes(g, true))).toBe(false);
  });

  test("recording a decision on an optional control is caught", () => {
    expect(
      property((g, can) => (g === "optional" ? ["done"] : allowedOutcomes(g, can))),
    ).toBe(false);
  });

  test("an unmapped item counted as settled is caught", () => {
    const broken = (cs: readonly ControlState[]) =>
      cs.length === 0 ? "settled" : itemState(cs);
    expect(broken([])).not.toBe(itemState([]));
  });

  test("treating a deferred control as settled is caught", () => {
    const broken = (cs: readonly ControlState[]) =>
      cs.every((x) => x.grade === "optional" || x.current !== null) ? "settled" : "open";
    expect(broken([c("required", "deferred")])).not.toBe(
      itemState([c("required", "deferred")]),
    );
  });
});
