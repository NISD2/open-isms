CREATE TABLE "advisory_partner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name" varchar(200) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advisory_partner_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "advisory_referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"partner" varchar(60) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"fee_cents" integer,
	"paid_at" timestamp,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "advisory_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar(40) NOT NULL,
	"trigger" varchar(40),
	"timeframe" varchar(40),
	"sector" varchar(120),
	"company_size" varchar(40),
	"contact_name" varchar(200),
	"company_name" varchar(500),
	"email" varchar(320) NOT NULL,
	"note" text,
	"source_path" varchar(500),
	"requirement_code" varchar(32),
	"referrer" varchar(1000),
	"locale" varchar(10),
	"forward_consent_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advisory_referral" ADD CONSTRAINT "advisory_referral_request_id_advisory_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."advisory_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_advisory_partner_active" ON "advisory_partner" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_advisory_referral_request" ON "advisory_referral" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_advisory_referral_sent" ON "advisory_referral" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_advisory_referral_partner" ON "advisory_referral" USING btree ("partner");--> statement-breakpoint
CREATE INDEX "idx_advisory_request_created" ON "advisory_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_advisory_request_topic" ON "advisory_request" USING btree ("topic");