/**
 * SecurityProfilePage — read-only customer view rendered at
 * /supplier-access/[token].
 *
 * Renders the supplier's company-level identity + universal practices +
 * certifications. Per-customer contract clauses and per-asset technical
 * declarations are surfaced separately by the supplier-access page (it
 * fetches the relationship + assets from the same public.getByToken call).
 *
 * The supplier-side edit experience lives on dedicated routes:
 *   /portal/supplier/profile           → identity + contacts
 *   /portal/supplier/practices         → company-wide ISMS / NIS2 baseline
 *   /portal/supplier/certifications    → cert uploads
 *   /portal/supplier/customers/[id]/*  → per-customer assets/incidents/access
 *
 * Server component — receives the data already loaded by the route.
 */
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import {
  SecurityProfileForm,
  type SecurityProfileInitialValues,
} from "./SecurityProfileForm";
import {
  CertificationsSection,
  type CertRow,
} from "./CertificationsSection";

interface SecurityProfilePageProps {
  /** The supplier-portal subset of the company row. */
  profile: SecurityProfileInitialValues & {
    practicesLastSavedAt?: Date | null;
  };
  certifications: CertRow[];
  /**
   * Legacy prop kept for compatibility — customers always see no sharing
   * controls and the supplier no longer renders this component, so the
   * argument is ignored. Remove on the next refactor.
   */
  customers?: unknown[];
  mode: "edit" | "view";
  /** Optional title shown in the page header (e.g. supplier company name). */
  supplierName?: string | null;
}

export async function SecurityProfilePage({
  profile,
  certifications,
  mode,
  supplierName,
}: SecurityProfilePageProps) {
  const t = await getTranslations("supplierPortal.customerView");
  // ENISA TIG §5.1.2 selection-criteria shortcut: if the supplier has filled
  // in their own BSI registration ID, they are themselves directly regulated
  // under NIS2 — meaning the customer can shortcut a chunk of supplier
  // selection criteria. Surfaced as a prominent green badge in view mode so
  // the customer notices it immediately.
  const isNis2Regulated = !!profile.bsiRegistrationId?.trim();

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {supplierName && (
        <header className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("securityProfile")}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {supplierName}
          </h1>
          {isNis2Regulated && (
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-200">
              <ShieldCheck className="h-3 w-3" />
              {t("nis2Regulated")}
              <span className="text-green-700 dark:text-green-300 font-mono">
                · BSI {profile.bsiRegistrationId}
              </span>
            </div>
          )}
          {mode === "view" && isNis2Regulated && (
            <p className="text-xs text-muted-foreground max-w-2xl">
              {t("nis2RegulatedNote")}
            </p>
          )}
        </header>
      )}

      <SecurityProfileForm
        initialValues={profile}
        lastSavedAt={profile.practicesLastSavedAt ?? null}
        mode={mode}
      />

      <hr className="border-muted" />

      <CertificationsSection
        certifications={certifications}
        readOnly={mode === "view"}
      />
    </div>
  );
}
