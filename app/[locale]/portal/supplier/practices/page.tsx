import { redirect } from "next/navigation";
import { api } from "@/lib/trpc/server";
import { SecurityProfileForm } from "@/components/supplier-portal/SecurityProfileForm";
import { PROFILE_PAGE_FIELDS } from "@/lib/forms/supplier-portal-sections";

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
  const profile = await api.supplierPortal.profile.get();
  if (!profile) redirect("/portal/supplier-onboarding");

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Supplier portal
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Security practices
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Universal facts about your company&apos;s information security
          program: ISMS, ISO 27001 / Grundschutz status, staff training, and
          NIS2 Art 21(2) baseline practices. Same answers for every customer.
        </p>
      </header>

      <SecurityProfileForm
        initialValues={profile}
        lastSavedAt={profile.practicesLastSavedAt ?? null}
        mode="edit"
        omit={[...PROFILE_PAGE_FIELDS]}
      />
    </div>
  );
}
