CREATE TABLE "advisory_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar(40) NOT NULL,
	"trigger" varchar(40) NOT NULL,
	"timeframe" varchar(40) NOT NULL,
	"sector" varchar(120),
	"company_size" varchar(40),
	"contact_name" varchar(200) NOT NULL,
	"company_name" varchar(500) NOT NULL,
	"email" varchar(320) NOT NULL,
	"note" text,
	"source_path" varchar(500),
	"requirement_code" varchar(32),
	"locale" varchar(10),
	"forward_consent_at" timestamp NOT NULL,
	"forwarded_at" timestamp,
	"forwarded_to" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_advisory_request_created" ON "advisory_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_advisory_request_topic" ON "advisory_request" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "idx_advisory_request_forwarded" ON "advisory_request" USING btree ("forwarded_at");