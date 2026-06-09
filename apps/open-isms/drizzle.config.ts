import { defineConfig } from "drizzle-kit";

/**
 * OSS open-isms auth-table migrations.
 *
 * Scope: just the Auth.js tables (auth_user, auth_verification_token).
 * The GRC and ISMS chains are owned by their respective packages and
 * migrated independently before this one runs — see
 * `scripts/migrate.mjs` for the chain order at startup.
 */
export default defineConfig({
  schema: "./lib/schema/auth.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/open_isms",
  },
  migrations: {
    table: "__drizzle_migrations_auth",
    schema: "drizzle",
  },
});
