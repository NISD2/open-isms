import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CompanyEssentials } from "@/components/organization/CompanyEssentials";
import { CompanySetup } from "@/components/organization/CompanySetup";
import { OrganizationId } from "@/components/organization/OrganizationId";
import { getSession } from "@/lib/auth";
import { ENTITY_TYPES } from "@/lib/organization/constants";
import { api } from "@/lib/trpc/server";

/**
 * The company's own data: the three essentials the walk sets the company up with
 * (`CompanyEssentials`, Simon 04.10.2026: "only the things we need from the organization, nothing
 * more"). A company not set up yet sets itself up here (`CompanySetup`). Only an admin changes them.
 * Below them its id, to copy (`OrganizationId`).
 */
export default async function OrganizationPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const [t, companyData] = await Promise.all([
    getTranslations("organization"),
    api.assessment.getCompany(),
  ]);
  if (!companyData?.activatedAt) return <CompanySetup />;

  const entityType =
    ENTITY_TYPES.find((type) => type === companyData.entityType) ?? "important";
  const isAdmin = session.role === "admin";
  const sectorName = t.has(`sectors.${companyData.sector}`)
    ? t(`sectors.${companyData.sector}`)
    : companyData.sector;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("editTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("editDescription")}</p>
        </div>
      </div>
      {isAdmin ? (
        <div className="rounded-3xl border bg-card p-6 shadow-xs sm:p-8">
          <CompanyEssentials
            mode="edit"
            initial={{ name: companyData.name, sector: companyData.sector, entityType }}
            submitLabel={t("save")}
          />
        </div>
      ) : (
        <dl className="divide-y rounded-3xl border bg-card px-6 shadow-xs">
          {[
            [t("essentials.name"), companyData.name],
            [t("sector"), sectorName],
            [t("entityType"), t(`entityTypes.${entityType}`)],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr]">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <OrganizationId id={companyData.id} />
    </div>
  );
}
