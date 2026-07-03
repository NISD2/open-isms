ALTER TABLE "company" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Backfill: existing orgs get their earliest admin as owner (else earliest member).
UPDATE "company" c SET "owner_id" = (
  SELECT u.id FROM "user" u
  WHERE u.company_id = c.id
  ORDER BY (u.role = 'admin') DESC, u.created_at ASC
  LIMIT 1
) WHERE "owner_id" IS NULL;