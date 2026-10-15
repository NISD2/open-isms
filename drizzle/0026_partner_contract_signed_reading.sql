-- migration-safety:allow: both CHECKs pass when signed_reading_locale and
-- signed_translation_sha256 are NULL, and both columns are added empty in this same migration, so
-- every existing row (accepted or not) passes them. The release still serving writes neither column.
ALTER TABLE "partner_contract" ADD COLUMN "signed_reading_locale" varchar(10);--> statement-breakpoint
ALTER TABLE "partner_contract" ADD COLUMN "signed_translation_sha256" varchar(64);--> statement-breakpoint
ALTER TABLE "partner_contract" ADD CONSTRAINT "partner_contract_signed_reading" CHECK ("partner_contract"."signed_reading_locale" is null
        or ("partner_contract"."signed_at" is not null
          and ("partner_contract"."signed_reading_locale" = "partner_contract"."locale"::text
            or ("partner_contract"."locale" = 'en' and "partner_contract"."signed_reading_locale" in ('cs')))));--> statement-breakpoint
ALTER TABLE "partner_contract" ADD CONSTRAINT "partner_contract_signed_translation" CHECK (("partner_contract"."signed_translation_sha256" is null)
        = ("partner_contract"."signed_reading_locale" is null or "partner_contract"."signed_reading_locale" = "partner_contract"."locale"::text));