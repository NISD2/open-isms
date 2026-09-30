/**
 * One `supplier` row is both the customer's register entry and, once the
 * supplier's company is linked, the supplier's side of the relationship. These
 * pin which columns belong to which side, since every read and write on the
 * shared row is derived from these schemas.
 */
import { describe, expect, test } from "bun:test";
import { supplier } from "@nisd2/grc-data-model/schema";
import { type Column, getTableColumns } from "drizzle-orm";
import {
  customerSupplierAssessmentSchema,
  relationshipClausesUpdateSchema,
  supplierFacingRelationshipSchema,
  supplierLinkedUpdateSchema,
} from "./validators";

const facing = Object.keys(supplierFacingRelationshipSchema.shape);
const clauses = Object.keys(relationshipClausesUpdateSchema.shape);
const assessment = Object.keys(customerSupplierAssessmentSchema.shape);

describe("what the supplier may read of a relationship row", () => {
  test("none of the customer's assessment of the supplier", () => {
    const leaked = assessment.filter((column) => facing.includes(column));
    expect(leaked).toEqual([]);
  });

  test("the columns the audit found leaking are all out", () => {
    for (const column of [
      "riskLevel",
      "isCritical",
      "hasAccessToSystems",
      "hasAccessToData",
      "dueDiligenceProcess",
      "monitoringMethod",
      "contractSecurityClauses",
      "auditFrequency",
      "contractStartDate",
      "contractEndDate",
      "description",
    ]) {
      expect(facing).not.toContain(column);
    }
  });

  test("neither the customer's access token nor the tenant ids", () => {
    for (const column of ["unsubscribeToken", "customerCompanyId", "supplierCompanyId"]) {
      expect(facing).not.toContain(column);
    }
  });

  // The supplier portal renders these: sidebar, customer heading, access page.
  test("still everything the supplier portal renders", () => {
    for (const column of [
      "id",
      "customerEmail",
      "customerOrgName",
      "status",
      ...clauses,
    ]) {
      expect(facing).toContain(column);
    }
  });
});

describe("supplierLinkedUpdateSchema", () => {
  test("drops the clause answers the supplier owns", () => {
    const parsed = supplierLinkedUpdateSchema.parse({
      name: "Acme",
      riskLevel: "high",
      acceptRightToAudit: true,
      incidentSlaHours: 4,
    });
    expect(parsed).toEqual({ name: "Acme", riskLevel: "high" });
  });

  // customerEmail is where incident broadcasts and the access link are mailed,
  // and half of the portal share's unique key.
  test("drops the relationship identity both sides rely on", () => {
    const parsed = supplierLinkedUpdateSchema.parse({
      name: "Acme",
      customerEmail: "someone-else@example.com",
      customerOrgName: "Other GmbH",
      source: "manual",
    });
    expect(parsed).toEqual({ name: "Acme" });
  });

  test("covers every clause the supplier can write", () => {
    const writable = Object.keys(supplierLinkedUpdateSchema.shape);
    expect(clauses.filter((column) => writable.includes(column))).toEqual([]);
  });
});

describe("customerSupplierAssessmentSchema", () => {
  // Removing a linked row sets each of these to null; a NOT NULL column here
  // would make that delete fail.
  test("every column is nullable", () => {
    const columns: Record<string, Column> = getTableColumns(supplier);
    const notNull = assessment.filter((column) => columns[column]?.notNull !== false);
    expect(notNull).toEqual([]);
  });

  test("leaves the relationship identity and the supplier's clauses alone", () => {
    for (const column of ["name", "customerEmail", "customerOrgName", ...clauses]) {
      expect(assessment).not.toContain(column);
    }
  });
});
