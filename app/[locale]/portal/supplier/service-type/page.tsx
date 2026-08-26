import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { SecurityProfileForm } from "@/components/supplier-portal/SecurityProfileForm";
import {
  PROFILE_PAGE_FIELDS,
  SECURITY_PRACTICES_PAGE_FIELDS,
} from "@/lib/forms/supplier-portal-sections";

/**
 * Service-type sub-page — the four service-type-conditional technical
 * sections: SaaS, On-prem, Professional services, Managed services.
 *
 * Suppliers declare WHICH services they offer on the Profile page via the
 * isSaas / isOnPrem / isProfessionalServices / isManagedService toggles.
 * The matching technical sub-sections are answered here. Until SchemaForm
 * supports visibleWhen, every section renders unconditionally — suppliers
 * leave blanks for the ones that do not apply.
 *
 * Renders the unified SecurityProfileForm with the profile and practices
 * fields omitted so only the service-type fields appear.
 */
export default async function SupplierServiceTypePage() {
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);
  const profile = await api.supplierPortal.profile.get();
  if (!profile) redirect("/portal/supplier-onboarding");

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {nav("portalName")}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {nav("serviceType")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {pages("serviceTypeIntro")}
        </p>
      </header>

      <SecurityProfileForm
        initialValues={profile}
        lastSavedAt={profile.practicesLastSavedAt ?? null}
        mode="edit"
        omit={[...PROFILE_PAGE_FIELDS, ...SECURITY_PRACTICES_PAGE_FIELDS]}
      />
    </div>
  );
}
