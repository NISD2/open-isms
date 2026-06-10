import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Usage:
 *   bun db:generate   — Generate SQL migrations from schema changes
 *   bun db:migrate    — Apply pending migrations to the database
 *   bun db:studio     — Open Drizzle Studio for visual database browsing
 *
 * NEVER use `drizzle-kit push` — always generate migrations and review them.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

export default defineConfig({
  // SaaS-only schemas. The GRC layer migrations live in
  // packages/grc-data-model/drizzle and the ISMS-process migrations live
  // in packages/isms-schema/drizzle — each is generated against its own
  // drizzle.config.ts so the OSS packages own their respective migration
  // histories.
  //
  // NOTE: schema/enums.ts is intentionally NOT in this list. That file is
  // a re-export of @nisd2/isms-schema/enums — including it here causes
  // drizzle-kit to follow the re-export and duplicate every ISMS enum's
  // CREATE TYPE in the SaaS baseline, which then fails on the second run
  // with "type already exists". SaaS tables still reference ISMS enums
  // via TS imports (drizzle-kit resolves them for the column type) but
  // the CREATE TYPE statements live only in the ISMS baseline.
  schema: [
    "./schema/tables/*.ts",
    "./schema/modules/**/*.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  // Per-package bookkeeping. The legacy consolidated migrations are
  // tracked in drizzle.__drizzle_migrations (untouched). New SaaS-only
  // migrations get their own table so they don't commingle with legacy
  // history or with the grc / isms chains.
  migrations: { table: "__drizzle_migrations_saas", schema: "drizzle" },
  dbCredentials: { url },
});
