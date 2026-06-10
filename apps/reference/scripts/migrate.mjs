/**
 * Runtime migration runner for the open-isms reference app.
 *
 * Runs at container start (chained before `node server.js` in the Dockerfile
 * CMD). Iterates the two OSS migration chains and applies any unapplied
 * migrations. Reimplements drizzle-orm/pg-core/dialect.cjs's skip logic
 * using only `pg`, so the runtime image doesn't need drizzle-kit.
 *
 *   packages/grc-data-model/drizzle  → __drizzle_migrations_grc
 *   packages/isms-schema/drizzle     → __drizzle_migrations_isms
 *
 * The third chain (saas) from the parent monorepo is intentionally absent:
 * SaaS-only tables (lead, email_otp, billing) stay private. If you're
 * extending this app and adding tables, write a new drizzle dir for those
 * tables and append an entry to `dirs` below.
 *
 * Run from the workspace root (Dockerfile sets WORKDIR=/app):
 *   node apps/open-isms/scripts/migrate.mjs
 */

import { Client } from "pg";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const dirs = [
  {
    label: "grc",
    folder: "./packages/grc-data-model/drizzle",
    table: "__drizzle_migrations_grc",
    sentinelTable: "compliance_framework",
  },
  {
    label: "isms",
    folder: "./packages/isms-schema/drizzle",
    table: "__drizzle_migrations_isms",
    sentinelTable: "audit_log",
  },
  {
    label: "auth",
    folder: "./apps/open-isms/drizzle",
    table: "__drizzle_migrations_auth",
    sentinelTable: "auth_user",
  },
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL not set");
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
      console.warn(`[migrate ${label}] no journal at ${folder} — skipping`);
      continue;
    }

    const lastRes = await client.query(
      `SELECT created_at FROM drizzle.${table} ORDER BY created_at DESC LIMIT 1`,
    );
    let lastApplied = lastRes.rows[0]?.created_at ?? 0;

    // Convergence: if our bookkeeping is empty but the sentinel table from
    // the baseline already exists, the schema was created by a previous
    // migration setup (likely the upstream nisd2.eu monorepo's combined
    // chain). Record the baseline as applied so re-running its CREATE
    // statements doesn't crash.
    if (Number(lastApplied) === 0 && journal.entries.length > 0) {
      const sentinelRes = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) AS exists`,
        [sentinelTable],
      );
      if (sentinelRes.rows[0].exists) {
        const baseline = journal.entries[0];
        const hash = createHash("sha256")
          .update(readFileSync(`${folder}/${baseline.tag}.sql`, "utf-8"))
          .digest("hex");
        await client.query(
          `INSERT INTO drizzle.${table} ("hash", "created_at") VALUES ($1, $2)`,
          [hash, baseline.when],
        );
        lastApplied = baseline.when;
        console.log(
          `[migrate ${label}] sentinel "${sentinelTable}" present — ${baseline.tag} recorded as already-applied`,
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
