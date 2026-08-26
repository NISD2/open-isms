import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { SecurityProfileForm } from "@/components/supplier-portal/SecurityProfileForm";
import {
  PROFILE_PAGE_FIELDS,
  SERVICE_TYPE_PAGE_FIELDS,
} from "@/lib/forms/supplier-portal-sections";

/**
 * Security Practices sub-page — universal company-wide ISMS / NIS2 baseline
 * practices.
 *
 * Replaces the old "Questionnaire" page. Per-asset technical declarations
 * (SaaS hosting region, on-prem SBOM, managed PAM, etc.) and per-customer
 * contract clauses (right-to-audit, exit plan, etc.) are no longer here —
 * they live on the per-customer asset and relationship rows.
 *
 * Renders the unified SecurityProfileForm with the profile fields omitted
 * so only the practices fields appear. Anchored to CIR 2024/2690 §5.1
 * universal baseline + ENISA TIG §5.1.2.
 */
export default async function SupplierPracticesPage() {
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
          {nav("practices")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {pages("practicesIntro")}
        </p>
      </header>

      <SecurityProfileForm
        initialValues={profile}
        lastSavedAt={profile.practicesLastSavedAt ?? null}
        mode="edit"
        omit={[...PROFILE_PAGE_FIELDS, ...SERVICE_TYPE_PAGE_FIELDS]}
      />
    </div>
  );
}
