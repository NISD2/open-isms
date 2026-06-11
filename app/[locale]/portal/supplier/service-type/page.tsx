import { redirect } from "next/navigation";
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
  const profile = await api.supplierPortal.profile.get();
  if (!profile) redirect("/portal/supplier-onboarding");

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Supplier portal
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Service type</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Technical declarations specific to the services you provide: SaaS
          hosting and encryption, on-prem SBOM and signed releases, consultant
          background checks, managed-service PAM and on-call. Answer only the
          sections that apply.
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
