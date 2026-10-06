CREATE TYPE "public"."partner_contract_locale" AS ENUM('de', 'en');--> statement-breakpoint
CREATE TABLE "partner_contract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(64) NOT NULL,
	"locale" "partner_contract_locale" NOT NULL,
	"partner_company" varchar(200) NOT NULL,
	"partner_contact_name" varchar(200),
	"partner_email" varchar(320),
	"commission_percent" integer NOT NULL,
	"commission_months" integer,
	"template_version" varchar(20) NOT NULL,
	"body" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_email" varchar(320) NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"signer_name" varchar(200),
	"signer_email" varchar(320),
	"signer_ip" varchar(64),
	"signer_user_agent" text,
	"signed_text_sha256" varchar(64),
	CONSTRAINT "partner_contract_token_unique" UNIQUE("token"),
	CONSTRAINT "partner_contract_commission_percent" CHECK ("partner_contract"."commission_percent" between 1 and 50),
	CONSTRAINT "partner_contract_commission_months" CHECK ("partner_contract"."commission_months" is null or "partner_contract"."commission_months" between 1 and 120),
	CONSTRAINT "partner_contract_acceptance_whole" CHECK (("partner_contract"."signed_at" is null) = ("partner_contract"."signer_name" is null)
        and ("partner_contract"."signed_at" is null) = ("partner_contract"."signer_email" is null)
        and ("partner_contract"."signed_at" is null) = ("partner_contract"."signed_text_sha256" is null)),
	CONSTRAINT "partner_contract_withdrawn_unsigned" CHECK ("partner_contract"."withdrawn_at" is null or "partner_contract"."signed_at" is null)
);
--> statement-breakpoint
CREATE INDEX "idx_partner_contract_created" ON "partner_contract" USING btree ("created_at");