/**
 * Platform Defaults — Pre-filled form values for platform-satisfied requirements.
 *
 * When the platform itself IS the mechanism for a requirement (e.g., dashboard
 * provides oversight, audit trail proves governance), these defaults pre-fill
 * the intake form fields. Users can edit or expand them.
 *
 * Keyed by requirement code → field key → default value.
 * Merged server-side: saved answers always override these defaults.
 */
export const PLATFORM_DEFAULTS: Record<string, Record<string, unknown>> = {
  "1.3": {
    annualSecurityBudget: "25000",
  },
  // CIR 12 — platform IS the asset register
  "2.2": {
    classificationLevels: "3_levels",
  },
  // BSI 200-3 defaults — 90% of German SMEs will just confirm
  "2.1": {
    methodology: "bsi_200_3",
    likelihoodScale: "4_level",
    impactScale: "4_level",
    riskAcceptanceThreshold: "Mittel oder darunter",
  },
  // §32 legal maximum for BSI early warning
  "3.3": {
    earlyWarningSlaHours: 24,
  },
  // 9.2 → asset enrichment (per-asset crypto fields, no intake defaults)
  // RBAC is the SME standard
  "10.1": {
    accessControlModel: "rbac",
  },
  // Safer default — most SMEs are "important" not "essential"
  "12.1": {
    entityClassification: "important",
  },
};
