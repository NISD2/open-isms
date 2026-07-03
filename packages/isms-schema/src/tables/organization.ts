/**
 * Organization — Companies and their users
 *
 * The root entities of the platform. Every other table traces back here.
 * A company can act as a NIS2 entity, as a supplier (security data publisher),
 * or both. Roles are tracked via boolean flags so the same login flips between
 * portals without creating parallel row identities.
 *
 * Framework-specific extensions (BSI registration, DSGVO controller info, etc.)
 * live in their respective modules under schema/modules/.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  decimal,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { entityTypeEnum } from "@nisd2/grc-data-model/enums";
import { aiDataSharingEnum, planEnum } from "../enums";

// ---------------------------------------------------------------------------
// Companies — Regulated entities registered on the platform
// ---------------------------------------------------------------------------

export const company = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * The account that owns this organization (its creator). Deleting the owner
   * tears down the whole org and every member; deleting a non-owner member
   * removes only that person. onDelete "set null" so an owner-teardown, which
   * deletes the owner's user row, does not FK-block the subsequent company
   * delete. Nullable: legacy orgs are backfilled to their earliest admin.
   */
  ownerId: uuid("owner_id").references((): AnyPgColumn => user.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  legalForm: varchar("legal_form", { length: 100 }), // GmbH, AG, KG, etc.
  sector: varchar("sector", { length: 255 }).notNull(),
  subSector: varchar("sub_sector", { length: 255 }),
  entityType: entityTypeEnum("entity_type").notNull(),

  // Size (determines entity classification + fine caps)
  employeeCount: integer("employee_count"),
  annualRevenue: decimal("annual_revenue", { precision: 15, scale: 2 }),
  globalTurnover: decimal("global_turnover", { precision: 15, scale: 2 }),

  // Contact
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),

  // Company profile (referenced across requirements)
  cisoName: varchar("ciso_name", { length: 255 }),
  cisoReportsTo: varchar("ciso_reports_to", { length: 255 }),
  bsiContactName: varchar("bsi_contact_name", { length: 255 }),
  bsiContactEmail: varchar("bsi_contact_email", { length: 255 }),
  bsiContactPhone: varchar("bsi_contact_phone", { length: 50 }),
  bsiRegistrationId: varchar("bsi_registration_id", { length: 100 }),
  annualSecurityBudget: decimal("annual_security_budget", { precision: 15, scale: 2 }),
  primaryLocations: varchar("primary_locations", { length: 1000 }),

  // Billing
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),

  // AI settings
  aiDataSharing: aiDataSharingEnum("ai_data_sharing").default("none").notNull(),

  // Notification settings
  timezone: varchar("timezone", { length: 100 }).default("Europe/Berlin"),
  digestTime: varchar("digest_time", { length: 5 }).default("08:00"),

  // ─────────────────────────────────────────────────────────────────────────
  // Role flags — a company can act as either, both, or neither.
  // The flags only decide which UIs surface which fields; the underlying
  // company facts (legal name, ISMS, encryption, etc.) live as plain columns
  // below — same row, two perspectives.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Acts as a NIS2 / BSIG-regulated entity. The entity portal sets this to
   * true explicitly via assessment.createCompanyAndAssessment. Defaults to
   * false so a supplier-only signup never gets silently flagged as a NIS2
   * entity (most suppliers are not directly regulated under NIS2).
   */
  actsAsNis2Entity: boolean("acts_as_nis2_entity").default(false).notNull(),
  /**
   * Acts as a supplier publishing security data to invited customers.
   * Flipped on first save in the supplier portal (profile.save) or set
   * explicitly via supplierPortal.onboarding.bootstrap.
   */
  actsAsSupplier: boolean("acts_as_supplier").default(false).notNull(),

  // ─────────────────────────────────────────────────────────────────────────
  // Public identity (CIR 2024/2690 §5.2 supplier register equivalent)
  // Universal company facts. Surfaced in the supplier portal customer view
  // and may be surfaced in the entity portal in future.
  // ─────────────────────────────────────────────────────────────────────────

  /** Legal name as it appears in registers. Distinct from `name` (display). */
  legalName: varchar("legal_name", { length: 255 }),
  registeredAddress: varchar("registered_address", { length: 500 }),
  /** ISO 3166-1 alpha-2 country code. */
  country: varchar("country", { length: 2 }),
  /** Primary FQDN (lowercased). Used by the supplier portal for identity. */
  primaryDomain: varchar("primary_domain", { length: 255 }),
  /** Public-facing one-line description. Surfaced in the supplier portal customer view. */
  tagline: varchar("tagline", { length: 255 }),
  /** Public-facing long description. */
  description: text("description"),
  /** S3 key of the company logo. */
  logoStorageKey: varchar("logo_storage_key", { length: 500 }),

  // ─────────────────────────────────────────────────────────────────────────
  // Customer-facing incident contact (distinct from BSI contact above)
  // ─────────────────────────────────────────────────────────────────────────

  /** Named security contact for incident notification chain (CIR §5.1.4(d)). */
  securityContactName: varchar("security_contact_name", { length: 255 }),
  /** Customer-facing incident contact email. Different audience than bsiContactEmail. */
  incidentContactEmail: varchar("incident_contact_email", { length: 255 }),
  incidentContactPhone: varchar("incident_contact_phone", { length: 50 }),

  // ─────────────────────────────────────────────────────────────────────────
  // CIR 2024/2690 §5.1 / BSIG §30 universal company practices.
  // Truth about the supplier's own ISMS — same answer for every customer.
  // Per-customer contract clauses live on the supplier (relationship) row.
  // ─────────────────────────────────────────────────────────────────────────

  /** CIR §5.1.2(a) / BSIG §30 — documented information security management system. */
  hasIsms: boolean("has_isms"),
  /** CIR §5.1.2(b) — ISO 27001 / BSI Grundschutz / equivalent (cert via certification table). */
  hasIso27001OrEquivalent: boolean("has_iso_27001_or_equivalent"),
  /** CIR §5.1.4(b) — staff awareness, skills, training. */
  staffSecurityTraining: boolean("staff_security_training"),
  /** CIR §5.1.4(c) — verification of staff background. */
  backgroundChecks: boolean("background_checks"),
  /** CIR §5.1.4(f) — vulnerability handling that present a risk. */
  vulnerabilityHandling: boolean("vulnerability_handling"),

  // ─────────────────────────────────────────────────────────────────────────
  // NIS2 Art. 21(2) / CIR §5.1 universal baseline practices
  // Every supplier needs these to support a NIS2 entity's compliance.
  // ─────────────────────────────────────────────────────────────────────────

  /** CIR §5.1.1(c) — security policies reviewed at least annually. */
  securityPolicyReviewedAnnually: boolean("security_policy_reviewed_annually"),
  /** CIR §5.1.3 / NIS2 Art 21(2)(b) — documented incident response plan. */
  hasIncidentResponsePlan: boolean("has_incident_response_plan"),
  /** CIR §5.1.5 / NIS2 Art 21(2)(c) — documented business continuity / disaster recovery plan. */
  hasBusinessContinuityPlan: boolean("has_business_continuity_plan"),
  /** CIR §5.1.6 / NIS2 Art 21(2)(h) — documented cryptography policy. */
  hasCryptographyPolicy: boolean("has_cryptography_policy"),
  /** CIR §5.1.7 / NIS2 Art 21(2)(i) — privileged access management for internal staff. */
  hasPrivilegedAccessMgmt: boolean("has_privileged_access_mgmt"),
  /** NIS2 Art 21(2)(j) — MFA enforced for internal admin / privileged accounts. */
  mfaEnforcedInternal: boolean("mfa_enforced_internal"),
  /** CIR §5.1.8 / NIS2 Art 21(2)(i) — maintain an asset inventory. */
  hasAssetInventory: boolean("has_asset_inventory"),
  /** CIR §5.1.12 — annual or biennial penetration testing program. */
  hasPenetrationTestingProgram: boolean("has_penetration_testing_program"),

  // ─────────────────────────────────────────────────────────────────────────
  // ENISA TIG §5 — Company-wide supplier declarations.
  // Service-specific declarations (description, data locations) live on
  // `asset`. Per-customer contract clauses (right-to-audit, exit plan,
  // notify-on-location-change, etc.) live on `supplier`. Only universal
  // truths about the company stay here.
  // ─────────────────────────────────────────────────────────────────────────

  /** ENISA TIG §5.1.4 TIPS — supplier obligation to fully cooperate with competent authorities (BSI, ENISA, national CSIRTs). */
  cooperateWithAuthorities: boolean("cooperate_with_authorities"),
  /** ENISA TIG §5.1.2 selection criteria — supplier discloses past notifiable cybersecurity events / breaches when asked. */
  pastBreachesDisclosed: boolean("past_breaches_disclosed"),

  // ─────────────────────────────────────────────────────────────────────────
  // Profile-section extensions — ENISA TIG §5.2(b), §5.1.4 TIPS, NIS 2 Art. 23
  // Service-type toggles (isSaas, isOnPrem, isProfessionalServices,
  // isManagedService) drive the conditional technical sections below.
  // Architectural note: schema's ENISA TIG §5 model is flat per-supplier.
  // The asset table is the long-term home for per-service technical
  // declarations; for MVP everything lives here as a single profile.
  // ─────────────────────────────────────────────────────────────────────────
  /** ENISA TIG §5.2(b) + §5.1.4 TIPS — clear description of ICT products/services. */
  serviceDescription: text("service_description"),
  /** ENISA TIG §5.1.4 TIPS — comma-separated countries where customer data is processed. */
  dataProcessingLocations: varchar("data_processing_locations", { length: 1000 }),
  /** NIS 2 Art. 23 — max hours from detection to customer notification. */
  incidentSlaHours: integer("incident_sla_hours"),
  /** Service-type toggles — ENISA TIG §5.2(b). */
  isSaas: boolean("is_saas"),
  isOnPrem: boolean("is_on_prem"),
  isProfessionalServices: boolean("is_professional_services"),
  isManagedService: boolean("is_managed_service"),
  /** NIS 2 Art. 21(2)(d) — supplier uses/integrates/provides AI systems. */
  usesAiSystems: boolean("uses_ai_systems"),

  // ─────────────────────────────────────────────────────────────────────────
  // Security-practices-section extensions — CIR §5.1.4, GDPR Art. 28, ENISA TIG §5.1.4 TIPS
  // ─────────────────────────────────────────────────────────────────────────
  /** CIR 2024/2690 §5.1.4(e) — accepts customer right to audit or provides substitute reports. */
  acceptRightToAudit: boolean("accept_right_to_audit"),
  /** CIR 2024/2690 §5.1.4(g) — uses subprocessors / sub-suppliers. */
  hasSubprocessors: boolean("has_subprocessors"),
  /** CIR 2024/2690 §5.1.4(g) — list of subprocessors (rendered when hasSubprocessors). */
  subprocessorList: text("subprocessor_list"),
  /** CIR 2024/2690 §5.1.4(h) — return / destroy customer data on termination. */
  dataReturnOnTermination: boolean("data_return_on_termination"),
  /** GDPR Art. 28 — standard data processing agreement available. */
  dpaAvailable: boolean("dpa_available"),
  /** ENISA TIG §5.1.4 TIPS — assists customers during incidents at no / ex-ante cost. */
  incidentAssistanceCommitment: boolean("incident_assistance_commitment"),
  /** ENISA TIG §5.1.4 TIPS — notifies customers of material changes affecting service. */
  notifyMaterialChanges: boolean("notify_material_changes"),
  /** ENISA TIG §5.1.4 TIPS — notifies customers in advance of data-processing location changes. */
  notifyOnLocationChange: boolean("notify_on_location_change"),
  /** ENISA TIG §5.1.4 TIPS — documented exit strategy with transition period. */
  hasExitPlan: boolean("has_exit_plan"),
  /** NIS 2 Art. 21(2)(d) — provides SBOM-for-AI per G7 minimum elements. */
  providesSbomForAi: boolean("provides_sbom_for_ai"),
  /** URL to the SBOM-for-AI document. */
  aiSbomUrl: varchar("ai_sbom_url", { length: 500 }),

  // ─────────────────────────────────────────────────────────────────────────
  // SaaS technical (rendered when isSaas) — BSI IT-Grundschutz OPS.2.2, NIS 2 Art. 21(2)(h)/(j)
  // ─────────────────────────────────────────────────────────────────────────
  saasHostingRegion: varchar("saas_hosting_region", { length: 255 }),
  saasEncryptionAtRest: boolean("saas_encryption_at_rest"),
  saasEncryptionInTransit: boolean("saas_encryption_in_transit"),
  saasMfaEnforced: boolean("saas_mfa_enforced"),
  saasRtoHours: integer("saas_rto_hours"),

  // ─────────────────────────────────────────────────────────────────────────
  // On-prem technical (rendered when isOnPrem) — CRA / NIS 2 Art. 21(2)(d)/(e)
  // ─────────────────────────────────────────────────────────────────────────
  onPremSbomProvided: boolean("on_prem_sbom_provided"),
  onPremSignedReleases: boolean("on_prem_signed_releases"),
  onPremVulnerabilityDisclosurePolicy: boolean("on_prem_vulnerability_disclosure_policy"),
  onPremPatchSlaCriticalHours: integer("on_prem_patch_sla_critical_hours"),

  // ─────────────────────────────────────────────────────────────────────────
  // Professional services (rendered when isProfessionalServices) — BSI ORP.2/ORP.3
  // ─────────────────────────────────────────────────────────────────────────
  proServicesBackgroundCheckScope: varchar("pro_services_background_check_scope", { length: 500 }),
  proServicesNdaInPlace: boolean("pro_services_nda_in_place"),
  proServicesCustomerPremisesPolicy: boolean("pro_services_customer_premises_policy"),

  // ─────────────────────────────────────────────────────────────────────────
  // Managed services (rendered when isManagedService) — BSI ORP.4 / DER.2.1, NIS 2 Art. 21(2)(f)
  // ─────────────────────────────────────────────────────────────────────────
  managedPrivilegedAccessMgmt: boolean("managed_privileged_access_mgmt"),
  managedSessionRecording: boolean("managed_session_recording"),
  managedOnCall24x7: boolean("managed_on_call_24x7"),

  /** Denormalized timestamp of last supplier-portal Security Practices save — surfaced as a "saved at" hint in the UI. */
  practicesLastSavedAt: timestamp("questionnaire_last_saved_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Users — Platform accounts (not the company workforce, just login users)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => company.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: varchar("role", { length: 100 }).notNull(),
  jobTitle: varchar("job_title", { length: 255 }),
  isManagement: boolean("is_management").default(false),
  /**
   * When the user proved control of this email address. Set by:
   *  - signup OTP verification (Credentials registration flow)
   *  - Google OAuth signin (Google has already verified profile.email_verified)
   * NULL = pending verification, blocks Credentials login but not Google.
   * Existing users at migration time are backfilled to `createdAt`.
   */
  emailVerifiedAt: timestamp("email_verified_at"),
  /**
   * Set at registration time if the email domain matches the vendored
   * disposable-email blocklist. We still create the user record so we can
   * see scoping/bot signups in the admin panel, but the OTP is never sent
   * and the account can never be verified.
   */
  isDisposableEmail: boolean("is_disposable_email").default(false).notNull(),
  phone: varchar("phone", { length: 50 }),
  /**
   * Per-user opt-out for non-essential follow-up emails (course reminders,
   * future research questions). Transactional emails (invites, deadline
   * reminders, incident notifications) are not gated by this flag — only
   * emails sent from soft-touch crons like /api/cron/course-reminders.
   * Flipped via /api/email/unsubscribe?u=...&t=... HMAC-signed URL.
   */
  emailFollowupsDisabled: boolean("email_followups_disabled").default(false).notNull(),
  /**
   * Session revocation counter (audit M-1, 2026-06-10). Stamped into the
   * JWT at sign-in; compared on every getSession. Bumped on password
   * reset (and on any future "sign out of all devices" action) so a
   * leaked JWT stops working the moment the legitimate user rotates
   * credentials. Defaults to 1 so existing tokens at migration time
   * stay valid until first rotation.
   */
  sessionVersion: integer("session_version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_company").on(table.companyId),
]);
