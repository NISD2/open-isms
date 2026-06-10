CREATE TYPE "public"."ai_data_sharing" AS ENUM('none', 'basic', 'full');--> statement-breakpoint
CREATE TYPE "public"."audit_status" AS ENUM('planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."change_status" AS ENUM('draft', 'submitted', 'approved', 'implementing', 'implemented', 'rolled_back', 'closed');--> statement-breakpoint
CREATE TYPE "public"."change_type" AS ENUM('standard', 'normal', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."effort_level" AS ENUM('trivial', 'light', 'moderate', 'significant', 'major');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('essential', 'important', 'kritis');--> statement-breakpoint
CREATE TYPE "public"."evidence_status" AS ENUM('draft', 'in_review', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('document', 'proof', 'sign-off', 'technical', 'training');--> statement-breakpoint
CREATE TYPE "public"."exercise_type" AS ENUM('tabletop', 'technical', 'red_team', 'full_scale');--> statement-breakpoint
CREATE TYPE "public"."finding_severity" AS ENUM('critical', 'major', 'minor', 'observation');--> statement-breakpoint
CREATE TYPE "public"."finding_status" AS ENUM('open', 'in_progress', 'resolved', 'verified', 'deferred');--> statement-breakpoint
CREATE TYPE "public"."framework" AS ENUM('nis2', 'gdpr', 'arbeitsschutz', 'brandschutz', 'iso27001', 'bsi_grundschutz');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('one-time', 'monthly', 'quarterly', 'semi-annual', 'annual', 'every-3-years', 'on-change', 'ongoing');--> statement-breakpoint
CREATE TYPE "public"."improvement_source" AS ENUM('audit', 'incident', 'pentest', 'management_review', 'kpi_breach', 'gap_analysis', 'regulatory_change', 'suggestion');--> statement-breakpoint
CREATE TYPE "public"."incident_report_type" AS ENUM('early_warning', 'notification', 'intermediate', 'final', 'progress');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('near_miss', 'incident', 'significant');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('not_started', 'in_progress', 'completed', 'not_applicable', 'needs_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."kpi_status" AS ENUM('green', 'amber', 'red');--> statement-breakpoint
CREATE TYPE "public"."lead_intent" AS ENUM('entity', 'supplier', 'both', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'in_app', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'acknowledged', 'escalated', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."patch_status" AS ENUM('pending', 'applied', 'exception', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'guided', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('P0', 'P1', 'P2', 'P3');--> statement-breakpoint
CREATE TYPE "public"."requirement_importance" AS ENUM('mandatory', 'recommended', 'enhanced');--> statement-breakpoint
CREATE TYPE "public"."situation_color" AS ENUM('red', 'orange', 'yellow', 'gray');--> statement-breakpoint
CREATE TYPE "public"."supplier_audit_frequency" AS ENUM('annual', 'biennial', 'on_change');--> statement-breakpoint
CREATE TYPE "public"."supplier_publication_broadcast_status" AS ENUM('queued', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."supplier_publication_event_type" AS ENUM('questionnaire_updated', 'certification_added', 'certification_expiring', 'incident_published', 'subprocessor_changed', 'service_catalog_changed');--> statement-breakpoint
CREATE TYPE "public"."supplier_relationship_status" AS ENUM('active', 'revoked', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."supplier_risk_level" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."treatment_status" AS ENUM('not_started', 'in_progress', 'completed', 'verified');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('info', 'warning', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "public"."vulnerability_status" AS ENUM('discovered', 'assessed', 'treating', 'resolved', 'accepted', 'mitigated');--> statement-breakpoint
CREATE TABLE "policy_acknowledgment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"acknowledged_at" timestamp NOT NULL,
	"acknowledged_version" integer,
	"method" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applicability_lookup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_query" varchar(500) NOT NULL,
	"company_id" varchar(100) NOT NULL,
	"company_name" varchar(500) NOT NULL,
	"classification" varchar(50),
	"api_response" jsonb,
	"looked_up_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_assessment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"current_step" integer DEFAULT 1,
	"total_requirements" integer DEFAULT 0,
	"completed_requirements" integer DEFAULT 0,
	"compliance_percentage" numeric(5, 2) DEFAULT '0',
	"entity_type_at_assessment" "entity_type",
	"next_reassessment_date" date,
	"last_reassessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_requirement_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"status" "item_status" DEFAULT 'not_started' NOT NULL,
	"is_applicable" boolean DEFAULT true,
	"not_applicable_reason" text,
	"completed_at" timestamp,
	"completed_by" uuid,
	"signed_off_by" uuid,
	"signed_off_at" timestamp,
	"signed_off_role" varchar(255),
	"signed_off_template_version" integer,
	"next_review_date" date,
	"last_reviewed_at" timestamp,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_feedback" text,
	"assigned_to" uuid,
	"internal_notes" text,
	"sign_off_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_relationship_id" uuid,
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
	"end_of_life" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"description" text NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"checksum" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_finding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"description" text NOT NULL,
	"severity" "finding_severity" NOT NULL,
	"root_cause" text,
	"corrective_action" text NOT NULL,
	"assigned_to" uuid,
	"deadline" date,
	"status" "finding_status" DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp,
	"verified_by" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"audit_area" varchar(255) NOT NULL,
	"scope" text,
	"status" "audit_status" DEFAULT 'planned' NOT NULL,
	"scheduled_date" date NOT NULL,
	"completed_at" timestamp,
	"auditor_name" varchar(255),
	"report_file_key" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_category_intake" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb,
	"completion_pct" integer DEFAULT 0,
	"last_saved_by" uuid,
	"last_saved_at" timestamp DEFAULT now(),
	"signed_off_by" uuid,
	"signed_off_at" timestamp,
	"sign_off_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "change_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"business_justification" text,
	"security_impact_assessment" text,
	"change_type" "change_type" NOT NULL,
	"status" "change_status" DEFAULT 'draft' NOT NULL,
	"asset_id" uuid,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"implemented_by" uuid,
	"implemented_at" timestamp,
	"tested_at" timestamp,
	"rollback_plan" text,
	"rolled_back_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(64) NOT NULL,
	"role" varchar(100) DEFAULT 'member' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"accepted_by" uuid,
	"accepted_at" timestamp,
	"redirect_path" varchar(500),
	"assignment_context" jsonb,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_invite_token_unique" UNIQUE("token"),
	CONSTRAINT "uq_invite_company_email" UNIQUE("company_id","email")
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requirement_status_id" uuid NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"file_type" varchar(100),
	"file_size" integer,
	"storage_key" varchar(500) NOT NULL,
	"description" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"status" "evidence_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"content_hash" varchar(64),
	"valid_from" date,
	"valid_until" date
);
--> statement-breakpoint
CREATE TABLE "exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"exercise_type" "exercise_type" NOT NULL,
	"domain" varchar(100) NOT NULL,
	"scheduled_date" date NOT NULL,
	"completed_at" timestamp,
	"scenario_description" text,
	"participants" text[] DEFAULT '{}'::text[],
	"facilitator" varchar(255),
	"identified_gaps" text[] DEFAULT '{}'::text[],
	"lessons_learned" text,
	"after_action_report_file_key" varchar(500),
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
	"nis2_url" varchar(500),
	"bsig_url" varchar(500),
	"relevant_roles" jsonb,
	"grundschutz_module" varchar(50),
	"sort_order" integer NOT NULL,
	"estimated_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "improvement_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"source" "improvement_source" NOT NULL,
	"source_reference_id" uuid,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"assigned_to" uuid,
	"priority" "priority" NOT NULL,
	"target_date" date,
	"status" "finding_status" DEFAULT 'open' NOT NULL,
	"deferral_reason" text,
	"completed_at" timestamp,
	"verification_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_relationship_id" uuid,
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
	"threat_type" varchar(255),
	"root_cause" text,
	"countermeasures" text,
	"preventive_measures" text,
	"internal_ref" varchar(100),
	"created_by" uuid,
	"broadcast_status" "supplier_publication_broadcast_status",
	"broadcast_sent_at" timestamp,
	"broadcast_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_measurement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"kpi_name" varchar(255) NOT NULL,
	"measured_at" timestamp NOT NULL,
	"value" numeric NOT NULL,
	"target" numeric,
	"unit" varchar(50),
	"status" "kpi_status",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"company_name" varchar(500),
	"classification" varchar(50),
	"source" varchar(100) DEFAULT 'applicability_check' NOT NULL,
	"intent" "lead_intent" DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"recipient_id" uuid,
	"recipient_email" varchar(255),
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"trigger_field" varchar(100) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"acknowledged_at" timestamp,
	"escalated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"urgency" "urgency" DEFAULT 'info' NOT NULL,
	"escalation_level" integer,
	"link_url" varchar(500),
	CONSTRAINT "chk_notification_recipient_xor" CHECK (("notification"."recipient_id" IS NOT NULL) <> ("notification"."recipient_email" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"legal_form" varchar(100),
	"sector" varchar(255) NOT NULL,
	"sub_sector" varchar(255),
	"entity_type" "entity_type" NOT NULL,
	"employee_count" integer,
	"annual_revenue" numeric(15, 2),
	"global_turnover" numeric(15, 2),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"ciso_name" varchar(255),
	"ciso_reports_to" varchar(255),
	"bsi_contact_name" varchar(255),
	"bsi_contact_email" varchar(255),
	"bsi_contact_phone" varchar(50),
	"bsi_registration_id" varchar(100),
	"annual_security_budget" numeric(15, 2),
	"primary_locations" varchar(1000),
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"ai_data_sharing" "ai_data_sharing" DEFAULT 'none' NOT NULL,
	"timezone" varchar(100) DEFAULT 'Europe/Berlin',
	"digest_time" varchar(5) DEFAULT '08:00',
	"acts_as_nis2_entity" boolean DEFAULT false NOT NULL,
	"acts_as_supplier" boolean DEFAULT false NOT NULL,
	"legal_name" varchar(255),
	"registered_address" varchar(500),
	"country" varchar(2),
	"primary_domain" varchar(255),
	"tagline" varchar(255),
	"description" text,
	"logo_storage_key" varchar(500),
	"security_contact_name" varchar(255),
	"incident_contact_email" varchar(255),
	"incident_contact_phone" varchar(50),
	"incident_sla_hours" integer,
	"is_saas" boolean,
	"is_on_prem" boolean,
	"is_professional_services" boolean,
	"is_managed_service" boolean,
	"has_isms" boolean,
	"has_iso_27001_or_equivalent" boolean,
	"staff_security_training" boolean,
	"background_checks" boolean,
	"vulnerability_handling" boolean,
	"accept_right_to_audit" boolean,
	"has_subprocessors" boolean,
	"subprocessor_list" text,
	"data_return_on_termination" boolean,
	"dpa_available" boolean,
	"security_policy_reviewed_annually" boolean,
	"has_incident_response_plan" boolean,
	"has_business_continuity_plan" boolean,
	"has_cryptography_policy" boolean,
	"has_privileged_access_mgmt" boolean,
	"mfa_enforced_internal" boolean,
	"has_asset_inventory" boolean,
	"has_penetration_testing_program" boolean,
	"service_description" text,
	"data_processing_locations" text,
	"notify_on_location_change" boolean,
	"incident_assistance_commitment" boolean,
	"cooperate_with_authorities" boolean,
	"notify_material_changes" boolean,
	"has_exit_plan" boolean,
	"past_breaches_disclosed" boolean,
	"saas_hosting_region" varchar(20),
	"saas_encryption_at_rest" boolean,
	"saas_encryption_in_transit" boolean,
	"saas_mfa_enforced" boolean,
	"saas_rto_hours" integer,
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
	"questionnaire_last_saved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"role" varchar(100) NOT NULL,
	"job_title" varchar(255),
	"is_management" boolean DEFAULT false,
	"phone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "patch_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"patch_identifier" varchar(255) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"title" varchar(500),
	"release_date" date,
	"status" "patch_status" DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp,
	"exception_reason" text,
	"exception_approved_by" uuid,
	"exception_expires_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"requirement_id" uuid,
	"title" varchar(500) NOT NULL,
	"type" varchar(100) NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"content" text,
	"file_key" varchar(500),
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"approver_role" varchar(255),
	"effective_from" date,
	"review_due" date,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_policy_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"policy_type" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"signed_off_at" timestamp,
	"signed_off_role" varchar(255)
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
	"directive_article" varchar(100),
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
CREATE TABLE "management_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"review_date" date NOT NULL,
	"attendees" text[] DEFAULT '{}'::text[],
	"topics_covered" text[] DEFAULT '{}'::text[],
	"decisions" text,
	"action_items" text,
	"minutes_file_key" varchar(500),
	"next_review_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_risk_methodology" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'BSI 200-3' NOT NULL,
	"likelihood_levels" jsonb NOT NULL,
	"impact_levels" jsonb NOT NULL,
	"acceptance_threshold" integer DEFAULT 4 NOT NULL,
	"includes_ot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_treatment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"action" varchar(500) NOT NULL,
	"description" text,
	"required_resources" text,
	"responsible_user_id" uuid,
	"deadline" date,
	"status" "treatment_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp,
	"verified_by" uuid,
	"verified_at" timestamp,
	"expected_residual_likelihood" integer,
	"expected_residual_impact" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "sign_off_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"status_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"signed_off_by" uuid NOT NULL,
	"signed_off_role" varchar(255),
	"snapshot" jsonb NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"previous_checksum" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_company_id" uuid NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"token" varchar(64) NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"accepted_by_company_id" uuid,
	CONSTRAINT "supplier_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "company_certification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"type_other" varchar(255),
	"scope" text,
	"auditor" varchar(255),
	"valid_from" date,
	"valid_until" date NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"file_name" varchar(500),
	"file_size" integer,
	"content_hash" varchar(64),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "training_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"training_type" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"participant_name" varchar(255) NOT NULL,
	"participant_role" varchar(255),
	"is_management" boolean DEFAULT false,
	"provider_name" varchar(255),
	"trainer_name" varchar(255),
	"trainer_qualification" varchar(500),
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_minutes" integer,
	"topics_covered" text[] DEFAULT '{}'::text[],
	"certificate_file_key" varchar(500),
	"next_training_due" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vulnerability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_id" uuid,
	"cve_id" varchar(50),
	"title" varchar(500) NOT NULL,
	"description" text,
	"severity" varchar(50) NOT NULL,
	"cvss_score" numeric(3, 1),
	"source" varchar(100),
	"status" "vulnerability_status" DEFAULT 'discovered' NOT NULL,
	"discovered_at" date,
	"treatment_note" text,
	"acceptance_reason" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_incident_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"report_type" "incident_report_type" NOT NULL,
	"due_at" timestamp NOT NULL,
	"submitted_at" timestamp,
	"is_overdue" boolean DEFAULT false,
	"summary" text,
	"new_information" text,
	"remediation_status" text,
	"root_cause_analysis" text,
	"lessons_learned" text,
	"bsi_acknowledged_at" timestamp,
	"bsi_guidance_received" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"is_registered" boolean DEFAULT false,
	"registration_date" date,
	"registration_ref" varchar(100),
	"ip_ranges_v4" text[] DEFAULT '{}'::text[],
	"ip_ranges_v6" text[] DEFAULT '{}'::text[],
	"eu_countries" text[] DEFAULT '{}'::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bsi_registration_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
ALTER TABLE "policy_acknowledgment" ADD CONSTRAINT "policy_acknowledgment_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_acknowledgment" ADD CONSTRAINT "policy_acknowledgment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_assessment" ADD CONSTRAINT "company_assessment_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_assessment" ADD CONSTRAINT "company_assessment_framework_id_compliance_framework_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_framework"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD CONSTRAINT "company_requirement_status_assessment_id_company_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."company_assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD CONSTRAINT "company_requirement_status_requirement_id_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD CONSTRAINT "company_requirement_status_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD CONSTRAINT "company_requirement_status_signed_off_by_user_id_fk" FOREIGN KEY ("signed_off_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD CONSTRAINT "company_requirement_status_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD CONSTRAINT "company_requirement_status_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_customer_relationship_id_supplier_id_fk" FOREIGN KEY ("customer_relationship_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_finding" ADD CONSTRAINT "audit_finding_audit_id_internal_audit_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."internal_audit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_finding" ADD CONSTRAINT "audit_finding_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_finding" ADD CONSTRAINT "audit_finding_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_audit" ADD CONSTRAINT "internal_audit_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_assignment" ADD CONSTRAINT "category_assignment_assessment_id_company_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."company_assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_assignment" ADD CONSTRAINT "category_assignment_category_id_requirement_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."requirement_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_assignment" ADD CONSTRAINT "category_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_assignment" ADD CONSTRAINT "category_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_category_intake" ADD CONSTRAINT "company_category_intake_assessment_id_company_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."company_assessment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_category_intake" ADD CONSTRAINT "company_category_intake_category_id_requirement_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."requirement_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_category_intake" ADD CONSTRAINT "company_category_intake_last_saved_by_user_id_fk" FOREIGN KEY ("last_saved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_category_intake" ADD CONSTRAINT "company_category_intake_signed_off_by_user_id_fk" FOREIGN KEY ("signed_off_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request" ADD CONSTRAINT "change_request_implemented_by_user_id_fk" FOREIGN KEY ("implemented_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_invite" ADD CONSTRAINT "company_invite_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_invite" ADD CONSTRAINT "company_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_invite" ADD CONSTRAINT "company_invite_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_requirement_status_id_company_requirement_status_id_fk" FOREIGN KEY ("requirement_status_id") REFERENCES "public"."company_requirement_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_category" ADD CONSTRAINT "requirement_category_framework_id_compliance_framework_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_framework"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "improvement_item" ADD CONSTRAINT "improvement_item_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "improvement_item" ADD CONSTRAINT "improvement_item_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_customer_relationship_id_supplier_id_fk" FOREIGN KEY ("customer_relationship_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_measurement" ADD CONSTRAINT "kpi_measurement_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patch_record" ADD CONSTRAINT "patch_record_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patch_record" ADD CONSTRAINT "patch_record_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patch_record" ADD CONSTRAINT "patch_record_exception_approved_by_user_id_fk" FOREIGN KEY ("exception_approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_requirement_id_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_policy_config" ADD CONSTRAINT "company_policy_config_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_assignment" ADD CONSTRAINT "requirement_assignment_status_id_company_requirement_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."company_requirement_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_assignment" ADD CONSTRAINT "requirement_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_assignment" ADD CONSTRAINT "requirement_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_category_id_requirement_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."requirement_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_prerequisite" ADD CONSTRAINT "requirement_prerequisite_requirement_id_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_prerequisite" ADD CONSTRAINT "requirement_prerequisite_prerequisite_id_requirement_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "management_review" ADD CONSTRAINT "management_review_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_risk_methodology" ADD CONSTRAINT "company_risk_methodology_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_treatment" ADD CONSTRAINT "risk_treatment_risk_id_risk_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_treatment" ADD CONSTRAINT "risk_treatment_responsible_user_id_user_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_treatment" ADD CONSTRAINT "risk_treatment_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk" ADD CONSTRAINT "risk_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk" ADD CONSTRAINT "risk_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_asset" ADD CONSTRAINT "risk_asset_risk_id_risk_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_asset" ADD CONSTRAINT "risk_asset_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_supplier" ADD CONSTRAINT "risk_supplier_risk_id_risk_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_supplier" ADD CONSTRAINT "risk_supplier_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_off_history" ADD CONSTRAINT "sign_off_history_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_off_history" ADD CONSTRAINT "sign_off_history_status_id_company_requirement_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."company_requirement_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_off_history" ADD CONSTRAINT "sign_off_history_requirement_id_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_off_history" ADD CONSTRAINT "sign_off_history_signed_off_by_user_id_fk" FOREIGN KEY ("signed_off_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invite" ADD CONSTRAINT "supplier_invite_from_company_id_company_id_fk" FOREIGN KEY ("from_company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invite" ADD CONSTRAINT "supplier_invite_accepted_by_company_id_company_id_fk" FOREIGN KEY ("accepted_by_company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_certification" ADD CONSTRAINT "company_certification_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_customer_company_id_company_id_fk" FOREIGN KEY ("customer_company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_supplier_company_id_company_id_fk" FOREIGN KEY ("supplier_company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_record" ADD CONSTRAINT "training_record_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_record" ADD CONSTRAINT "training_record_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vulnerability" ADD CONSTRAINT "vulnerability_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vulnerability" ADD CONSTRAINT "vulnerability_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bsi_incident_report" ADD CONSTRAINT "bsi_incident_report_incident_id_incident_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incident"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bsi_incident_report" ADD CONSTRAINT "bsi_incident_report_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bsi_registration" ADD CONSTRAINT "bsi_registration_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_policy_ack_policy" ON "policy_acknowledgment" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_policy_ack_user" ON "policy_acknowledgment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_applicability_lookup_company" ON "applicability_lookup" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_applicability_lookup_created" ON "applicability_lookup" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_applicability_lookup_classification" ON "applicability_lookup" USING btree ("classification");--> statement-breakpoint
CREATE INDEX "idx_assessment_company" ON "company_assessment" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_assessment_framework" ON "company_assessment" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "idx_req_status_assessment" ON "company_requirement_status" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "idx_req_status_requirement" ON "company_requirement_status" USING btree ("requirement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_req_status_unique" ON "company_requirement_status" USING btree ("assessment_id","requirement_id");--> statement-breakpoint
CREATE INDEX "idx_req_status_next_review" ON "company_requirement_status" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX "idx_asset_company" ON "asset" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_asset_type" ON "asset" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_asset_critical" ON "asset" USING btree ("is_critical");--> statement-breakpoint
CREATE INDEX "idx_asset_customer_relationship" ON "asset" USING btree ("customer_relationship_id");--> statement-breakpoint
CREATE INDEX "idx_audit_company" ON "audit_log" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_finding_audit" ON "audit_finding" USING btree ("audit_id");--> statement-breakpoint
CREATE INDEX "idx_audit_finding_status" ON "audit_finding" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_internal_audit_company" ON "internal_audit" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_internal_audit_status" ON "internal_audit" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_category_owner" ON "category_assignment" USING btree ("assessment_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_intake_assessment_category" ON "company_category_intake" USING btree ("assessment_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_change_request_company" ON "change_request" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_change_request_status" ON "change_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invite_token" ON "company_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_invite_company" ON "company_invite" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_requirement_status" ON "evidence" USING btree ("requirement_status_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_status" ON "evidence" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_exercise_company" ON "exercise" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_exercise_type" ON "exercise" USING btree ("exercise_type");--> statement-breakpoint
CREATE INDEX "idx_exercise_domain" ON "exercise" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_framework_active" ON "compliance_framework" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_category_framework" ON "requirement_category" USING btree ("framework_id");--> statement-breakpoint
CREATE INDEX "idx_improvement_item_company" ON "improvement_item" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_improvement_item_status" ON "improvement_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_improvement_item_source" ON "improvement_item" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_incident_company" ON "incident" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_incident_severity" ON "incident" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_incident_discovered" ON "incident" USING btree ("discovered_at");--> statement-breakpoint
CREATE INDEX "idx_incident_customer_relationship" ON "incident" USING btree ("customer_relationship_id");--> statement-breakpoint
CREATE INDEX "idx_incident_broadcast_status" ON "incident" USING btree ("broadcast_status");--> statement-breakpoint
CREATE INDEX "idx_kpi_measurement_company" ON "kpi_measurement" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_kpi_measurement_name" ON "kpi_measurement" USING btree ("kpi_name");--> statement-breakpoint
CREATE INDEX "idx_kpi_measurement_date" ON "kpi_measurement" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "idx_lead_email" ON "lead" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_lead_created" ON "lead" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lead_intent" ON "lead" USING btree ("intent");--> statement-breakpoint
CREATE INDEX "idx_notification_company" ON "notification" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_notification_recipient" ON "notification" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_notification_recipient_email" ON "notification" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "idx_notification_status" ON "notification" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notification_scheduled" ON "notification" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_notification_entity" ON "notification" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_user_company" ON "user" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_patch_record_company" ON "patch_record" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_patch_record_asset" ON "patch_record" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_patch_record_status" ON "patch_record" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_policy_company" ON "policy" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_policy_requirement" ON "policy" USING btree ("requirement_id");--> statement-breakpoint
CREATE INDEX "idx_policy_status" ON "policy" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_policy_config_company_type" ON "company_policy_config" USING btree ("company_id","policy_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_req_assign" ON "requirement_assignment" USING btree ("status_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_req_assign_user" ON "requirement_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_category" ON "requirement" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_parent" ON "requirement" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_priority" ON "requirement" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_req_prereq_pair" ON "requirement_prerequisite" USING btree ("requirement_id","prerequisite_id");--> statement-breakpoint
CREATE INDEX "idx_management_review_company" ON "management_review" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_management_review_date" ON "management_review" USING btree ("review_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_risk_methodology_company" ON "company_risk_methodology" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_risk_treatment_risk" ON "risk_treatment" USING btree ("risk_id");--> statement-breakpoint
CREATE INDEX "idx_risk_treatment_status" ON "risk_treatment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_risk_company" ON "risk" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_risk_score" ON "risk" USING btree ("risk_score");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_risk_assets_pair" ON "risk_asset" USING btree ("risk_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_risk_supplier_pair" ON "risk_supplier" USING btree ("risk_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_sign_off_history_status" ON "sign_off_history" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "idx_sign_off_history_company" ON "sign_off_history" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_sign_off_history_requirement" ON "sign_off_history" USING btree ("requirement_id");--> statement-breakpoint
CREATE INDEX "idx_sign_off_history_created" ON "sign_off_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_invite_pair" ON "supplier_invite" USING btree ("from_company_id","to_email");--> statement-breakpoint
CREATE INDEX "idx_supplier_invite_to_email" ON "supplier_invite" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "idx_company_cert_company" ON "company_certification" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_company_cert_valid_until" ON "company_certification" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_company_cert_type" ON "company_certification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_supplier_customer_company" ON "supplier" USING btree ("customer_company_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_supplier_company" ON "supplier" USING btree ("supplier_company_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_customer_email" ON "supplier" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "idx_supplier_status" ON "supplier" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_portal_share" ON "supplier" USING btree ("supplier_company_id","customer_email");--> statement-breakpoint
CREATE INDEX "idx_training_company" ON "training_record" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_training_user" ON "training_record" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_training_management" ON "training_record" USING btree ("is_management");--> statement-breakpoint
CREATE INDEX "idx_vulnerability_company" ON "vulnerability" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_vulnerability_asset" ON "vulnerability" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_vulnerability_status" ON "vulnerability" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bsi_incident_report_incident" ON "bsi_incident_report" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "idx_bsi_incident_report_due" ON "bsi_incident_report" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "idx_bsi_incident_report_overdue" ON "bsi_incident_report" USING btree ("is_overdue");--> statement-breakpoint
CREATE INDEX "idx_bsi_registration_company" ON "bsi_registration" USING btree ("company_id");