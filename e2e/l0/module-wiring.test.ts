/**
 * L0 module wiring (bun test, no browser, milliseconds).
 *
 * A requirement's `moduleRef` points at an operational register. Turning that
 * key into something a reader can reach takes three separate registrations,
 * none of which the type system connects:
 *
 *   1. `MODULE_HREF`            — the route the panel links to
 *   2. `common.modules.{ref}`   — the label the panel prints
 *   3. `MODULE_FETCHERS`        — the rows the panel counts (page-local, so
 *                                 asserted by the l2 spec, not here)
 *
 * `team` was registered in none of them. `ModuleRefPanel` returned null on the
 * missing href, so requirement 1.2 (roles and responsibilities) rendered an
 * "Operational data" heading above empty space — no link, no count, no error.
 * Found by Corey while dogfooding, not by any test, because nothing asserted
 * that a module key resolves to anything at all.
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
