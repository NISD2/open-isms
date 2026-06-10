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
CREATE TABLE "email_otp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"consumed_at" timestamp,
	"expires_at" timestamp NOT NULL,
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
ALTER TABLE "company_invite" ADD CONSTRAINT "company_invite_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_invite" ADD CONSTRAINT "company_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_invite" ADD CONSTRAINT "company_invite_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invite" ADD CONSTRAINT "supplier_invite_from_company_id_company_id_fk" FOREIGN KEY ("from_company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invite" ADD CONSTRAINT "supplier_invite_accepted_by_company_id_company_id_fk" FOREIGN KEY ("accepted_by_company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_certification" ADD CONSTRAINT "company_certification_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bsi_incident_report" ADD CONSTRAINT "bsi_incident_report_incident_id_incident_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incident"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bsi_incident_report" ADD CONSTRAINT "bsi_incident_report_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bsi_registration" ADD CONSTRAINT "bsi_registration_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invite_token" ON "company_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_invite_company" ON "company_invite" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_email_otp_lookup" ON "email_otp" USING btree ("email","purpose");--> statement-breakpoint
CREATE INDEX "idx_email_otp_cleanup" ON "email_otp" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_lead_email" ON "lead" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_lead_created" ON "lead" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lead_intent" ON "lead" USING btree ("intent");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_invite_pair" ON "supplier_invite" USING btree ("from_company_id","to_email");--> statement-breakpoint
CREATE INDEX "idx_supplier_invite_to_email" ON "supplier_invite" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "idx_company_cert_company" ON "company_certification" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_company_cert_valid_until" ON "company_certification" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_company_cert_type" ON "company_certification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_bsi_incident_report_incident" ON "bsi_incident_report" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "idx_bsi_incident_report_due" ON "bsi_incident_report" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "idx_bsi_incident_report_overdue" ON "bsi_incident_report" USING btree ("is_overdue");--> statement-breakpoint
CREATE INDEX "idx_bsi_registration_company" ON "bsi_registration" USING btree ("company_id");