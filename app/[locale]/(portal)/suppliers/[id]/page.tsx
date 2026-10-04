import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SecurityProfilePage } from "@/components/supplier-portal/SecurityProfilePage";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadSharedSupplierProfile } from "@/lib/supplier-portal/shared-profile";
import { supplier } from "@/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("supplierPortal.customerView");
  return { title: t("securityProfile"), robots: { index: false, follow: false } };
}

/**
 * A supplier's answers to the supplier questionnaire, read inside the app by the company that
 * lists it: the same answer sheet and certificates as the token view. Only for a register row of
 * the caller's own company that is linked to a supplier who shares through the portal.
 */
export default async function SupplierAnswersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!session.companyId || !UUID.test(id)) notFound();

  const row = await db.query.supplier.findFirst({
    where: and(eq(supplier.id, id), eq(supplier.customerCompanyId, session.companyId)),
    columns: { supplierCompanyId: true, status: true },
  });
  if (!row?.supplierCompanyId || row.status !== "active") notFound();

  const shared = await loadSharedSupplierProfile(db, row.supplierCompanyId);
  if (!shared) notFound();

  const t = await getTranslations("durchgang.ui.suppliers");
  return (
    <div className="space-y-6">
      <Link
        href="/suppliers"
        className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {t("backToRegister")}
      </Link>
      <SecurityProfilePage
        profile={shared.profile}
        certifications={shared.certifications}
        supplierName={shared.profile.legalName ?? shared.profile.name}
      />
    </div>
  );
}
