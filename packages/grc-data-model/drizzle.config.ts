import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration for @nisd2/grc-data-model.
 *
 * Owns the GRC entity model (framework, requirement, supplier, asset,
 * risk, incident) and its migration history. Consumers (apps/open-isms,
 * NIS2 monorepo) run `drizzle-kit migrate --config=...` against this
 * config BEFORE running any consumer-specific migrations.
 *
 * NEVER use `drizzle-kit push` — always generate migrations and review them.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

export default defineConfig({
  schema: ["./src/enums.ts", "./src/schema/*.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  // Per-package bookkeeping. drizzle-orm's migrator uses
  // `lastDbMigration.created_at < migration.folderMillis` to decide what to
  // apply; sharing one __drizzle_migrations across multiple journals (grc +
  // isms + saas) lets a newer GRC migration silently mask an older ISMS one
  // and vice versa. Per-package tables keep each chain's timeline isolated.
  migrations: { table: "__drizzle_migrations_grc", schema: "drizzle" },
  dbCredentials: { url },
});
