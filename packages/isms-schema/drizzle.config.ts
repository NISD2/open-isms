import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration for @nisd2/isms-schema.
 *
 * Owns the ISMS-process tables (audit_log, evidence, sign_off_history,
 * organization, policies, training, etc.) and their migration history.
 *
 * Cross-package FK targets — `requirement`, `asset`, `compliance_framework`,
 * `risk`, `incident` — live in @nisd2/grc-data-model. Their tables must
 * exist BEFORE these migrations apply, so consumers run:
 *
 *   drizzle-kit migrate --config=packages/grc-data-model/drizzle.config.ts
 *   drizzle-kit migrate --config=packages/isms-schema/drizzle.config.ts
 *   (then any consumer-specific migrations)
 *
 * FK references to grc tables are emitted as raw `REFERENCES "<table>"("id")`
 * SQL — drizzle-kit reads the imports for type resolution but only emits
 * DDL for tables listed in the schema array here (isms-only).
 *
 * NEVER use `drizzle-kit push` — always generate migrations and review them.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

export default defineConfig({
  schema: ["./src/enums.ts", "./src/tables/*.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  // Per-package bookkeeping — see the matching note in
  // packages/grc-data-model/drizzle.config.ts. Each chain's timeline must
  // stay isolated to avoid timestamp-based skip races.
  migrations: { table: "__drizzle_migrations_isms", schema: "drizzle" },
  dbCredentials: { url },
});
