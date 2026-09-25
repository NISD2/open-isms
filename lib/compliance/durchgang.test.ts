import { describe, expect, test } from "bun:test";
import de from "../../messages/durchgang/de.json";
import en from "../../messages/durchgang/en.json";
import { DURCHGANG_CODES, DURCHGANG_LENGTH, durchgangStep, stepKey } from "./durchgang";
import { JOURNEY_ORDER } from "./journey-position";

type Notes = { who?: unknown; ask?: unknown; missed?: unknown };

describe("Durchgang", () => {
  test("walks the opening of the journey order, one item per screen", () => {
    expect(DURCHGANG_CODES).toHaveLength(DURCHGANG_LENGTH);
    expect(DURCHGANG_CODES).toEqual(JOURNEY_ORDER.slice(0, DURCHGANG_LENGTH));
    expect(DURCHGANG_CODES[0]).toBe("12.1");
  });

  test("knows each step's neighbours and refuses codes outside the walk", () => {
    expect(durchgangStep("12.1")).toEqual({
      number: 1,
      total: DURCHGANG_LENGTH,
      prevCode: null,
      nextCode: "12.2",
    });
    const last = DURCHGANG_CODES[DURCHGANG_LENGTH - 1] ?? "";
    expect(durchgangStep(last)?.number).toBe(DURCHGANG_LENGTH);
    expect(durchgangStep(last)?.nextCode).toBeNull();
    expect(durchgangStep("9.9")).toBeNull();
  });

  // Every screen carries notes in both languages. A screen without them would render a bare
  // form beside an empty panel, and the gap would only show once someone reached that step.
  test.each([
    ["de", de.durchgang.steps as Record<string, Notes>],
    ["en", en.durchgang.steps as Record<string, Notes>],
  ])("every step has notes in %s", (_locale, steps) => {
    for (const code of DURCHGANG_CODES) {
      const notes = steps[stepKey(code)];
      expect(notes, `${code} has no notes`).toBeDefined();
      expect(typeof notes?.who, `${code} who`).toBe("string");
      expect(typeof notes?.ask, `${code} ask`).toBe("string");
      expect(
        Array.isArray(notes?.missed) && notes.missed.length > 0,
        `${code} missed`,
      ).toBe(true);
    }
  });
});
