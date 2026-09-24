/**
 * Every field the Durchgang can render must have a German label.
 *
 * This test exists because the same defect shipped twice. `introspectSchema` derives a label from
 * the identifier and the identifiers are English, so a field with no entry renders "Management
 * Training Provider" to a Geschäftsführer. The first time, I added labels for the three fields I
 * had personally looked at on screen. The second time it appeared on a different item, because I
 * had fixed the instance and not the class.
 *
 * Enumerating the reachable set is the class fix: a new intake field now fails here instead of
 * quietly showing English.
 */

import { describe, expect, test } from "bun:test";
import { FIELD_LABEL_DE } from "./field-labels.de";
import { allJourneyItems } from "./journey";

// The UNCAPPED journey. The flow is capped at item 5.2 while the early screens are under review,
// and a cap must not be able to hide a missing label on an item that comes back later.
const reachable = [
  ...new Set(allJourneyItems().flatMap((i) => [...i.fields, ...i.rowFields])),
].sort();

describe("German labels cover the whole flow", () => {
  test("the flow can actually reach some fields, so the check is not vacuous", () => {
    expect(reachable.length).toBeGreaterThan(50);
  });

  test("every reachable field has a German label", () => {
    const missing = reachable.filter((f) => !FIELD_LABEL_DE[f]);
    expect(missing).toEqual([]);
  });

  test("no label is dead: everything named here is reachable", () => {
    const unreachable = Object.keys(FIELD_LABEL_DE).filter((k) => !reachable.includes(k));
    expect(unreachable).toEqual([]);
  });

  test("no label is left in English", () => {
    // Not a language check, a smell check: the introspected fallback is Title Case With Spaces and
    // no German function words. Anything matching that shape is the derived label pasted in.
    const suspicious = Object.entries(FIELD_LABEL_DE).filter(([key, label]) => {
      const titleCased = label
        .split(" ")
        .every((w) => w.length === 0 || w[0] === w[0]?.toUpperCase());
      const looksDerived = label.replaceAll(" ", "").toLowerCase() === key.toLowerCase();
      return looksDerived || (titleCased && label.split(" ").length > 2);
    });
    expect(suspicious.map(([k]) => k)).toEqual([]);
  });

  test("the two fields Simon cut are not asked at all", () => {
    // "Einstufung and Sektoren are completely useless. We don't need them at all." The BSI portal
    // makes a company classify itself in order to register, so asking again invites a second and
    // different answer to a question the authority already recorded.
    expect(reachable).not.toContain("entityClassification");
    expect(reachable).not.toContain("applicableSectors");
  });
});
