import type { Absicherungsvariante } from "./types";

// All ten measures from NIS2 Art 21(2). The Directive opens with "shall
// include at least the following" — every entity in scope applies all
// ten. What varies by Absicherungsvariante is the proportionate depth of
// implementation (Art 21(1)). We list all ten and use a variante-specific
// note for depth guidance in the UI; we do NOT filter the list.
export const ART21_MEASURES = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
] as const;

export type Art21Measure = (typeof ART21_MEASURES)[number];

// Indicative Grundschutz Bausteine per recommended Absicherungsvariante.
// Starter list shown in the result panel; the canonical Modellierung step
// per BSI-200-2 §8.3 still happens in the operator's ISMS work. Replacing
// this with the actual Stand-der-Technik-Bibliothek mapping is Layer 2.
export function bausteineForVariante(v: Absicherungsvariante): string[] {
  if (v === "kern") {
    return [
      "NET.1.1",
      "NET.3.2",
      "NET.3.3",
      "ORP.4",
      "CON.1",
      "CON.3",
      "OPS.1.1.3",
      "OPS.1.1.5",
      "DER.2.1",
      "DER.4",
    ];
  }
  if (v === "standard") {
    return [
      "NET.1.1",
      "ORP.4",
      "CON.3",
      "OPS.1.1.3",
      "OPS.1.1.5",
      "DER.2.1",
    ];
  }
  return ["NET.1.1", "ORP.4", "CON.3"];
}
