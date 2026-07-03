CREATE TABLE "data_erasure_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"subject_user_id" uuid,
	"feedback" text,
	"source" varchar(20) NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"completed_by" uuid
);
--> statement-breakpoint
CREATE INDEX "idx_data_erasure_request_status" ON "data_erasure_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_data_erasure_request_email" ON "data_erasure_request" USING btree ("email");