import { describe, expect, test } from "bun:test";
import { supplier } from "@/schema";
import { supplierFacingRelationshipSchema } from "@/schema/validators";
import { pickColumns } from "./typed";

describe("pickColumns", () => {
  test("maps exactly the picked keys to the table's own columns", () => {
    const columns = pickColumns(supplier, supplierFacingRelationshipSchema.shape);
    expect(Object.keys(columns).sort()).toEqual(
      Object.keys(supplierFacingRelationshipSchema.shape).sort(),
    );
    expect(columns.id).toBe(supplier.id);
    expect(columns.incidentSlaHours).toBe(supplier.incidentSlaHours);
    expect(columns).not.toHaveProperty("unsubscribeToken");
  });
});
