CREATE TYPE "public"."access_level" AS ENUM('free', 'grandfathered', 'full');--> statement-breakpoint
CREATE TYPE "public"."document_series" AS ENUM('invoice', 'credit_note');--> statement-breakpoint
CREATE TYPE "public"."invoice_source" AS ENUM('self_serve', 'admin');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('admin', 'member', 'reviewer', 'legal_reviewer');--> statement-breakpoint
CREATE TABLE "credit_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"qonto_credit_note_id" varchar(64) NOT NULL,
	"number" varchar(40) NOT NULL,
	"reason" varchar(500) NOT NULL,
	"refund_owed" boolean NOT NULL,
	"refund_done_at" timestamp,
	"refund_done_by_user_id" uuid,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_note_invoice_id_unique" UNIQUE("invoice_id"),
	CONSTRAINT "credit_note_qonto_credit_note_id_unique" UNIQUE("qonto_credit_note_id"),
	CONSTRAINT "credit_note_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "document_number_counter" (
	"series" "document_series" NOT NULL,
	"year" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "document_number_counter_series_year_pk" PRIMARY KEY("series","year")
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billing_account_id" uuid NOT NULL,
	"qonto_invoice_id" varchar(64) NOT NULL,
	"number" varchar(40) NOT NULL,
	"net_cents" integer NOT NULL,
	"issue_date" date NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"source" "invoice_source" NOT NULL,
	"created_by_user_id" uuid,
	"archived_pdf_key" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_qonto_invoice_id_unique" UNIQUE("qonto_invoice_id"),
	CONSTRAINT "invoice_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "company_membership" (
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_membership_user_id_company_id_pk" PRIMARY KEY("user_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "billing_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"qonto_client_id" varchar(64),
	"access_level" "access_level" DEFAULT 'free' NOT NULL,
	"renewal_canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_account_qonto_client_id_unique" UNIQUE("qonto_client_id")
);
--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "billing_account_id" uuid;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_refund_done_by_user_id_user_id_fk" FOREIGN KEY ("refund_done_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_billing_account_id_billing_account_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_membership" ADD CONSTRAINT "company_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_membership" ADD CONSTRAINT "company_membership_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_account" ADD CONSTRAINT "billing_account_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invoice_billing_account" ON "invoice" USING btree ("billing_account_id");--> statement-breakpoint
CREATE INDEX "idx_company_membership_company" ON "company_membership" USING btree ("company_id");--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_billing_account_id_billing_account_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_account"("id") ON DELETE no action ON UPDATE no action;