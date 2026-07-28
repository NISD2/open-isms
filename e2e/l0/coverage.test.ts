/**
 * L0 coverage: every NIS2 requirement code in grc-data-model resolves to a
 * walker interaction kind. A new requirement fails CI here until someone
 * classifies it (usually free: the product's own registries classify it).
 */
import { describe, test, expect } from "bun:test";
import {
  nis2Categories,
  getNis2RequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import { classifyRequirement } from "../lib/walker-classification";

const allRequirements = nis2Categories.flatMap((cat) =>
  getNis2RequirementsForCategory(cat.slug).map((r) => ({
    code: r.code,
    moduleRef: r.moduleRef ?? null,
  })),
);

test("grc-data-model still defines exactly 49 NIS2 requirements", () => {
  expect(allRequirements.length).toBe(49);
});

describe("every requirement code has a walker classification", () => {
  for (const req of allRequirements) {
    test(req.code, () => {
      expect(
        classifyRequirement(req.code, req.moduleRef),
        `requirement ${req.code} is unclassified — add it to EXTRA_MODULE_BACKED or the product registries`,
      ).not.toBe("unclassified");
    });
  }
});
