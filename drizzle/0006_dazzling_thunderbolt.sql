CREATE TABLE "data_erasure_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_ref" varchar(64) NOT NULL,
	"subject_user_id" uuid NOT NULL,
	"subject_email" varchar(320),
	"subject_email_hash" varchar(64) NOT NULL,
	"subject_name" varchar(255),
	"company_id" uuid,
	"company_name" varchar(255),
	"request_received_at" timestamp,
	"request_channel" varchar(100),
	"rights_invoked" text,
	"legal_basis" varchar(255),
	"erased_at" timestamp DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"actor_email" varchar(320) NOT NULL,
	"method" varchar(20) NOT NULL,
	"company_torn_down" boolean DEFAULT false NOT NULL,
	"scope" jsonb NOT NULL,
	"notes" text,
	"retention_until" timestamp NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "data_erasure_log_case_ref_unique" UNIQUE("case_ref")
);
--> statement-breakpoint
CREATE INDEX "idx_data_erasure_log_email_hash" ON "data_erasure_log" USING btree ("subject_email_hash");--> statement-breakpoint
CREATE INDEX "idx_data_erasure_log_erased_at" ON "data_erasure_log" USING btree ("erased_at");--> statement-breakpoint
CREATE INDEX "idx_data_erasure_log_subject_user" ON "data_erasure_log" USING btree ("subject_user_id");