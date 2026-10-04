/**
 * What a customer's supplier register row says about the supplier's own questionnaire answers.
 * Apart from the server modules so the browser can read it.
 */

/**
 * `supplier.source` of the row that lists the instance's own operator
 * (lib/supplier-portal/platform-supplier.ts). That row carries no `supplierCompanyId`, so it
 * never appears on the operator's side of the supplier portal.
 */
export const PLATFORM_SOURCE = "platform";

/**
 * Whether the customer may ask this supplier to answer the questionnaire: not while a supplier
 * company is linked to the row (it answers, or it ended the relationship itself), and never for
 * the operator's row. The invite endpoint applies the same rule.
 */
export const canRequestAnswers = (row: {
  readonly supplierCompanyId: string | null;
  readonly source: string | null;
}): boolean => row.supplierCompanyId === null && row.source !== PLATFORM_SOURCE;
