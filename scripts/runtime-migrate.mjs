/**
 * Runtime migration runner — used inside the Coolify runner container.
 *
 * Why this exists instead of `bun run db:migrate` at build time:
 *
 *   Coolify's build container runs in a Docker BuildKit network namespace
 *   that does not consistently reach the Coolify-managed Postgres host
 *   (e.g. `wgskcg80ko4w88gs8o00w4c8`), even with `--add-host` and
 *   `--network host`. The runtime container, by contrast, joins the same
 *   Coolify compose network as the DB and can connect.
 *
 * Why not drizzle-kit:
 *
 *   drizzle-kit is a devDependency — not present in the lean runner image.
 *   `pg` IS in production deps (declared in next.config.ts's
 *   `serverExternalPackages` so it's included in the standalone node_modules).
 *   This script reimplements drizzle-orm's pg-core migrator behaviour
 *   (verified against node_modules/drizzle-orm/pg-core/dialect.cjs):
 *
 *     1. CREATE SCHEMA IF NOT EXISTS drizzle
 *     2. CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations_<pkg>
 *     3. SELECT MAX(created_at) FROM the table
 *     4. For each journal entry with `when > lastDbMigration.created_at`,
 *        wrap the SQL in a transaction, apply statements, INSERT
 *        (hash, when) — hash matches drizzle's createHash("sha256").update(query).digest("hex")
 *
 * The three chains run independently against their own per-package
 * bookkeeping tables — see docs/migrations.md.
 */

import { Client } from "pg";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Each chain carries a sentinel table — a known table from its baseline
// migration. If the sentinel exists in `public` but the chain's per-package
// bookkeeping table is empty, the schema was created by the old single-chain
// migration setup (pre-Pattern-1 split), and the baseline is recorded as
// already-applied instead of re-running CREATE TYPE / CREATE TABLE against
// an existing schema. See the convergence block below.
const dirs = [
  {
    label: "grc",
    folder: "./packages/grc-data-model/drizzle",
    table: "__drizzle_migrations_grc",
    // compliance_framework not "framework" — the latter is just an ENUM type
    // in the prod schema; the table is compliance_framework. Verified against
    // a local restore of the prod backup before this commit.
    sentinelTable: "compliance_framework",
  },
  {
    label: "isms",
    folder: "./packages/isms-schema/drizzle",
    table: "__drizzle_migrations_isms",
    sentinelTable: "audit_log",
  },
  {
    label: "saas",
    folder: "./drizzle",
    table: "__drizzle_migrations_saas",
    sentinelTable: "lead",
  },
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL not set — cannot migrate");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();
console.log("[migrate] connected to database");

try {
  await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);

  for (const { label, folder, table, sentinelTable } of dirs) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.${table} (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `);

    let journal;
    try {
      journal = JSON.parse(readFileSync(`${folder}/meta/_journal.json`, "utf-8"));
    } catch (err) {
      console.warn(`[migrate ${label}] no journal at ${folder}/meta/_journal.json — skipping`);
      continue;
    }

    const lastRes = await client.query(
      `SELECT created_at FROM drizzle.${table} ORDER BY created_at DESC LIMIT 1`,
    );
    let lastApplied = lastRes.rows[0]?.created_at ?? 0;

    // Self-convergence: if our bookkeeping is empty but the sentinel table
    // already exists in the schema, the DB was migrated under the pre-split
    // single-chain setup. Record the baseline (first journal entry) as
    // already-applied so re-running its CREATE TYPE / CREATE TABLE does not
    // crash. Any post-baseline migrations still go through the normal apply
    // loop because their `when` is greater than the baseline's.
    if (Number(lastApplied) === 0) {
      const sentinelRes = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) AS exists`,
        [sentinelTable],
      );
      if (sentinelRes.rows[0].exists && journal.entries.length > 0) {
        const baseline = journal.entries[0];
        const sqlPath = `${folder}/${baseline.tag}.sql`;
        const hash = createHash("sha256")
          .update(readFileSync(sqlPath, "utf-8"))
          .digest("hex");
        await client.query(
          `INSERT INTO drizzle.${table} ("hash", "created_at") VALUES ($1, $2)`,
          [hash, baseline.when],
        );
        lastApplied = baseline.when;
        console.log(
          `[migrate ${label}] sentinel "${sentinelTable}" present — ${baseline.tag} recorded as already-applied (convergence)`,
        );
      }
    }

    let appliedCount = 0;
    for (const entry of journal.entries) {
      if (Number(lastApplied) >= entry.when) continue;

      const sqlPath = `${folder}/${entry.tag}.sql`;
      const sql = readFileSync(sqlPath, "utf-8");
      const hash = createHash("sha256").update(sql).digest("hex");

      console.log(`[migrate ${label}] applying ${entry.tag}`);

      await client.query("BEGIN");
      try {
        for (const stmt of sql.split("--> statement-breakpoint")) {
          const s = stmt.trim();
          if (s) await client.query(s);
        }
        await client.query(
          `INSERT INTO drizzle.${table} ("hash", "created_at") VALUES ($1, $2)`,
          [hash, entry.when],
        );
        await client.query("COMMIT");
        appliedCount++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[migrate ${label}] FAILED on ${entry.tag}:`, err.message);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log(`[migrate ${label}] up to date — 0 new migrations`);
    } else {
      console.log(`[migrate ${label}] applied ${appliedCount} migration(s)`);
    }
  }

  console.log("[migrate] all chains complete");
} finally {
  await client.end();
}
