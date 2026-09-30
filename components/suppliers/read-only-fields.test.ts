import { describe, expect, test } from "bun:test";
import {
  relationshipClausesUpdateSchema,
  supplierLinkedUpdateSchema,
  supplierUpdateSchema,
} from "@/schema/validators";
import { supplierReadOnlyFields } from "./read-only-fields";

const clauses = Object.keys(relationshipClausesUpdateSchema.shape);
const linked = { id: "row", name: "Acme", supplierCompanyId: "supplier-company" };

describe("supplierReadOnlyFields", () => {
  test("a row the supplier never joined stays fully editable", () => {
    expect(
      supplierReadOnlyFields({ id: "row", name: "Acme", supplierCompanyId: null }),
    ).toEqual([]);
    expect(supplierReadOnlyFields({ id: "row", name: "Acme" })).toEqual([]);
  });

  test("a linked row locks every clause answer the supplier writes", () => {
    const readOnly = supplierReadOnlyFields(linked);
    expect(clauses.length).toBeGreaterThan(0);
    expect(clauses.filter((column) => !readOnly.includes(column))).toEqual([]);
  });

  // Anything shown editable must be something the linked update keeps, or the
  // edit is silently dropped, which is the bug this exists to prevent.
  test("a linked row leaves editable exactly what the server still saves", () => {
    const readOnly = supplierReadOnlyFields(linked);
    const editable = Object.keys(supplierUpdateSchema.shape).filter(
      (column) => !readOnly.includes(column),
    );
    expect(editable.sort()).toEqual(Object.keys(supplierLinkedUpdateSchema.shape).sort());
  });

  test("the customer's own assessment stays editable on a linked row", () => {
    const readOnly = supplierReadOnlyFields(linked);
    for (const column of ["name", "riskLevel", "isCritical", "contractEndDate"]) {
      expect(readOnly).not.toContain(column);
    }
  });
});
