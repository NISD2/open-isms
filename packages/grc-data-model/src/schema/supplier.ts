import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  supplierRiskLevelEnum,
  supplierAuditFrequencyEnum,
  supplierRelationshipStatusEnum,
  supplierRelationshipTypeEnum,
  transferMechanismEnum,
} from "../enums";

export const supplier = pgTable(
  "supplier",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Bilateral relationship parties

    /**
     * The customer's consumer-app company. Always set for entity-side inventory
     * (legacy use). Always set for Direction B. Nullable in Direction A
     * when the customer is identified only by email.
     */
    customerCompanyId: uuid("customer_company_id"),

    /**
     * The supplier's consumer-app company. Set when the supplier exists on the
     * platform (after they sign up via Direction A invite or accept a
     * Direction B magic link). Nullable for entity-side free-text suppliers
     * who never signed up.
     */
    supplierCompanyId: uuid("supplier_company_id"),

    /**
     * Customer email address — the identifier used in supplier-portal flows
     * when the customer doesn't have a consumer-app account. Lowercased on insert.
     * Nullable for legacy entity-inventory rows.
     */
    customerEmail: varchar("customer_email", { length: 255 }),

    /**
     * Customer org display name. Set in supplier-portal flows where the
     * supplier knows the customer's company name but the customer doesn't
     * have a consumer-app account. Distinct from `name` (which is the supplier-side
     * display name).
     */
    customerOrgName: varchar("customer_org_name", { length: 500 }),

    // Display

    /** Supplier display name. Free text for legacy rows; mirrors company.name when supplierCompanyId is set. */
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactName: varchar("contact_name", { length: 255 }),

    // Entity-side classification (CIR §5.2 supplier register fields)
    // Only meaningful when the customer-side entity is managing this row.

    riskLevel: supplierRiskLevelEnum("risk_level").default("medium"),
    serviceType: varchar("service_type", { length: 255 }),
    hasAccessToSystems: boolean("has_access_to_systems").default(false),
    hasAccessToData: boolean("has_access_to_data").default(false),
    isCritical: boolean("is_critical").default(false),

    // NIS2 compliance status
    nis2RegistrationId: varchar("nis2_registration_id", { length: 255 }),
    hasSecurityCertification: boolean("has_security_certification").default(false),
    securityCertificationType: varchar("security_certification_type", { length: 255 }),

    // Contract
    contractStartDate: date("contract_start_date"),
    contractEndDate: date("contract_end_date"),
    hasSecurityClauses: boolean("has_security_clauses").default(false),
    hasIncidentNotificationClause: boolean(
      "has_incident_notification_clause"
    ).default(false),
    hasAuditRights: boolean("has_audit_rights").default(false),
    hasSubcontractorFlowDown: boolean("has_subcontractor_flow_down").default(
      false
    ),

    // CIR 5.2 — Per-supplier contract & monitoring details
    contractSecurityClauses: text("contract_security_clauses"),
    auditFrequency: supplierAuditFrequencyEnum("audit_frequency"),
    monitoringMethod: varchar("monitoring_method", { length: 255 }),
    lastReviewDate: date("last_review_date"),
    dueDiligenceProcess: text("due_diligence_process"),

    // Per-customer contract clauses (supplier-portal)
    //
    // These move from the company table — they vary per customer (each
    // contract negotiates its own terms), so they belong on the
    // relationship row, not the supplier's company-wide truth.
    //
    // Only meaningful when this row represents an actual supplier-portal
    // relationship (supplierCompanyId set). For legacy entity-side
    // inventory rows the entity records its own answers in their own
    // contract management — these columns stay null.

    /** CIR §5.1.4(e) — accept third-party right to audit / provide audit reports. */
    acceptRightToAudit: boolean("accept_right_to_audit"),
    /** CIR §5.1.4(g) — does the supplier rely on subprocessors for THIS customer? */
    hasSubprocessors: boolean("has_subprocessors"),
    /** Free-text list, only meaningful when hasSubprocessors = true. */
    subprocessorList: text("subprocessor_list"),
    /** CIR §5.1.4(h) — retrieval / disposal of customer information at termination. */
    dataReturnOnTermination: boolean("data_return_on_termination"),
    /** Standard data processing agreement available. */
    dpaAvailable: boolean("dpa_available"),
    /** GDPR — Art. 28 / 26 / disclosure-only / intra-group. Drives which contract obligations apply. */
    relationshipType: supplierRelationshipTypeEnum("relationship_type"),
    /** GDPR — does any personal data flow to/through this supplier? */
    processesPersonalData: boolean("processes_personal_data").default(false),
    /** GDPR Art. 28(3)(a) — processor processes only on documented instructions from the controller. */
    processesOnlyOnInstructions: boolean("processes_only_on_instructions"),
    /** GDPR Art. 28(3)(e) — processor assists controller with data-subject rights requests. */
    assistsWithDataSubjectRights: boolean("assists_with_data_subject_rights"),
    /** GDPR Art. 44-49 — does data leave the EEA? */
    internationalTransfer: boolean("international_transfer").default(false),
    /** GDPR — adequacy / SCCs / BCRs / derogation. Only meaningful when internationalTransfer is true. */
    transferMechanism: transferMechanismEnum("transfer_mechanism"),
    /** ENISA TIG §5.1.4 TIPS — notify customer in advance if data-processing locations change. */
    notifyOnLocationChange: boolean("notify_on_location_change"),
    /** ENISA TIG §5.1.4 TIPS — supplier obligation to assist customer at no cost during incidents. */
    incidentAssistanceCommitment: boolean("incident_assistance_commitment"),
    /** ENISA TIG §5.1.4 TIPS — notify customer of any material change affecting service delivery. */
    notifyMaterialChanges: boolean("notify_material_changes"),
    /** ENISA TIG §5.1.4 TIPS — documented exit strategy with adequate transition period. */
    hasExitPlan: boolean("has_exit_plan"),
    /** Incident response SLA (hours) the supplier commits to THIS customer. */
    incidentSlaHours: integer("incident_sla_hours"),

    // Supplier-portal share state (only meaningful when supplierCompanyId
    // is set AND the share was created via the supplier portal)

    /**
     * 64-char hex bearer token. Knowing this token grants read access to the
     * supplier's data via /supplier-access/{token} (no consumer-app account needed)
     * and the right to revoke the relationship. Nullable for legacy rows.
     *
     * Column is named `unsubscribe_token` for backward compatibility with the
     * 0012 migration; it serves as the access token in v2.
     */
    unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).unique(),

    /** Relationship status. Nullable for legacy entity-inventory rows. */
    status: supplierRelationshipStatusEnum("status"),

    /** Where this row originated. Free string for now. */
    source: varchar("source", { length: 50 }),

    confirmedAt: timestamp("confirmed_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_supplier_customer_company").on(table.customerCompanyId),
    index("idx_supplier_supplier_company").on(table.supplierCompanyId),
    index("idx_supplier_customer_email").on(table.customerEmail),
    index("idx_supplier_status").on(table.status),
    // Portal-share dedup: no two active shares for the same (supplier, customer email) pair.
    // Enforced only on non-null pairs (Postgres unique-index NULL semantics).
    uniqueIndex("uq_supplier_portal_share").on(
      table.supplierCompanyId,
      table.customerEmail,
    ),
  ],
);
