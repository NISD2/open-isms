-- migration-safety:allow: the column is added in this same migration, so every row holds NULL and
-- the partial index covers no row, which means the uniqueness cannot fail on existing data. "user"
-- has one row per login account, so the write lock of a plain build lasts one short scan.
ALTER TABLE "user" ADD COLUMN "google_subject" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_google_subject" ON "user" USING btree ("google_subject") WHERE "user"."google_subject" IS NOT NULL;