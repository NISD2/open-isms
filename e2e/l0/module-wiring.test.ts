/**
 * L0 module wiring (bun test, no browser, milliseconds).
 *
 * A requirement's `moduleRef` points at an operational register. Turning that
 * key into something a reader can reach takes three separate registrations,
 * none of which the type system connects:
 *
 *   1. `MODULE_HREF`            — the route the panel links to
 *   2. `common.modules.{ref}`   — the label the panel prints
 *   3. `COUNTABLE_MODULES`      — how its rows are counted, which is what
 *                                 decides whether a data change invalidates
 *                                 the sign-off it backs
 *   4. `MODULE_FETCHERS`        — the rows the panel shows (page-local, so
 *                                 asserted by the l2 spec, not here)
 *
 * `team` was registered in none of them. `ModuleRefPanel` returned null on the
 * missing href, so requirement 1.2 (roles and responsibilities) rendered an
 * "Operational data" heading above empty space — no link, no count, no error.
 * Found by Corey while dogfooding, not by any test, because nothing asserted
 * that a module key resolves to anything at all.
 *
 * The counter gap was the worse half and nobody saw it: with no entry,
 * `recheckModuleRequirements` returns early, so 1.2 kept its sign-off however
 * the role map changed. An attestation outliving what it attests to is the
 * one failure here with audit consequences.
 *
 * These loops derive their cases from the framework data, so a moduleRef added
 * to a requirement fails here until it is wired, rather than shipping silent.
 */
import { describe, test, expect } from "bun:test";
import {
  nis2Categories,
  getNis2RequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import { MODULE_HREF } from "@/lib/compliance/operational-links";
import { COUNTABLE_MODULES } from "@/lib/compliance/module-tables";
import commonDe from "@/messages/common/de.json";
import commonEn from "@/messages/common/en.json";

/** Every distinct moduleRef the NIS 2 framework actually assigns. */
const moduleRefs = [
  ...new Set(
    nis2Categories
      .flatMap((cat) => getNis2RequirementsForCategory(cat.slug))
      .map((req) => req.moduleRef)
      .filter((ref): ref is string => !!ref),
  ),
].sort();

const labels: Record<string, Record<string, string>> = {
  de: commonDe.common.modules,
  en: commonEn.common.modules,
};

describe("every assigned moduleRef is wired", () => {
  test("the framework assigns at least one module", () => {
    expect(moduleRefs.length).toBeGreaterThan(0);
  });

  for (const ref of moduleRefs) {
    test(`${ref} has a route`, () => {
      expect(
        MODULE_HREF[ref],
        `moduleRef "${ref}" has no MODULE_HREF entry, so ModuleRefPanel cannot link to it`,
      ).toBeTruthy();
    });

    test(`${ref} can be counted`, () => {
      expect(
        COUNTABLE_MODULES.has(ref),
        `moduleRef "${ref}" has no counter, so recheckModuleRequirements returns ` +
          `early and the requirements it backs never lose their sign-off when ` +
          `its data changes`,
      ).toBe(true);
    });

    for (const locale of ["de", "en"] as const) {
      test(`${ref} has a ${locale} label`, () => {
        expect(
          labels[locale][ref],
          `moduleRef "${ref}" has no common.modules.${ref} in ${locale}`,
        ).toBeTruthy();
      });
    }
  }
});
