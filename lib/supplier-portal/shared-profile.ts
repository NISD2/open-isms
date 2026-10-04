/**
 * What a customer may read of one supplier: the questionnaire answers and the active
 * certificates, never the rest of the supplier's company row and never a certificate's file key.
 * The token view (/supplier-access/[token]) and the in-app view (/suppliers/[id]) both read it
 * from here, after each has checked that the caller is that supplier's customer.
 */
import "@/lib/server-guard";
import { and, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { QUESTIONNAIRE_COLUMNS } from "@/lib/forms/supplier-portal-sections";
import { company, companyCertification } from "@/schema";

export async function loadSharedSupplierProfile(db: DbOrTx, supplierCompanyId: string) {
  const [profile, certifications] = await Promise.all([
    db.query.company.findFirst({
      where: eq(company.id, supplierCompanyId),
      columns: {
        id: true,
        name: true,
        sector: true,
        actsAsSupplier: true,
        logoStorageKey: true,
        practicesLastSavedAt: true,
        ...QUESTIONNAIRE_COLUMNS,
      },
    }),
    db.query.companyCertification.findMany({
      where: and(
        eq(companyCertification.companyId, supplierCompanyId),
        eq(companyCertification.status, "active"),
      ),
      columns: {
        id: true,
        type: true,
        typeOther: true,
        scope: true,
        auditor: true,
        validFrom: true,
        validUntil: true,
        status: true,
      },
    }),
  ]);
  // A company that stopped acting as a supplier shares nothing, whoever links to it.
  if (!profile?.actsAsSupplier) return null;
  return { profile, certifications };
}
