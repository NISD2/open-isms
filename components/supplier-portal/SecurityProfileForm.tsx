"use client";

/**
 * Security Profile Form — the company-level supplier portal form.
 *
 * Renders the universal company facts: identity, contacts, ISMS, ISO27001,
 * NIS2 Art 21(2) baseline practices. Per-customer contract clauses live on
 * the relationship row (different form). Per-asset technical declarations
 * (SaaS hosting, on-prem SBOM, managed PAM, etc.) live on the asset row
 * (different form, reuses the entity-side compliance asset components).
 *
 * Same component, two callers:
 *   - /portal/supplier/profile + /practices  (logged-in supplier, edit mode)
 *   - /supplier-access/[token]               (token-gated customer, view mode)
 *
 * The two supplier sub-pages pass the OPPOSITE field list as `omit`, so the
 * schema and the save endpoint stay singular but the UI splits cleanly.
 *
 * Field labels and citation help-text are i18n-resolved from
 * messages/supplierPortal/{en,de}.json via translationNamespace.
 */
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { securityProfileUpdateSchema } from "@/schema/validators";
import { toast } from "sonner";

type ProfileValues = z.infer<typeof securityProfileUpdateSchema>;

/**
 * Loose superset of the company row's supplier-portal subset. The page passes
 * the DB row directly; null-coalescing below converts DB nulls into the
 * defaults that React Hook Form / shadcn inputs expect.
 */
export interface SecurityProfileInitialValues {
  // Profile metadata
  primaryDomain?: string | null;
  tagline?: string | null;
  description?: string | null;
  incidentContactEmail?: string | null;
  incidentContactPhone?: string | null;
  // Identity
  legalName?: string | null;
  registeredAddress?: string | null;
  country?: string | null;
  securityContactName?: string | null;
  bsiRegistrationId?: string | null;
  // CIR §5.1.4 universal facts
  hasIsms?: boolean | null;
  hasIso27001OrEquivalent?: boolean | null;
  staffSecurityTraining?: boolean | null;
  backgroundChecks?: boolean | null;
  vulnerabilityHandling?: boolean | null;
  // NIS2 Art 21(2) / CIR §5.1 baseline practices
  securityPolicyReviewedAnnually?: boolean | null;
  hasIncidentResponsePlan?: boolean | null;
  hasBusinessContinuityPlan?: boolean | null;
  hasCryptographyPolicy?: boolean | null;
  hasPrivilegedAccessMgmt?: boolean | null;
  mfaEnforcedInternal?: boolean | null;
  hasAssetInventory?: boolean | null;
  hasPenetrationTestingProgram?: boolean | null;
  // ENISA TIG §5 — universal company-wide
  cooperateWithAuthorities?: boolean | null;
  pastBreachesDisclosed?: boolean | null;
}

interface SecurityProfileFormProps {
  initialValues: SecurityProfileInitialValues;
  /** Last save timestamp — surfaced as a "saved at" hint above the form. */
  lastSavedAt: Date | null;
  /** Edit mode shows save button + writable fields; view mode is read-only. */
  mode: "edit" | "view";
  /**
   * Optional list of field names to hide. The supplier portal sub-pages
   * (Profile, Security practices) each pass the OPPOSITE list so each page
   * only renders its own slice of the unified schema. The customer view at
   * /supplier-access/{token} omits this prop and shows everything in one
   * scroll because they have no nav.
   */
  omit?: string[];
}

export function SecurityProfileForm({
  initialValues,
  lastSavedAt,
  mode,
  omit,
}: SecurityProfileFormProps) {
  const router = useRouter();
  const t = useTranslations("supplierPortal.questionnaire");

  const saveMutation = trpc.supplierPortal.profile.save.useMutation({
    onSuccess: () => {
      toast.success(t("saved"));
      router.refresh();
    },
    onError: () => {
      toast.error(t("saveError"));
    },
  });

  /**
   * Field overrides — labels and descriptions are auto-resolved from
   * messages/supplierPortal/*.json via the translationNamespace prop, so we
   * only need overrides for grouping (section headers).
   */
  const fieldOverrides: Record<string, FieldOverride> = {
    // ── Identity (CIR §5.2 + ENISA TIG §5.2 supplier register) ──
    legalName: { group: t("sectionIdentity") },
    registeredAddress: { group: t("sectionIdentity"), colSpan: 2 },
    country: { group: t("sectionIdentity") },
    primaryDomain: { group: t("sectionIdentity") },
    securityContactName: { group: t("sectionIdentity") },
    bsiRegistrationId: { group: t("sectionIdentity") },
    tagline: { group: t("sectionIdentity"), colSpan: 2 },
    description: { group: t("sectionIdentity"), colSpan: 2 },

    // ── Customer-facing incident contact ──
    incidentContactEmail: { group: t("sectionIncidentContact") },
    incidentContactPhone: { group: t("sectionIncidentContact") },

    // ── CIR §5.1.4 universal facts about the company ──
    hasIsms: { group: t("sectionContract") },
    hasIso27001OrEquivalent: { group: t("sectionContract") },
    staffSecurityTraining: { group: t("sectionContract") },
    backgroundChecks: { group: t("sectionContract") },
    vulnerabilityHandling: { group: t("sectionContract") },

    // ── NIS2 Art 21(2) / CIR §5.1 baseline practices ──
    securityPolicyReviewedAnnually: { group: t("sectionBaseline") },
    hasIncidentResponsePlan: { group: t("sectionBaseline") },
    hasBusinessContinuityPlan: { group: t("sectionBaseline") },
    hasCryptographyPolicy: { group: t("sectionBaseline") },
    hasPrivilegedAccessMgmt: { group: t("sectionBaseline") },
    mfaEnforcedInternal: { group: t("sectionBaseline") },
    hasAssetInventory: { group: t("sectionBaseline") },
    hasPenetrationTestingProgram: { group: t("sectionBaseline") },

    // ── ENISA TIG §5 — universal company-wide declarations ──
    cooperateWithAuthorities: { group: t("sectionContractTips") },
    pastBreachesDisclosed: { group: t("sectionContractTips") },
  };

  async function handleSubmit(data: Record<string, unknown>) {
    // SchemaForm has already passed `data` through zodResolver(securityProfileUpdateSchema),
    // so the cast is safe — the runtime shape matches the inferred type.
    await saveMutation.mutateAsync(data as ProfileValues);
  }

  // Defaults: text fields → "" (controlled inputs), booleans → false.
  const defaults: ProfileValues = {
    // Profile metadata
    primaryDomain: initialValues.primaryDomain ?? "",
    tagline: initialValues.tagline ?? "",
    description: initialValues.description ?? "",
    incidentContactEmail: initialValues.incidentContactEmail ?? "",
    incidentContactPhone: initialValues.incidentContactPhone ?? "",
    // Identity
    legalName: initialValues.legalName ?? "",
    registeredAddress: initialValues.registeredAddress ?? "",
    country: initialValues.country ?? "",
    securityContactName: initialValues.securityContactName ?? "",
    bsiRegistrationId: initialValues.bsiRegistrationId ?? "",
    // CIR §5.1.4 universal facts
    hasIsms: initialValues.hasIsms ?? false,
    hasIso27001OrEquivalent: initialValues.hasIso27001OrEquivalent ?? false,
    staffSecurityTraining: initialValues.staffSecurityTraining ?? false,
    backgroundChecks: initialValues.backgroundChecks ?? false,
    vulnerabilityHandling: initialValues.vulnerabilityHandling ?? false,
    // NIS2 Art 21(2) / CIR §5.1 baseline practices
    securityPolicyReviewedAnnually:
      initialValues.securityPolicyReviewedAnnually ?? false,
    hasIncidentResponsePlan: initialValues.hasIncidentResponsePlan ?? false,
    hasBusinessContinuityPlan: initialValues.hasBusinessContinuityPlan ?? false,
    hasCryptographyPolicy: initialValues.hasCryptographyPolicy ?? false,
    hasPrivilegedAccessMgmt: initialValues.hasPrivilegedAccessMgmt ?? false,
    mfaEnforcedInternal: initialValues.mfaEnforcedInternal ?? false,
    hasAssetInventory: initialValues.hasAssetInventory ?? false,
    hasPenetrationTestingProgram:
      initialValues.hasPenetrationTestingProgram ?? false,
    // ENISA TIG §5 — universal company-wide
    cooperateWithAuthorities: initialValues.cooperateWithAuthorities ?? false,
    pastBreachesDisclosed: initialValues.pastBreachesDisclosed ?? false,
  };

  return (
    <div className="space-y-6">
      {lastSavedAt && (
        <div className="text-xs text-muted-foreground">
          {t("savedAt", { time: new Date(lastSavedAt).toLocaleString() })}
        </div>
      )}
      <SchemaForm
        schema={securityProfileUpdateSchema}
        translationNamespace="supplierPortal"
        fieldOverrides={fieldOverrides}
        defaultValues={defaults}
        columns={2}
        submitLabel={t("save")}
        isSubmitting={saveMutation.isPending}
        onSubmit={handleSubmit}
        disabled={mode === "view"}
        omit={omit}
      />
    </div>
  );
}
