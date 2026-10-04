/**
 * The portal places the questionnaire package's questions on its pages; it never defines one. These
 * checks keep the two from drifting: a question added to the package must be placed, and a page
 * may not ask what the package does not define.
 */
import { describe, expect, test } from "bun:test";
import { supplierQuestionnaire } from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { securityProfileUpdateSchema } from "@/schema/validators";
import { QUESTIONNAIRE_PAGES } from "./supplier-portal-sections";

const placed = Object.values(QUESTIONNAIRE_PAGES).flatMap((groups) =>
  groups.flatMap((group): readonly string[] => group.fields),
);

describe("the supplier portal's questionnaire layout", () => {
  test("places every question of the package exactly once", () => {
    const ids = supplierQuestionnaire.fields.map((field) => field.id).sort();
    expect([...placed].sort()).toEqual(ids);
  });

  test("every placed question is a column the save endpoint accepts", () => {
    const columns = new Set(Object.keys(securityProfileUpdateSchema.shape));
    expect(placed.filter((field) => !columns.has(field))).toEqual([]);
  });

  test("group keys are unique, so each heading has one home in messages", () => {
    const keys = Object.values(QUESTIONNAIRE_PAGES).flatMap((groups) =>
      groups.map((group) => group.key),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
