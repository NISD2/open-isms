import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { OrganizationForm } from "@/components/organization/OrganizationForm";

export default async function OrganizationPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const t = await getTranslations("organization");
  const companyData = await api.assessment.getCompany();

  if (!companyData) redirect("/onboarding");

  const isAdmin = session.role === "admin";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("editTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("editDescription")}</p>
        </div>
      </div>
      <OrganizationForm
        mode="edit"
        initialData={{
          name: companyData.name,
          sector: companyData.sector,
          entityType: companyData.entityType as
            | "essential"
            | "important"
            | "kritis",
          legalForm: companyData.legalForm ?? undefined,
          employeeCount: companyData.employeeCount ?? undefined,
          contactEmail: companyData.contactEmail ?? undefined,
          cisoName: companyData.cisoName ?? undefined,
          cisoReportsTo: companyData.cisoReportsTo ?? undefined,
          bsiContactName: companyData.bsiContactName ?? undefined,
          bsiContactEmail: companyData.bsiContactEmail ?? undefined,
          bsiContactPhone: companyData.bsiContactPhone ?? undefined,
          bsiRegistrationId: companyData.bsiRegistrationId ?? undefined,
          annualSecurityBudget: companyData.annualSecurityBudget ?? undefined,
          primaryLocations: companyData.primaryLocations ?? undefined,
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
