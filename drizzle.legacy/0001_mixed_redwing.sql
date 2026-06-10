CREATE TYPE "public"."asset_service_type" AS ENUM('saas', 'on_prem', 'pro_services', 'managed');--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "service_type" "asset_service_type";--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "service_description" text;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "data_processing_locations" text;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "saas_hosting_region" varchar(20);--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "on_prem_sbom_provided" boolean;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "on_prem_signed_releases" boolean;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "on_prem_vulnerability_disclosure_policy" boolean;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "on_prem_patch_sla_critical_hours" integer;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "pro_services_background_check_scope" varchar(20);--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "pro_services_nda_in_place" boolean;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "pro_services_customer_premises_policy" boolean;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "managed_privileged_access_mgmt" boolean;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "managed_session_recording" boolean;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "managed_on_call_24x7" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "accept_right_to_audit" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "has_subprocessors" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "subprocessor_list" text;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "data_return_on_termination" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "dpa_available" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "notify_on_location_change" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "incident_assistance_commitment" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "notify_material_changes" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "has_exit_plan" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "incident_sla_hours" integer;--> statement-breakpoint
CREATE INDEX "idx_asset_service_type" ON "asset" USING btree ("service_type");--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "incident_sla_hours";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "is_saas";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "is_on_prem";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "is_professional_services";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "is_managed_service";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "accept_right_to_audit";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "has_subprocessors";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "subprocessor_list";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "data_return_on_termination";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "dpa_available";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "service_description";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "data_processing_locations";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "notify_on_location_change";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "incident_assistance_commitment";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "notify_material_changes";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "has_exit_plan";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "saas_hosting_region";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "saas_encryption_at_rest";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "saas_encryption_in_transit";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "saas_mfa_enforced";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "saas_rto_hours";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "on_prem_sbom_provided";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "on_prem_signed_releases";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "on_prem_vulnerability_disclosure_policy";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "on_prem_patch_sla_critical_hours";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "pro_services_background_check_scope";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "pro_services_nda_in_place";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "pro_services_customer_premises_policy";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "managed_privileged_access_mgmt";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "managed_session_recording";--> statement-breakpoint
ALTER TABLE "company" DROP COLUMN "managed_on_call_24x7";