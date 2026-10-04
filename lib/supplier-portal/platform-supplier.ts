/**
 * The company that runs this instance is a supplier to every company using it: on nisd2.eu,
 * nisd2.eu processes their data. So each customer company gets it once as a row of its supplier
 * register, linked to the answers it gave in the supplier portal, which the customer then reads
 * like any supplier's (and which stay current, because they are read from the operator's row).
 *
 * The one exception to the portal's rule that suppliers reach customers only by an explicit
 * invite: it is configured by the operator (PLATFORM_SUPPLIER_COMPANY_ID), it is only ever the
 * operator, it is added once (`company.platformSupplierLinkedAt`), and the customer can delete it
 * like any other row; a deleted row is not added again.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { env } from "@/lib/env";
import { company, supplier } from "@/schema";
import { generateOpaqueToken } from "@/server/trpc/routers/supplier-portal/helpers";
import { PLATFORM_SOURCE } from "./platform-source";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The operator's company id, or null where the feature is off (unset or not an id). */
export const platformSupplierCompanyId = (): string | null => {
  const id = env.PLATFORM_SUPPLIER_COMPANY_ID.trim();
  return UUID.test(id) ? id : null;
};

/**
 * Adds the operator to this company's supplier register if it was never offered. Does nothing
 * where the feature is off, for the operator's own company, or while the operator has not set up
 * its supplier profile yet (the offer waits for it then, rather than being spent on an empty one).
 */
export async function ensurePlatformSupplier(
  db: DbOrTx,
  customerCompanyId: string,
): Promise<void> {
  const operatorId = platformSupplierCompanyId();
  if (!operatorId || operatorId === customerCompanyId) return;

  await db.transaction(async (tx) => {
    // Locks the customer's row, so two requests at once cannot both add the operator.
    const [customer] = await tx
      .select({ linkedAt: company.platformSupplierLinkedAt })
      .from(company)
      .where(eq(company.id, customerCompanyId))
      .for("update");
    if (!customer || customer.linkedAt) return;

    const operator = await tx.query.company.findFirst({
      where: eq(company.id, operatorId),
      columns: {
        name: true,
        legalName: true,
        serviceDescription: true,
        actsAsSupplier: true,
      },
    });
    if (!operator?.actsAsSupplier) return;

    const now = new Date();
    await tx.insert(supplier).values({
      customerCompanyId,
      supplierCompanyId: operatorId,
      name: operator.legalName ?? operator.name,
      description: operator.serviceDescription,
      status: "active",
      source: PLATFORM_SOURCE,
      confirmedAt: now,
      unsubscribeToken: generateOpaqueToken(),
    });
    await tx
      .update(company)
      .set({ platformSupplierLinkedAt: now })
      .where(eq(company.id, customerCompanyId));
  });
}
