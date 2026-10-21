-- migration-safety:allow: the check is on "via", added in this same migration with the default
-- 'app', so every existing row satisfies it by construction. The index cannot be built
-- CONCURRENTLY on this runner (drizzle-kit migrate runs every migration in one transaction, see
-- 0009), so it holds a write lock on audit_log while it builds: seconds at the row counts this
-- product carries today, as in 0009. An instance with a long trail should build the index by hand
-- with CONCURRENTLY before upgrading; IF NOT EXISTS below makes this a no-op when they have.
ALTER TABLE "audit_log" ADD COLUMN "via" varchar(8) DEFAULT 'app' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_mcp_company_created" ON "audit_log" USING btree ("company_id","created_at") WHERE "audit_log"."via" = 'mcp';--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_via" CHECK ("audit_log"."via" in ('app', 'mcp'));
