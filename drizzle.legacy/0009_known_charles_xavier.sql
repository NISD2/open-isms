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
CREATE TABLE "incident_broadcast" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"customer_relationship_id" uuid NOT NULL,
	"status" "supplier_publication_broadcast_status" DEFAULT 'queued' NOT NULL,
	"sent_at" timestamp,
	"delivery_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset" DROP CONSTRAINT "asset_customer_relationship_id_supplier_id_fk";
--> statement-breakpoint
ALTER TABLE "incident" DROP CONSTRAINT "incident_customer_relationship_id_supplier_id_fk";
--> statement-breakpoint
DROP INDEX "idx_asset_customer_relationship";--> statement-breakpoint
DROP INDEX "idx_asset_service_type";--> statement-breakpoint
DROP INDEX "idx_incident_customer_relationship";--> statement-breakpoint
DROP INDEX "idx_incident_broadcast_status";--> statement-breakpoint
ALTER TABLE "asset_supplier_offering" ADD CONSTRAINT "asset_supplier_offering_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_supplier_offering" ADD CONSTRAINT "asset_supplier_offering_customer_relationship_id_supplier_id_fk" FOREIGN KEY ("customer_relationship_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_broadcast" ADD CONSTRAINT "incident_broadcast_incident_id_incident_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incident"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_broadcast" ADD CONSTRAINT "incident_broadcast_customer_relationship_id_supplier_id_fk" FOREIGN KEY ("customer_relationship_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_asset_supplier_offering_asset" ON "asset_supplier_offering" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_asset_supplier_offering_relationship" ON "asset_supplier_offering" USING btree ("customer_relationship_id");--> statement-breakpoint
CREATE INDEX "idx_asset_supplier_offering_service_type" ON "asset_supplier_offering" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_incident_broadcast_incident" ON "incident_broadcast" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "idx_incident_broadcast_relationship" ON "incident_broadcast" USING btree ("customer_relationship_id");--> statement-breakpoint
CREATE INDEX "idx_incident_broadcast_status" ON "incident_broadcast" USING btree ("status");--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "customer_relationship_id";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "service_type";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "service_description";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "data_processing_locations";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "saas_hosting_region";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "on_prem_sbom_provided";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "on_prem_signed_releases";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "on_prem_vulnerability_disclosure_policy";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "on_prem_patch_sla_critical_hours";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "pro_services_background_check_scope";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "pro_services_nda_in_place";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "pro_services_customer_premises_policy";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "managed_privileged_access_mgmt";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "managed_session_recording";--> statement-breakpoint
ALTER TABLE "asset" DROP COLUMN "managed_on_call_24x7";--> statement-breakpoint
ALTER TABLE "incident" DROP COLUMN "customer_relationship_id";--> statement-breakpoint
ALTER TABLE "incident" DROP COLUMN "broadcast_status";--> statement-breakpoint
ALTER TABLE "incident" DROP COLUMN "broadcast_sent_at";--> statement-breakpoint
ALTER TABLE "incident" DROP COLUMN "broadcast_count";