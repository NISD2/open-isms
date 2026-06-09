CREATE TYPE "public"."asset_service_type" AS ENUM('saas', 'on_prem', 'pro_services', 'managed');--> statement-breakpoint
CREATE TYPE "public"."effort_level" AS ENUM('trivial', 'light', 'moderate', 'significant', 'major');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('essential', 'important', 'kritis');--> statement-breakpoint
CREATE TYPE "public"."equivalence_kind" AS ENUM('equivalent', 'overlapping');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('document', 'proof', 'sign-off', 'technical', 'training');--> statement-breakpoint
CREATE TYPE "public"."framework" AS ENUM('nis2', 'gdpr', 'arbeitsschutz', 'brandschutz', 'iso27001', 'bsi_grundschutz', 'eu_ai_act', 'eu_cra');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('one-time', 'monthly', 'quarterly', 'semi-annual', 'annual', 'every-3-years', 'on-change', 'ongoing');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('near_miss', 'incident', 'significant');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('P0', 'P1', 'P2', 'P3');--> statement-breakpoint
CREATE TYPE "public"."requirement_importance" AS ENUM('mandatory', 'recommended', 'enhanced');--> statement-breakpoint
CREATE TYPE "public"."situation_color" AS ENUM('red', 'orange', 'yellow', 'gray');--> statement-breakpoint
CREATE TYPE "public"."supplier_audit_frequency" AS ENUM('annual', 'biennial', 'on_change');--> statement-breakpoint
CREATE TYPE "public"."supplier_relationship_status" AS ENUM('active', 'revoked', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."supplier_relationship_type" AS ENUM('processor', 'joint_controller', 'separate_controller', 'internal');--> statement-breakpoint
CREATE TYPE "public"."supplier_risk_level" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."transfer_mechanism" AS ENUM('adequacy', 'sccs', 'bcr', 'derogation', 'none');--> statement-breakpoint
CREATE TABLE "asset_supplier_offering" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"customer_relationship_id" uuid NOT NULL,
	"service_type" "asset_service_type" NOT NULL,
	"service_description" text,
	"data_processing_locations" text,
	"saas_hosting_region" varchar(20),
	"on_prem_sbom_provided" boolean,
	"on_prem_signed_releases" boolean,
	"on_prem_vulnerability_disclosure_policy" boolean,
	"on_prem_patch_sla_critical_hours" integer,
	"pro_services_background_check_scope" varchar(20),
	"pro_services_nda_in_place" boolean,
	"pro_services_customer_premises_policy" boolean,
	"managed_privileged_access_mgmt" boolean,
	"managed_session_recording" boolean,
	"managed_on_call_24x7" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_ot" boolean DEFAULT false,
	"is_critical" boolean DEFAULT false,
	"owner" varchar(255),
	"location" varchar(255),
	"ip_address" varchar(45),
	"hostname" varchar(255),
	"operating_system" varchar(255),
	"software_version" varchar(255),
	"access_management" varchar(255),
	"privileged_account_count" integer DEFAULT 0,
	"has_mfa" boolean DEFAULT false,
	"encryption_at_rest" varchar(100),
	"encryption_in_transit" varchar(100),
	"crypto_implementation" varchar(255),
	"has_backup" boolean DEFAULT false,
	"last_patch_date" date,
	"last_vuln_scan_date" date,
	"backup_frequency" varchar(50),
	"backup_location" varchar(255),
	"last_backup_test_date" date,
	"rto" integer,
	"rpo" integer,
	"processes_personal_data" boolean DEFAULT false,
	"end_of_life" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_framework" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "framework" NOT NULL,
	"version" varchar(50),
	"effective_date" date,
	"is_active" boolean DEFAULT true,
	"code_prefix" varchar(20),
	"sidebar_label" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_framework_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "requirement_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"framework_id" uuid NOT NULL,
	"code" varchar(10) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"reference_url" varchar(500),
	"national_url" varchar(500),
	"relevant_roles" jsonb,
	"grundschutz_module" varchar(50),
	"sort_order" integer NOT NULL,
	"estimated_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"severity" "incident_severity" NOT NULL,
	"situation_color" "situation_color" DEFAULT 'yellow',
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"occurred_at" timestamp,
	"discovered_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"confidentiality_impacted" boolean DEFAULT false,
	"integrity_impacted" boolean DEFAULT false,
	"availability_impacted" boolean DEFAULT false,
	"is_malicious" boolean,
	"has_cross_border_impact" boolean DEFAULT false,
	"affected_countries" text[] DEFAULT '{}'::text[],
	"is_targeted" varchar(20),
	"affected_users_count" integer,
	"affected_systems_count" integer,
	"estimated_financial_damage" numeric(15, 2),
	"has_reputational_harm" boolean DEFAULT false,
	"service_delivery_impact" text,
	"requires_gdpr_notification" boolean DEFAULT false,
	"data_subjects_affected" integer,
	"gdpr_notified_at" timestamp,
	"notified_data_subjects_at" timestamp,
	"threat_type" varchar(255),
	"root_cause" text,
	"countermeasures" text,
	"preventive_measures" text,
	"internal_ref" varchar(100),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"parent_id" uuid,
	"evidence_type" "evidence_type" NOT NULL,
	"importance" "requirement_importance" DEFAULT 'mandatory',
	"effort" "effort_level",
	"estimated_hours" integer,
	"needs_external_help" boolean DEFAULT false,
	"frequency" "frequency" NOT NULL,
	"priority" "priority" NOT NULL,
	"applies_to_essential" boolean DEFAULT true,
	"applies_to_important" boolean DEFAULT true,
	"applies_to_kritis" boolean DEFAULT true,
	"sector_specific" text[] DEFAULT '{}'::text[],
	"min_employees" integer,
	"legal_ref" varchar(255),
	"framework_ref" varchar(100),
	"cir_reference" varchar(255),
	"cir_applicability" varchar(20),
	"enisa_guidance_ref" varchar(255),
	"penalty_amount" varchar(255),
	"module_ref" varchar(50),
	"required_sign_off_role" varchar(50),
	"grundschutz_ref" varchar(100),
	"template_version" integer DEFAULT 1 NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "requirement_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "requirement_prerequisite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requirement_id" uuid NOT NULL,
	"prerequisite_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_satisfaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requirement_a_id" uuid NOT NULL,
	"requirement_b_id" uuid NOT NULL,
	"equivalence_kind" "equivalence_kind" DEFAULT 'overlapping' NOT NULL,
	"rationale" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_satisfaction_pair" UNIQUE("requirement_a_id","requirement_b_id")
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_company_id" uuid,
	"supplier_company_id" uuid,
	"customer_email" varchar(255),
	"customer_org_name" varchar(500),
	"name" varchar(255) NOT NULL,
	"description" text,
	"contact_email" varchar(255),
	"contact_name" varchar(255),
	"risk_level" "supplier_risk_level" DEFAULT 'medium',
	"service_type" varchar(255),
	"has_access_to_systems" boolean DEFAULT false,
	"has_access_to_data" boolean DEFAULT false,
	"is_critical" boolean DEFAULT false,
	"nis2_registration_id" varchar(255),
	"has_security_certification" boolean DEFAULT false,
	"security_certification_type" varchar(255),
	"contract_start_date" date,
	"contract_end_date" date,
	"has_security_clauses" boolean DEFAULT false,
	"has_incident_notification_clause" boolean DEFAULT false,
	"has_audit_rights" boolean DEFAULT false,
	"has_subcontractor_flow_down" boolean DEFAULT false,
	"contract_security_clauses" text,
	"audit_frequency" "supplier_audit_frequency",
	"monitoring_method" varchar(255),
	"last_review_date" date,
	"due_diligence_process" text,
	"accept_right_to_audit" boolean,
	"has_subprocessors" boolean,
	"subprocessor_list" text,
	"data_return_on_termination" boolean,
	"dpa_available" boolean,
	"relationship_type" "supplier_relationship_type",
	"processes_personal_data" boolean DEFAULT false,
	"processes_only_on_instructions" boolean,
	"assists_with_data_subject_rights" boolean,
	"international_transfer" boolean DEFAULT false,
	"transfer_mechanism" "transfer_mechanism",
	"notify_on_location_change" boolean,
	"incident_assistance_commitment" boolean,
	"notify_material_changes" boolean,
	"has_exit_plan" boolean,
	"incident_sla_hours" integer,
	"unsubscribe_token" varchar(64),
	"status" "supplier_relationship_status",
	"source" varchar(50),
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "risk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100),
	"likelihood" integer NOT NULL,
	"impact" integer NOT NULL,
	"risk_score" integer NOT NULL,
	"treatment" varchar(50) NOT NULL,
	"treatment_description" text,
	"residual_likelihood" integer,
	"residual_impact" integer,
	"residual_risk_score" integer,
	"risk_owner" varchar(255),
	"last_reviewed_at" timestamp,
	"next_review_date" date,
	"accepted_by" uuid,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_supplier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_supplier_offering" ADD CONSTRAINT "asset_supplier_offering_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_supplier_offering" ADD CONSTRAINT "asset_supplier_offering_customer_relationship_id_supplier_id_fk" FOREIGN KEY ("customer_relationship_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_category" ADD CONSTRAINT "requirement_category_framework_id_compliance_framework_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_framework"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_category_id_requirement_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."requirement_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_prerequisite" ADD CONSTRAINT "requirement_prerequisite_requirement_id_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_prerequisite" ADD CONSTRAINT "requirement_prerequisite_prerequisite_id_requirement_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_satisfaction" ADD CONSTRAINT "requirement_satisfaction_requirement_a_id_requirement_id_fk" FOREIGN KEY ("requirement_a_id") REFERENCES "public"."requirement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_satisfaction" ADD CONSTRAINT "requirement_satisfaction_requirement_b_id_requirement_id_fk" FOREIGN KEY ("requirement_b_id") REFERENCES "public"."requirement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_asset" ADD CONSTRAINT "risk_asset_risk_id_risk_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_asset" ADD CONSTRAINT "risk_asset_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_supplier" ADD CONSTRAINT "risk_supplier_risk_id_risk_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_supplier" ADD CONSTRAINT "risk_supplier_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_asset_supplier_offering_asset" ON "asset_supplier_offering" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_asset_supplier_offering_relationship" ON "asset_supplier_offering" USING btree ("customer_relationship_id");--> statement-breakpoint
CREATE INDEX "idx_asset_supplier_offering_service_type" ON "asset_supplier_offering" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_asset_company" ON "asset" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_asset_type" ON "asset" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_asset_critical" ON "asset" USING btree ("is_critical");--> statement-breakpoint
CREATE INDEX "idx_framework_active" ON "compliance_framework" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_category_framework" ON "requirement_category" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "idx_incident_company" ON "incident" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_incident_severity" ON "incident" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_incident_discovered" ON "incident" USING btree ("discovered_at");--> statement-breakpoint
CREATE INDEX "idx_requirement_category" ON "requirement" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_parent" ON "requirement" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_priority" ON "requirement" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_req_prereq_pair" ON "requirement_prerequisite" USING btree ("requirement_id","prerequisite_id");--> statement-breakpoint
CREATE INDEX "idx_satisfaction_a" ON "requirement_satisfaction" USING btree ("requirement_a_id");--> statement-breakpoint
CREATE INDEX "idx_satisfaction_b" ON "requirement_satisfaction" USING btree ("requirement_b_id");--> statement-breakpoint
CREATE INDEX "idx_satisfaction_kind" ON "requirement_satisfaction" USING btree ("equivalence_kind");--> statement-breakpoint
CREATE INDEX "idx_supplier_customer_company" ON "supplier" USING btree ("customer_company_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_supplier_company" ON "supplier" USING btree ("supplier_company_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_customer_email" ON "supplier" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "idx_supplier_status" ON "supplier" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_portal_share" ON "supplier" USING btree ("supplier_company_id","customer_email");--> statement-breakpoint
CREATE INDEX "idx_risk_company" ON "risk" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_risk_score" ON "risk" USING btree ("risk_score");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_risk_assets_pair" ON "risk_asset" USING btree ("risk_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_risk_supplier_pair" ON "risk_supplier" USING btree ("risk_id","supplier_id");