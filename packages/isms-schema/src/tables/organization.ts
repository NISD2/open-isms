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

import { entityTypeEnum } from "@nisd2/grc-data-model/enums";
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  accessLevelEnum,
  aiDataSharingEnum,
  dataProcessingAgreementEnum,
  journeyModeEnum,
  planEnum,
  settledFactEnum,
} from "../enums";

// ---------------------------------------------------------------------------
// Billing accounts — The paying customer, above its companies
// ---------------------------------------------------------------------------

/**
 * One payment covers every company under the account, so what a company may use is decided here
 * and inherited by each company that points at it.
 *
 * Billing name, address and VAT number are deliberately absent: they live on the Qonto client, and
 * `qontoClientId` is the reference to it. The access level is kept here because it is our own
 * authorisation decision, read on every request, not a copy of anything Qonto holds.
 */
export const billingAccount = pgTable("billing_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** The person who pays and may cancel. Survives their deletion as null, like `company.ownerId`. */
  ownerUserId: uuid("owner_user_id").references((): AnyPgColumn => user.id, {
    onDelete: "set null",
  }),
  /** Null until the first order creates or finds the customer in Qonto. */
  qontoClientId: varchar("qonto_client_id", { length: 64 }).unique(),
  accessLevel: accessLevelEnum("access_level").default("free").notNull(),
  /** Set when the customer cancels after the thirty days: access runs out, nothing renews. */
  renewalCanceledAt: timestamp("renewal_canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
  ownerId: uuid("owner_id").references((): AnyPgColumn => user.id, {
    onDelete: "set null",
  }),
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

  // ---------------------------------------------------------------------------
  // Guided-form status facts — the only answers that change WHICH duties apply
  //
  // Read on every step, asked once. Everything else the form needs is read from the registers the
  // company fills anyway, because filling them is itself several of the requirements.
  // ---------------------------------------------------------------------------

  /**
   * Whether this company operates a critical installation over the threshold set for its
   * installation type. It follows from the numbers in the Rechtsverordnung, not from anyone being
   * told: § 28 Abs. 1 Nr. 1 BSIG says such operators "gelten" as besonders wichtige Einrichtungen,
   * and § 33 Abs. 3 lets the BSI register an entity that failed to register itself. Defaults to
   * "unsettled" so an unmeasured threshold leaves §§ 31 Abs. 2 and 39 Abs. 1 open rather than off.
   */
  criticalInstallation: settledFactEnum("critical_installation")
    .notNull()
    .default("unsettled"),

  /**
   * Which of the twelve singled-out service types this company provides TO OTHERS and is in scope
   * as. Using a managed service provider is not being one; the applicability classifier settles
   * that. Null means unsettled, an empty array means none.
   *
   * Two statutory lists read this: § 60 Abs. 1 Satz 1, which § 34 points at for the special
   * registration duty, and § 30 Abs. 3, which gives the EU implementing act precedence over
   * § 30 Abs. 2. They differ by two entries, so one boolean cannot serve both.
   */
  serviceTypes: text("service_types").array(),

  // Billing
  /** The paying customer this company belongs to. Every company has one. */
  billingAccountId: uuid("billing_account_id")
    .notNull()
    .references((): AnyPgColumn => billingAccount.id),
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),

  // AI settings
  aiDataSharing: aiDataSharingEnum("ai_data_sharing").default("none").notNull(),

  /**
   * Journey layout. Nullable on purpose: NULL means nobody has answered yet,
   * which is what makes the journey ask the one-question interstitial instead
   * of guessing. Company-level rather than per-user because the answer states
   * a fact about the company (how many people implement), not a personal
   * preference, and a second per-user copy would be the same fact stored twice.
   */
  journeyMode: journeyModeEnum("journey_mode"),

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
  // Supplier questionnaire answers: what this company states about itself as a
  // supplier, the same for every customer. Each column is named after its
  // question in @nisd2/nis2-supply-chain-questionnaire-schema, which says what
  // it asks and on which legal basis. Per-customer contract clauses live on the
  // supplier (relationship) row.
  // ─────────────────────────────────────────────────────────────────────────

  /** Legal name as it appears in registers. Distinct from `name` (display). */
  legalName: varchar("legal_name", { length: 255 }),
  registeredAddress: varchar("registered_address", { length: 500 }),
  /** ISO 3166-1 alpha-2 country code. */
  country: varchar("country", { length: 2 }),
  /** Primary FQDN (lowercased). */
  primaryDomain: varchar("primary_domain", { length: 255 }),
  /** S3 key of the company logo. */
  logoStorageKey: varchar("logo_storage_key", { length: 500 }),
  serviceDescription: text("service_description"),
  dataProcessingLocations: varchar("data_processing_locations", { length: 1000 }),
  /** The customer-facing incident contact, distinct from the BSI contact above. */
  securityContactName: varchar("security_contact_name", { length: 255 }),
  incidentContactEmail: varchar("incident_contact_email", { length: 255 }),
  incidentContactPhone: varchar("incident_contact_phone", { length: 50 }),
  incidentSlaHours: integer("incident_sla_hours"),

  // What the supplier reaches at its customers, which decides the questions that follow.
  isSaas: boolean("is_saas"),
  isOnPrem: boolean("is_on_prem"),
  isManagedService: boolean("is_managed_service"),
  processesCustomerData: boolean("processes_customer_data"),
  accessesCustomerSystems: boolean("accesses_customer_systems"),
  accessesCustomerPremises: boolean("accesses_customer_premises"),

  staffSecurityTraining: boolean("staff_security_training"),
  acceptRightToAudit: boolean("accept_right_to_audit"),
  hasSubprocessors: boolean("has_subprocessors"),
  subprocessorList: text("subprocessor_list"),
  subprocessorRequirementsPassedOn: boolean("subprocessor_requirements_passed_on"),
  notifyMaterialChanges: boolean("notify_material_changes"),
  pastBreachesDisclosed: boolean("past_breaches_disclosed"),
  cooperateWithAuthorities: boolean("cooperate_with_authorities"),
  confidentialityCommitted: boolean("confidentiality_committed"),
  backgroundChecks: boolean("background_checks"),
  dataReturnOnTermination: boolean("data_return_on_termination"),
  dataProcessingAgreement: dataProcessingAgreementEnum("data_processing_agreement"),
  encryptionAtRest: boolean("encryption_at_rest"),
  encryptionInTransit: boolean("encryption_in_transit"),
  hasIsms: boolean("has_isms"),
  /**
   * The certificates themselves (standard, issuer, validity, scope, file) live in
   * company_certification, which also answers the package's `certificationDetails`.
   */
  hasIso27001OrEquivalent: boolean("has_iso_27001_or_equivalent"),
  vulnerabilityHandling: boolean("vulnerability_handling"),
  hasIncidentResponsePlan: boolean("has_incident_response_plan"),
  hasBusinessContinuityPlan: boolean("has_business_continuity_plan"),
  mfaEnforcedInternal: boolean("mfa_enforced_internal"),
  hasPenetrationTestingProgram: boolean("has_penetration_testing_program"),
  secureDevelopment: boolean("secure_development"),
  vulnerabilityDisclosurePolicy: boolean("vulnerability_disclosure_policy"),
  customerAccessPersonalMfa: boolean("customer_access_personal_mfa"),
  customerAccessLogged: boolean("customer_access_logged"),
  premisesAccessManaged: boolean("premises_access_managed"),
  premisesConductRules: boolean("premises_conduct_rules"),
  saasMfaEnforced: boolean("saas_mfa_enforced"),
  saasRtoHours: integer("saas_rto_hours"),
  onPremSupportEnd: varchar("on_prem_support_end", { length: 255 }),
  onPremPatchSlaCriticalHours: integer("on_prem_patch_sla_critical_hours"),
  onPremSbomProvided: boolean("on_prem_sbom_provided"),
  onPremSignedReleases: boolean("on_prem_signed_releases"),

  // No longer asked (questionnaire 4.0.0). Kept so earlier answers survive, and
  // so the release before can still read and write them while a deploy runs.
  tagline: varchar("tagline", { length: 255 }),
  description: text("description"),
  isProfessionalServices: boolean("is_professional_services"),
  usesAiSystems: boolean("uses_ai_systems"),
  securityPolicyReviewedAnnually: boolean("security_policy_reviewed_annually"),
  hasCryptographyPolicy: boolean("has_cryptography_policy"),
  hasPrivilegedAccessMgmt: boolean("has_privileged_access_mgmt"),
  hasAssetInventory: boolean("has_asset_inventory"),
  dpaAvailable: boolean("dpa_available"),
  incidentAssistanceCommitment: boolean("incident_assistance_commitment"),
  notifyOnLocationChange: boolean("notify_on_location_change"),
  hasExitPlan: boolean("has_exit_plan"),
  providesSbomForAi: boolean("provides_sbom_for_ai"),
  aiSbomUrl: varchar("ai_sbom_url", { length: 500 }),
  saasHostingRegion: varchar("saas_hosting_region", { length: 255 }),
  saasEncryptionAtRest: boolean("saas_encryption_at_rest"),
  saasEncryptionInTransit: boolean("saas_encryption_in_transit"),
  onPremVulnerabilityDisclosurePolicy: boolean("on_prem_vulnerability_disclosure_policy"),
  proServicesBackgroundCheckScope: varchar("pro_services_background_check_scope", {
    length: 500,
  }),
  proServicesNdaInPlace: boolean("pro_services_nda_in_place"),
  proServicesCustomerPremisesPolicy: boolean("pro_services_customer_premises_policy"),
  managedPrivilegedAccessMgmt: boolean("managed_privileged_access_mgmt"),
  managedSessionRecording: boolean("managed_session_recording"),
  managedOnCall24x7: boolean("managed_on_call_24x7"),

  /** Denormalized timestamp of last supplier-portal Security Practices save — surfaced as a "saved at" hint in the UI. */
  practicesLastSavedAt: timestamp("questionnaire_last_saved_at"),
  /**
   * When the company that runs this instance was added to this company's supplier list
   * (lib/supplier-portal/platform-supplier.ts). Set once; a row the company deletes afterwards
   * stays deleted, because this says it was offered already.
   */
  platformSupplierLinkedAt: timestamp("platform_supplier_linked_at"),

  /**
   * Onboarding lifecycle discriminator. NULL = a draft shell (auto-provisioned
   * at email verification with placeholder name/sector and entity type
   * "important"; the NIS2 assessment is seeded so the journey renders, but no
   * deadlines/reminders yet). Stamped by activateCompany once the user confirms
   * name/sector/entity type. Single source of truth for "draft vs activated"
   * across the join guards, admin metrics, and activatedCompanyProcedure.
   */
  activatedAt: timestamp("activated_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Users — Platform accounts (not the company workforce, just login users)
// ---------------------------------------------------------------------------

/** The campaign tags a signup keeps from the page it started from. */
export const SIGNUP_CAMPAIGN_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type SignupCampaign = Partial<
  Record<(typeof SIGNUP_CAMPAIGN_KEYS)[number], string>
>;

export const user = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => company.id),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    /**
     * The one Google account (its OIDC `sub`) that may sign in here. Google lets more than one of
     * its accounts claim the same verified address, so the address alone would let any of them in.
     * Recorded at the first Google sign-in and compared on every later one (lib/auth/google-link.ts).
     * NULL for accounts that have not signed in with Google since the column shipped; they bind on
     * their next Google sign-in.
     */
    googleSubject: varchar("google_subject", { length: 255 }),
    /**
     * Superseded by `company_membership.role` and no longer read or written. Kept, with a default,
     * for one more release, because the previous release still writes it during a deploy; the
     * release after this one drops it.
     */
    role: varchar("role", { length: 100 }).notNull().default("member"),
    /** Superseded by `company_membership.job_title`; dropped together with `role`. */
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
    /**
     * Completed sign-ins, incremented once per sign-in in the NextAuth `jwt`
     * callback. That hook receives a `user` argument only when a session is
     * first established, never on the silent refreshes that keep an 8h token
     * alive, so this counts logins and not requests.
     *
     * It exists because "first login" is a per-account fact and localStorage
     * cannot express it: browser storage makes a colleague on a shared machine
     * look like a returning user, and the same person on a second device look
     * like a new one. Both got the one-time onboarding surfaces wrong.
     */
    loginCount: integer("login_count").default(0).notNull(),
    /**
     * When the user last completed a sign-in. Stamped in the same
     * UPDATE ... RETURNING that increments loginCount (NextAuth `jwt` callback),
     * so it moves once per sign-in and never on the silent refreshes that keep
     * an 8h token alive. NULL for accounts that have not signed in since the
     * column shipped; readers fall back to emailVerifiedAt, then createdAt
     * (see lib/lifecycle). Sessions are stateless JWTs, so this column is the
     * only durable "when were they last here" fact.
     */
    lastLoginAt: timestamp("last_login_at"),
    /**
     * When this person was grandfathered: stamped at the billing launch on everyone who had got in
     * before it, and since then by the promo link (lib/billing/promo-grant.ts). A stamped person
     * keeps the current journey free in every company they belong to or start later. Null for
     * everyone else.
     */
    grandfatheredAt: timestamp("grandfathered_at"),
    /**
     * Which language this account reads the platform in (one of the app's
     * locale codes, lib/locale.ts). Exists so email sent OUTSIDE a request
     * context (lifecycle crons, digests) can pick a language; in-request email
     * keeps using the request locale.
     *
     * Written at registration, re-written every time the language switcher is
     * used (user.setLocale), and seeded on OAuth signup from the NEXT_LOCALE
     * cookie. NULL only for accounts predating the column — there is no
     * backfill, because for those rows no record of the choice exists. Readers
     * go through resolveEmailLocale, which falls back to company.country and
     * then "de" (lib/mail/locale.ts).
     */
    locale: varchar("locale", { length: 10 }),
    /**
     * The campaign tags (utm_*) on the page an email signup started from, validated and capped by
     * lib/auth/signup-campaign.ts. They travel in the URL only, never in browser storage, which is
     * also why a Google signup has none: across Google's redirect only a cookie could carry them.
     * NULL when the page carried none and for accounts predating the column.
     */
    signupCampaign: jsonb("signup_campaign").$type<SignupCampaign>(),
    /**
     * When the user dismissed the walkthrough for the ROLE SWIMLANE layout.
     *
     * One flag per walkthrough, not one for all of them. The journey and a
     * requirement page teach different things, and skipping the overview is not
     * a statement about the page where the actual work happens, so each is
     * dismissed on its own.
     *
     * The column keeps its original name because it already holds exactly this:
     * every dismissal recorded against it happened on the swimlane, the only
     * journey layout that existed then. Renaming it would rewrite a hot table
     * to buy nothing.
     */
    journeyTourTeamDismissedAt: timestamp("tour_dismissed_at"),
    /**
     * When the user dismissed the walkthrough for the GUIDED journey layout.
     *
     * Separate from the column above because the journey renders in two
     * layouts with different controls, and a walkthrough of one says nothing
     * about the other: someone who took the guided tour and later switches to
     * the role swimlane has still never been shown the swimlane. The older
     * column keeps its name and its meaning — every dismissal ever recorded
     * against it happened on the swimlane, which is the only layout that
     * existed at the time.
     */
    journeyTourGuidedDismissedAt: timestamp("journey_tour_guided_dismissed_at"),
    /** When the user dismissed the requirement-page tour. */
    requirementTourDismissedAt: timestamp("requirement_tour_dismissed_at"),
    /** When the user dismissed the second-login offer of help. */
    helpOfferDismissedAt: timestamp("help_offer_dismissed_at"),
    /**
     * When the user answered the notice that the journey is the more detailed view than the NIS 2
     * walkthrough.
     */
    journeyNoticeDismissedAt: timestamp("journey_notice_dismissed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_company").on(table.companyId),
    uniqueIndex("uq_user_google_subject")
      .on(table.googleSubject)
      .where(sql`${table.googleSubject} IS NOT NULL`),
  ],
);
