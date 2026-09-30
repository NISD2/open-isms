import { describe, expect, test } from "bun:test";
import guidanceDe from "@/data/guidance/de.json";
import guidanceEn from "@/data/guidance/en.json";
import {
  FREQUENCIES,
  FREQUENCY_TEXT,
  type Frequency,
  IMPACT_TEXT,
  IMPACTS,
  type Impact,
  RISK_LEVELS,
  riskLevel,
} from "./bsi-200-3";

const rank = (f: Frequency, i: Impact) => RISK_LEVELS.indexOf(riskLevel(f, i));

describe("BSI-Standard 200-3", () => {
  test("the 2.1 guidance examples name the scales in the module's words and order", () => {
    for (const [locale, guidance] of [
      ["de", guidanceDe],
      ["en", guidanceEn],
    ] as const) {
      const fields = guidance["2.1"].fields;
      const numbered = (labels: readonly string[]) =>
        labels.map((label, i) => `${i + 1} - ${label}`);
      for (const line of numbered(
        FREQUENCIES.map((f) => FREQUENCY_TEXT[locale][f].label),
      )) {
        expect(fields.likelihoodScale.example).toContain(line);
      }
      for (const line of numbered(IMPACTS.map((i) => IMPACT_TEXT[locale][i].label))) {
        expect(fields.impactScale.example).toContain(line);
      }
    }
  });

  test("the matrix is Abbildung 3 (page 27), cell for cell", () => {
    // As printed: rows top to bottom, columns selten, mittel, häufig, sehr häufig.
    const printed: Record<Impact, readonly string[]> = {
      existential: ["medium", "high", "very_high", "very_high"],
      considerable: ["medium", "medium", "high", "very_high"],
      limited: ["low", "low", "medium", "high"],
      negligible: ["low", "low", "low", "low"],
    };
    for (const impact of IMPACTS) {
      expect(FREQUENCIES.map((f) => riskLevel(f, impact))).toEqual([...printed[impact]]);
    }
  });

  test("the category never falls as frequency or damage rises", () => {
    for (const impact of IMPACTS) {
      const row = FREQUENCIES.map((f) => rank(f, impact));
      expect(row).toEqual([...row].sort((a, b) => a - b));
    }
    for (const f of FREQUENCIES) {
      const column = IMPACTS.map((impact) => rank(f, impact));
      expect(column).toEqual([...column].sort((a, b) => a - b));
    }
  });

  test("no threshold on likelihood times impact reproduces the matrix", () => {
    const cells = IMPACTS.flatMap((impact, i) =>
      FREQUENCIES.map((f, j) => ({
        score: (i + 1) * (j + 1),
        low: riskLevel(f, impact) === "low",
      })),
    );
    for (let threshold = 0; threshold <= 16; threshold++) {
      expect(cells.some((c) => c.score <= threshold !== c.low)).toBe(true);
    }
  });
});
