CREATE TABLE "company_two_factor" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_two_factor" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"secret_encrypted" text,
	"enabled_at" timestamp,
	"recovery_code_hashes" text[] DEFAULT '{}' NOT NULL,
	"last_used_step" integer DEFAULT 0 NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"pending_secret_encrypted" text,
	"pending_recovery_code_hashes" text[],
	"pending_started_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_two_factor_enabled_whole" CHECK (("user_two_factor"."enabled_at" is null) = ("user_two_factor"."secret_encrypted" is null)),
	CONSTRAINT "user_two_factor_pending_whole" CHECK (("user_two_factor"."pending_started_at" is null) = ("user_two_factor"."pending_secret_encrypted" is null)
        and ("user_two_factor"."pending_started_at" is null) = ("user_two_factor"."pending_recovery_code_hashes" is null)),
	CONSTRAINT "user_two_factor_off_without_codes" CHECK ("user_two_factor"."enabled_at" is not null or cardinality("user_two_factor"."recovery_code_hashes") = 0)
);
--> statement-breakpoint
ALTER TABLE "company_two_factor" ADD CONSTRAINT "company_two_factor_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_two_factor" ADD CONSTRAINT "company_two_factor_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_two_factor" ADD CONSTRAINT "user_two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;