/**
 * The portal places the questionnaire package's questions on its pages; it never defines one. These
 * checks keep the two from drifting: a question added to the package must be placed (or named as
 * answered elsewhere), a page may not ask what the package does not define, and the column that
 * holds each answer must store what the question asks for.
 */
import { describe, expect, test } from "bun:test";
import { supplierQuestionnaire } from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { getTableColumns } from "drizzle-orm";
import { company } from "@/schema";
import {
  ANSWERED_ELSEWHERE,
  QUESTIONNAIRE_FIELDS,
  QUESTIONNAIRE_PAGES,
} from "./supplier-portal-sections";

const questions = new Map(supplierQuestionnaire.fields.map((field) => [field.id, field]));
const columns = getTableColumns(company);

describe("the supplier portal's questionnaire layout", () => {
  test("places every question of the package exactly once, or names where it is answered", () => {
    expect([...QUESTIONNAIRE_FIELDS, ...Object.keys(ANSWERED_ELSEWHERE)].sort()).toEqual(
      [...questions.keys()].sort(),
    );
  });

  test("group keys are unique, so each heading has one home in messages", () => {
    const keys = Object.values(QUESTIONNAIRE_PAGES).flatMap((groups) =>
      groups.map((group) => group.key),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("each answer's column stores what its question asks for", () => {
    for (const field of QUESTIONNAIRE_FIELDS) {
      const question = questions.get(field);
      const column = columns[field];
      if (!question) throw new Error(`${field} is not in the package`);
      switch (question.type) {
        case "boolean":
          expect([field, column.dataType]).toEqual([field, "boolean"]);
          break;
        case "integer":
          expect([field, column.dataType]).toEqual([field, "number"]);
          break;
        case "enum":
          expect([field, column.enumValues]).toEqual([
            field,
            question.options?.map((option) => option.value),
          ]);
          break;
        default:
          expect([field, column.dataType]).toEqual([field, "string"]);
      }
    }
  });
});
