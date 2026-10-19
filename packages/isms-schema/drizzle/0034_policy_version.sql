CREATE TABLE "policy_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"content_sha256" varchar(64) NOT NULL,
	"approved_by" uuid,
	"approver_role" varchar(255) NOT NULL,
	"approved_on" date NOT NULL,
	"approved_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_policy_version_approval" UNIQUE("policy_id","approved_at"),
	CONSTRAINT "policy_version_sha256_hex" CHECK ("policy_version"."content_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "policy_version_content_present" CHECK (length("policy_version"."content") > 0)
);
--> statement-breakpoint
ALTER TABLE "policy_version" ADD CONSTRAINT "policy_version_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_version" ADD CONSTRAINT "policy_version_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_version" ADD CONSTRAINT "policy_version_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_policy_version_policy" ON "policy_version" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_policy_version_company" ON "policy_version" USING btree ("company_id");