import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/trpc/server";
import { SecurityProfileForm } from "@/components/supplier-portal/SecurityProfileForm";
import { SECURITY_PRACTICES_PAGE_FIELDS } from "@/lib/forms/supplier-portal-sections";

/**
 * Profile sub-page — identity, marketing metadata, incident contact.
 *
 * Renders the unified SecurityProfileForm with the practices fields omitted
 * so only the profile-section fields appear. The form's `save` mutation
 * accepts any subset of the unified schema, so this page writes only what
 * it shows.
 */
export default async function SupplierProfileSectionPage() {
  const profile = await api.supplierPortal.profile.get();
  if (!profile) redirect("/portal/supplier-onboarding");

  // ENISA TIG §5.1.2 shortcut — surface the NIS2-regulated badge if the
  // supplier has filled in their own BSI registration ID.
  const isNis2Regulated = !!profile.bsiRegistrationId?.trim();

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Supplier portal
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Identity, public marketing description, and the customer-facing
          incident contact. Anchored to ENISA TIG §5.2 supplier-register
          requirements and CIR §5.1.4(d) incident-notification chain.
        </p>
        {isNis2Regulated && (
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-200">
            <ShieldCheck className="h-3 w-3" />
            Directly NIS2-regulated
            <span className="text-green-700 dark:text-green-300 font-mono">
              · BSI {profile.bsiRegistrationId}
            </span>
          </div>
        )}
      </header>

      <SecurityProfileForm
        initialValues={profile}
        lastSavedAt={profile.practicesLastSavedAt ?? null}
        mode="edit"
        omit={[...SECURITY_PRACTICES_PAGE_FIELDS]}
      />
    </div>
  );
}
