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
} from "drizzle-orm/pg-core";
import { entityTypeEnum } from "@nisd2/grc-data-model/enums";
import { aiDataSharingEnum, planEnum } from "../enums";

// ---------------------------------------------------------------------------
// Companies — Regulated entities registered on the platform
// ---------------------------------------------------------------------------

export const company = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
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
