/**
 * The journey's labels on a Czech page: Czech, with the count words Czech takes (1 den, 3 dny,
 * 5 dní), and never the English a two-way de/en switch used to give every non-German reader.
 */
import { describe, expect, test } from "bun:test";
import { journeyLocaleOf, reviewLabel, startLabel, statusLabel } from "./path-nodes";

describe("journeyLocaleOf", () => {
  test("keeps Czech and German, reads every other page language as English", () => {
    expect(journeyLocaleOf("cs")).toBe("cs");
    expect(journeyLocaleOf("de")).toBe("de");
    expect(journeyLocaleOf("nl")).toBe("en");
  });
});

describe("reviewLabel in Czech", () => {
  test("takes the noun form the count asks for", () => {
    expect(reviewLabel(-1, "cs")).toBe("Přezkum 1 den po termínu");
    expect(reviewLabel(-3, "cs")).toBe("Přezkum 3 dny po termínu");
    expect(reviewLabel(-5, "cs")).toBe("Přezkum 5 dní po termínu");
    expect(reviewLabel(22, "cs")).toBe("Další přezkum za 22 dní");
  });

  test("leaves English and German as they were", () => {
    expect(reviewLabel(1, "en")).toBe("Next review in 1 day");
    expect(reviewLabel(-2, "de")).toBe("Prüfung 2 Tage überfällig");
    expect(reviewLabel(2, "de")).toBe("Nächste Prüfung in 2 Tagen");
  });
});

describe("statusLabel and startLabel in Czech", () => {
  test("say where a step stands in Czech", () => {
    expect(
      statusLabel(
        { rawStatus: "needs_review", state: "awaiting", coveredBy: null },
        "cs",
      ),
    ).toBe("Čeká na schválení");
    expect(
      statusLabel(
        {
          rawStatus: "completed",
          state: "signed",
          coveredBy: { kind: "walk", codes: ["7.1", "7.3"] },
        },
        "cs",
      ),
    ).toBe("Schváleno v průvodci spolu s 7.1 a 7.3");
    expect(startLabel("awaiting", "cs")).toBe("Schválit");
  });
});
