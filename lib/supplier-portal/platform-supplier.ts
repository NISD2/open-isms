/**
 * The company that runs this instance is a supplier to every company using it: on nisd2.eu,
 * nisd2.eu processes their data. So each customer company gets it once as a row of its supplier
 * register, which opens the answers the operator gave in the supplier portal (read live from the
 * operator's company, so they stay current).
 *
 * The one exception to the portal's rule that suppliers reach customers only by an explicit
 * invite, and one way only: the row carries no `supplierCompanyId`, so the operator never sees
 * these customers in its own supplier portal. It is configured by the operator
 * (PLATFORM_SUPPLIER_COMPANY_ID), added once (`company.platformSupplierLinkedAt`), and the
 * customer can delete it like any other row; a deleted row is not added again.
 */
import "@/lib/server-guard";
import { and, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { env } from "@/lib/env";
import { company, supplier } from "@/schema";
import { PLATFORM_SOURCE } from "./register-row";

/** The operator's company id, or null where the feature is off. */
export const platformSupplierCompanyId = (): string | null =>
  env.PLATFORM_SUPPLIER_COMPANY_ID ?? null;

/**
 * The company whose questionnaire answers a register row opens, or null when it opens none: an
 * active row linked to a supplier company, or the operator's row while the feature is on.
 */
export const answeringCompanyId = (row: {
  readonly status: string | null;
  readonly supplierCompanyId: string | null;
  readonly source: string | null;
}): string | null => {
  if (row.status !== "active") return null;
  return row.source === PLATFORM_SOURCE
    ? platformSupplierCompanyId()
    : row.supplierCompanyId;
};

/**
 * Adds the operator to this company's supplier register if it was never offered. Does nothing
 * where the feature is off, for the operator's own company, for a company still in setup, for a
 * customer that already lists the operator through an invite, and while the operator's profile
 * does not yet say who it is and what it does (the offer waits rather than being spent on a
 * nameless row).
 */
export async function ensurePlatformSupplier(
  db: DbOrTx,
  customerCompanyId: string,
): Promise<void> {
  const operatorId = platformSupplierCompanyId();
  if (!operatorId || operatorId === customerCompanyId) return;

  // Read without a lock first: once the offer was made, which is nearly every request, that is all.
  const customer = await db.query.company.findFirst({
    where: eq(company.id, customerCompanyId),
    columns: { activatedAt: true, platformSupplierLinkedAt: true },
  });
  if (!customer?.activatedAt || customer.platformSupplierLinkedAt) return;

  const operator = await db.query.company.findFirst({
    where: eq(company.id, operatorId),
    columns: { legalName: true, serviceDescription: true, actsAsSupplier: true },
  });
  if (!operator?.actsAsSupplier || !operator.legalName || !operator.serviceDescription)
    return;
  const { legalName, serviceDescription } = operator;

  await db.transaction(async (tx) => {
    // Locks the customer's row, so two requests at once cannot both add the operator.
    const [locked] = await tx
      .select({ linkedAt: company.platformSupplierLinkedAt })
      .from(company)
      .where(eq(company.id, customerCompanyId))
      .for("update");
    if (!locked || locked.linkedAt) return;

    const invited = await tx.query.supplier.findFirst({
      where: and(
        eq(supplier.customerCompanyId, customerCompanyId),
        eq(supplier.supplierCompanyId, operatorId),
      ),
      columns: { id: true },
    });
    const now = new Date();
    if (!invited) {
      await tx.insert(supplier).values({
        customerCompanyId,
        name: legalName,
        description: serviceDescription,
        status: "active",
        source: PLATFORM_SOURCE,
        confirmedAt: now,
      });
    }
    await tx
      .update(company)
      .set({ platformSupplierLinkedAt: now })
      .where(eq(company.id, customerCompanyId));
  });
}
