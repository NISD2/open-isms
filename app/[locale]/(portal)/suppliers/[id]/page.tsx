import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { SecurityProfilePage } from "@/components/supplier-portal/SecurityProfilePage";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { answeringCompanyId } from "@/lib/supplier-portal/platform-supplier";
import { loadSharedSupplierProfile } from "@/lib/supplier-portal/shared-profile";
import { supplier } from "@/schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("supplierPortal.customerView");
  return { title: t("securityProfile"), robots: { index: false, follow: false } };
}

/**
 * A supplier's answers to the supplier questionnaire, read inside the app by the company that
 * lists it: the same answer sheet and certificates as the token view. Only for a register row of
 * the caller's own company that is linked to a supplier who shares through the portal, or the
 * row listing the instance's operator, whose answers are the configured operator company's.
 */
export default async function SupplierAnswersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!session.companyId || !z.uuid().safeParse(id).success) notFound();

  const row = await db.query.supplier.findFirst({
    where: and(eq(supplier.id, id), eq(supplier.customerCompanyId, session.companyId)),
    columns: { supplierCompanyId: true, status: true, source: true },
  });
  const answeredBy = row ? answeringCompanyId(row) : null;
  const shared = answeredBy ? await loadSharedSupplierProfile(db, answeredBy) : null;
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
