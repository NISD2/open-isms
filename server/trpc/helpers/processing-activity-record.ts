import { and, asc, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { dpoOf, GDPR_WALK, throughSupplier } from "@/lib/durchgang";
import {
  company,
  processingActivity,
  processingActivitySupplier,
  supplier,
} from "@/schema";
import { walkPolicyRows } from "./durchgang";
import { answersOf, DPO_ITEM } from "./durchgang-policy";

/**
 * What the record of processing activities states beside its activities: the controller and its
 * contact details (Art. 30(1)(a)), the data protection officer as G-DPO.1 recorded it, and the
 * description of the security measures (30(1)(g)) as G-TOM.1 wrote it, with whether management
 * approved it. The register page and the export read it from here, so the two never differ.
 */
export async function controllerOf(db: Database, companyId: string) {
  const [org, dpo, documents] = await Promise.all([
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: {
        name: true,
        legalName: true,
        registeredAddress: true,
        contactEmail: true,
        contactPhone: true,
      },
    }),
    answersOf(db, companyId, DPO_ITEM),
    walkPolicyRows(db, companyId, GDPR_WALK),
  ]);
  const measures = documents.find((d) => d.type === "gdpr_security_measures");
  return {
    name: org?.legalName || org?.name || null,
    address: org?.registeredAddress ?? null,
    email: org?.contactEmail ?? null,
    phone: org?.contactPhone ?? null,
    dpo: dpoOf(dpo),
    measures: measures
      ? { title: measures.title, approvedAt: measures.approvedAt }
      : null,
  };
}

/**
 * The activities, each with the suppliers that receive its data and what each one's row says of
 * transfers outside the EEA (Art. 30(1)(d), (e)), so the record states them without asking twice.
 */
export async function activitiesOf(db: Database, companyId: string) {
  const [activities, links] = await Promise.all([
    db.query.processingActivity.findMany({
      where: eq(processingActivity.companyId, companyId),
      orderBy: [asc(processingActivity.createdAt), asc(processingActivity.name)],
    }),
    db
      .select({
        activityId: processingActivitySupplier.activityId,
        id: supplier.id,
        name: supplier.name,
        internationalTransfer: supplier.internationalTransfer,
        transferMechanism: supplier.transferMechanism,
        transferCountries: supplier.transferCountries,
        transferCheckedAt: supplier.transferCheckedAt,
      })
      .from(processingActivitySupplier)
      .innerJoin(
        processingActivity,
        eq(processingActivity.id, processingActivitySupplier.activityId),
      )
      .innerJoin(supplier, eq(supplier.id, processingActivitySupplier.supplierId))
      .where(
        and(
          eq(processingActivity.companyId, companyId),
          eq(supplier.customerCompanyId, companyId),
        ),
      )
      .orderBy(asc(supplier.name)),
  ]);
  return activities.map((activity) => ({
    ...activity,
    suppliers: links
      .filter((l) => l.activityId === activity.id)
      .map((l) => ({ id: l.id, name: l.name, through: throughSupplier(l) })),
  }));
}
