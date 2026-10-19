import { describe, expect, test } from "vitest";
import { FRAMEWORK_DATA } from "../src/frameworks";
import {
  aiActGdprSatisfactionPairs,
  aiActNis2SatisfactionPairs,
  allSatisfactionPairs,
  craAiActSatisfactionPairs,
  craGdprSatisfactionPairs,
  craNis2SatisfactionPairs,
  iso27001Nis2SatisfactionPairs,
  nis2GdprSatisfactionPairs,
  type SatisfactionPair,
} from "../src/satisfaction-pairs";

type FrameworkCode = (typeof FRAMEWORK_DATA)[number]["code"];

/**
 * The code prefixes each framework owns. `requirement.code` is unique across frameworks, so every
 * framework after NIS2 marks its codes; ISO 27001 keeps the standard's control numbers ("A.5.1")
 * beside its clause codes ("IS-4.1").
 */
const PREFIXES: Readonly<Record<FrameworkCode, readonly string[]>> = {
  nis2: [],
  gdpr: ["G-"],
  iso27001: ["IS-", "A."],
  eu_ai_act: ["AI-"],
  eu_cra: ["CRA-"],
};

/** Each pair family, with the frameworks its first and second code belong to. */
const PAIR_FAMILIES: readonly (readonly [
  readonly SatisfactionPair[],
  FrameworkCode,
  FrameworkCode,
])[] = [
  [nis2GdprSatisfactionPairs, "nis2", "gdpr"],
  [aiActNis2SatisfactionPairs, "eu_ai_act", "nis2"],
  [aiActGdprSatisfactionPairs, "eu_ai_act", "gdpr"],
  [craNis2SatisfactionPairs, "eu_cra", "nis2"],
  [craAiActSatisfactionPairs, "eu_cra", "eu_ai_act"],
  [craGdprSatisfactionPairs, "eu_cra", "gdpr"],
  [iso27001Nis2SatisfactionPairs, "iso27001", "nis2"],
];

const requirements = FRAMEWORK_DATA.flatMap((f) =>
  f.categories.flatMap((c) =>
    f.getRequirements(c.slug).map((r) => ({ framework: f.code, code: r.code })),
  ),
);

const frameworkOf = new Map(requirements.map((r) => [r.code, r.framework]));

const duplicates = (values: readonly string[]): string[] =>
  values.filter((value, index) => values.indexOf(value) !== index);

/** The frameworks whose prefix a code starts with. */
const prefixOwners = (code: string): FrameworkCode[] =>
  FRAMEWORK_DATA.filter((f) => PREFIXES[f.code].some((p) => code.startsWith(p))).map(
    (f) => f.code,
  );

describe("framework data", () => {
  test("requirement codes are unique across every framework", () => {
    expect(duplicates(requirements.map((r) => r.code))).toEqual([]);
  });

  test("every framework after NIS2 prefixes its codes, and no code carries another's prefix", () => {
    for (const r of requirements) {
      const expected = PREFIXES[r.framework].length === 0 ? [] : [r.framework];
      expect(prefixOwners(r.code), r.code).toEqual(expected);
    }
  });

  test("category codes are unique across every framework", () => {
    const codes = FRAMEWORK_DATA.flatMap((f) => f.categories.map((c) => c.code));
    expect(duplicates(codes)).toEqual([]);
  });

  test("category slugs are unique within each framework", () => {
    for (const f of FRAMEWORK_DATA) {
      expect(duplicates(f.categories.map((c) => c.slug)), f.code).toEqual([]);
    }
  });
});

describe("satisfaction pairs", () => {
  test("each family links real codes of its two frameworks", () => {
    for (const [pairs, first, second] of PAIR_FAMILIES) {
      for (const [a, b] of pairs) {
        expect(frameworkOf.get(a), `${a} in ${first}`).toBe(first);
        expect(frameworkOf.get(b), `${b} in ${second}`).toBe(second);
      }
    }
  });

  test("every pair belongs to a family checked above", () => {
    const familySize = PAIR_FAMILIES.reduce((n, [pairs]) => n + pairs.length, 0);
    expect(allSatisfactionPairs.length).toBe(familySize);
  });

  test("rationale is non-empty for every pair", () => {
    for (const [a, b, rationale] of allSatisfactionPairs) {
      expect(
        rationale.trim().length,
        `empty rationale for ${a} <-> ${b}`,
      ).toBeGreaterThan(0);
    }
  });

  test("equivalence kind, when set, is one of the allowed values", () => {
    for (const [a, b, , kind] of allSatisfactionPairs) {
      if (kind === undefined) continue;
      expect(
        ["equivalent", "overlapping"],
        `bad kind for ${a} <-> ${b}: ${kind}`,
      ).toContain(kind);
    }
  });

  test("equivalent pairs only chain through shared underlying artefacts", () => {
    const equivalentRationaleHints = [
      "same ",
      "reuses",
      "share",
      "shared",
      "same underlying",
    ];
    for (const [a, b, rationale, kind] of allSatisfactionPairs) {
      if (kind !== "equivalent") continue;
      const matchesHint = equivalentRationaleHints.some((h) =>
        rationale.toLowerCase().includes(h),
      );
      expect(
        matchesHint,
        `pair ${a} <-> ${b} is marked equivalent but rationale lacks shared-artefact wording: ${rationale}`,
      ).toBe(true);
    }
  });
});
