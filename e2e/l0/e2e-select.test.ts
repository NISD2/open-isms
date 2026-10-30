/**
 * Which browser specs a pull request runs (e2e/select). Pinned here: every spec on disk has an
 * entry, so none is skipped by accident; a shared or unknown path and the `e2e:full` label run
 * everything; one area's change runs that area's specs after sign-in, with the tenant's data
 * first where the area reads it; a docs-only change runs only sign-in and the smoke check.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { ALWAYS, SPEC_AREAS, TENANT_DATA } from "../select/areas";
import { selectSpecs } from "../select/select";

const specsOnDisk = [...new Bun.Glob("e2e/**/*.spec.ts").scanSync(".")]
  .map((p) => p.replaceAll("\\", "/"))
  .sort();

describe("the table of specs", () => {
  test("names every spec on disk, apart from the ones every run starts with", () => {
    const named = new Set([...Object.keys(SPEC_AREAS), ...ALWAYS, ...TENANT_DATA]);
    expect(specsOnDisk.filter((spec) => !named.has(spec))).toEqual([]);
  });

  test("names no spec that is gone", () => {
    const listed = [...Object.keys(SPEC_AREAS), ...ALWAYS, ...TENANT_DATA];
    expect(listed.filter((spec) => !existsSync(spec))).toEqual([]);
  });
});

describe("what a pull request runs", () => {
  test("a shared path runs the whole suite", () => {
    for (const path of [
      "package.json",
      "bun.lock",
      "playwright.config.ts",
      "e2e/lib/durchgang.ts",
      "packages/grc-data-model/src/schema/supplier.ts",
      "drizzle/0040_something.sql",
      ".github/workflows/e2e.yml",
      "app/[locale]/(portal)/layout.tsx",
      "e2e/l4/grand-tour.spec.ts",
    ]) {
      expect(selectSpecs(["components/durchgang/WalkHome.tsx", path], []).kind).toBe(
        "all",
      );
    }
  });

  test("a file every request goes through runs the whole suite, though its folder is one area's", () => {
    for (const path of [
      "lib/billing/access.ts",
      "lib/billing/promo.ts",
      "lib/mcp/procedures.ts",
    ]) {
      expect(selectSpecs([path], []).kind).toBe("all");
    }
    expect(selectSpecs(["lib/billing/order.ts"], []).kind).toBe("some");
  });

  test("a path no entry claims runs the whole suite", () => {
    expect(selectSpecs(["lib/somewhere-new/thing.ts"], [])).toEqual({
      kind: "all",
      because: "lib/somewhere-new/thing.ts is not one area's",
    });
  });

  test("the e2e:full label runs the whole suite", () => {
    expect(selectSpecs(["docs/billing.md"], ["e2e:full"]).kind).toBe("all");
  });

  test("a walk change runs the walk's specs after sign-in, the smoke check and the tenant's data", () => {
    const selection = selectSpecs(
      ["components/durchgang/ProcessorScreen.tsx", "messages/durchgang/ui-4/en.json"],
      ["documentation"],
    );
    if (selection.kind !== "some") throw new Error("expected a selection");
    expect(selection.areas).toEqual(["walk"]);
    expect(selection.specs).toContain("e2e/auth.setup.ts");
    expect(selection.specs).toContain("e2e/smoke.spec.ts");
    expect(selection.specs).toContain("e2e/l1/intake.spec.ts");
    expect(selection.specs).toContain("e2e/l2/durchgang.spec.ts");
    expect(selection.specs).toContain("e2e/l3/durchgang-link.spec.ts");
    expect(selection.specs).not.toContain("e2e/l2/modules.spec.ts");
    expect(selection.specs).not.toContain("e2e/l4/grand-tour.spec.ts");
  });

  test("an area that signs off pulls in the tenant's data first", () => {
    const selection = selectSpecs(["e2e/l3/signoff.spec.ts"], []);
    if (selection.kind !== "some") throw new Error("expected a selection");
    for (const spec of TENANT_DATA) expect(selection.specs).toContain(spec);
    // Playwright runs files in path order, so the data layer comes before l3.
    expect(selection.specs.indexOf("e2e/l1/intake.spec.ts")).toBeLessThan(
      selection.specs.indexOf("e2e/l3/signoff.spec.ts"),
    );
  });

  test("a docs-only change runs only sign-in and the smoke check", () => {
    expect(selectSpecs(["docs/billing.md", "README.md"], [])).toEqual({
      kind: "some",
      areas: [],
      specs: [...ALWAYS].sort(),
    });
  });
});
