import { supplierLinkedUpdateSchema, supplierUpdateSchema } from "@/schema/validators";

/**
 * Everything supplier.update drops on a row linked to the supplier's company:
 * the supplier's clause answers and the relationship identity. Derived from the
 * same two schemas the server applies, so the form and the write cannot drift.
 */
const droppedOnLinkedRow: readonly string[] = Object.keys(
  supplierUpdateSchema.shape,
).filter((column) => !(column in supplierLinkedUpdateSchema.shape));

/**
 * The register fields the customer cannot change on this row. An input for
 * them on a linked row would accept an edit the server then silently ignores.
 */
export function supplierReadOnlyFields(row: Record<string, unknown>): readonly string[] {
  return row.supplierCompanyId ? droppedOnLinkedRow : [];
}
