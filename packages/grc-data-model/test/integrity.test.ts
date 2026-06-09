import { describe, expect, test } from "vitest";
import {
  nis2Categories,
  getNis2RequirementsForCategory,
  gdprCategories,
  getGdprRequirementsForCategory,
  euAiActCategories,
  getEuAiActRequirementsForCategory,
  euCraCategories,
  getEuCraRequirementsForCategory,
} from "../src/frameworks";
import {
  nis2GdprSatisfactionPairs,
  aiActNis2SatisfactionPairs,
  aiActGdprSatisfactionPairs,
  craNis2SatisfactionPairs,
  craAiActSatisfactionPairs,
  craGdprSatisfactionPairs,
  allSatisfactionPairs,
} from "../src/satisfaction-pairs";

function collectCodes(
  categories: { slug: string }[],
  getReqs: (slug: string) => { code: string }[],
): Set<string> {
  const codes = new Set<string>();
  for (const c of categories) for (const r of getReqs(c.slug)) codes.add(r.code);
  return codes;
}

const nis2Codes = collectCodes(nis2Categories, getNis2RequirementsForCategory);
const gdprCodes = collectCodes(gdprCategories, getGdprRequirementsForCategory);
const aiActCodes = collectCodes(euAiActCategories, getEuAiActRequirementsForCategory);
const craCodes = collectCodes(euCraCategories, getEuCraRequirementsForCategory);

describe("satisfaction pairs", () => {
  test("nis2GdprSatisfactionPairs reference real codes", () => {
    for (const [a, b] of nis2GdprSatisfactionPairs) {
      expect(nis2Codes.has(a), `unknown NIS2 code: ${a}`).toBe(true);
      expect(gdprCodes.has(b), `unknown GDPR code: ${b}`).toBe(true);
    }
  });

  test("aiActNis2SatisfactionPairs reference real codes", () => {
    for (const [a, b] of aiActNis2SatisfactionPairs) {
      expect(aiActCodes.has(a), `unknown AI Act code: ${a}`).toBe(true);
      expect(nis2Codes.has(b), `unknown NIS2 code: ${b}`).toBe(true);
    }
  });

  test("aiActGdprSatisfactionPairs reference real codes", () => {
    for (const [a, b] of aiActGdprSatisfactionPairs) {
      expect(aiActCodes.has(a), `unknown AI Act code: ${a}`).toBe(true);
      expect(gdprCodes.has(b), `unknown GDPR code: ${b}`).toBe(true);
    }
  });

  test("craNis2SatisfactionPairs reference real codes", () => {
    for (const [a, b] of craNis2SatisfactionPairs) {
      expect(craCodes.has(a), `unknown CRA code: ${a}`).toBe(true);
      expect(nis2Codes.has(b), `unknown NIS2 code: ${b}`).toBe(true);
    }
  });

  test("craAiActSatisfactionPairs reference real codes", () => {
    for (const [a, b] of craAiActSatisfactionPairs) {
      expect(craCodes.has(a), `unknown CRA code: ${a}`).toBe(true);
      expect(aiActCodes.has(b), `unknown AI Act code: ${b}`).toBe(true);
    }
  });

  test("craGdprSatisfactionPairs reference real codes", () => {
    for (const [a, b] of craGdprSatisfactionPairs) {
      expect(craCodes.has(a), `unknown CRA code: ${a}`).toBe(true);
      expect(gdprCodes.has(b), `unknown GDPR code: ${b}`).toBe(true);
    }
  });

  test("rationale is non-empty for every pair", () => {
    for (const [a, b, rationale] of allSatisfactionPairs) {
      expect(rationale.trim().length, `empty rationale for ${a} <-> ${b}`).toBeGreaterThan(0);
    }
  });

  test("equivalence kind, when set, is one of the allowed values", () => {
    for (const [a, b, , kind] of allSatisfactionPairs) {
      if (kind === undefined) continue;
      expect(["equivalent", "overlapping"], `bad kind for ${a} <-> ${b}: ${kind}`).toContain(kind);
    }
  });

  test("equivalent pairs only chain through shared underlying artefacts", () => {
    const equivalentRationaleHints = ["same ", "reuses", "share", "shared", "Same ", "same underlying"];
    for (const [a, b, rationale, kind] of allSatisfactionPairs) {
      if (kind !== "equivalent") continue;
      const matchesHint = equivalentRationaleHints.some((h) =>
        rationale.toLowerCase().includes(h.toLowerCase()),
      );
      expect(
        matchesHint,
        `pair ${a} <-> ${b} is marked equivalent but rationale lacks shared-artefact wording: ${rationale}`,
      ).toBe(true);
    }
  });
});

describe("framework data", () => {
  test("NIS2 has no duplicate requirement codes", () => {
    const seen = new Set<string>();
    for (const c of nis2Categories) {
      for (const r of getNis2RequirementsForCategory(c.slug)) {
        expect(seen.has(r.code), `duplicate NIS2 code: ${r.code}`).toBe(false);
        seen.add(r.code);
      }
    }
  });

  test("GDPR has no duplicate requirement codes", () => {
    const seen = new Set<string>();
    for (const c of gdprCategories) {
      for (const r of getGdprRequirementsForCategory(c.slug)) {
        expect(seen.has(r.code), `duplicate GDPR code: ${r.code}`).toBe(false);
        seen.add(r.code);
      }
    }
  });

  test("AI Act has no duplicate requirement codes", () => {
    const seen = new Set<string>();
    for (const c of euAiActCategories) {
      for (const r of getEuAiActRequirementsForCategory(c.slug)) {
        expect(seen.has(r.code), `duplicate AI Act code: ${r.code}`).toBe(false);
        seen.add(r.code);
      }
    }
  });

  test("CRA has no duplicate requirement codes", () => {
    const seen = new Set<string>();
    for (const c of euCraCategories) {
      for (const r of getEuCraRequirementsForCategory(c.slug)) {
        expect(seen.has(r.code), `duplicate CRA code: ${r.code}`).toBe(false);
        seen.add(r.code);
      }
    }
  });

  test("category slugs are unique within each framework", () => {
    for (const cats of [nis2Categories, gdprCategories, euAiActCategories, euCraCategories]) {
      const slugs = cats.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});
