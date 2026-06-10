#!/usr/bin/env bun
/**
 * One-time prod-DB convergence for the split-migration architecture.
 *
 * BEFORE THIS BRANCH, NIS2 had a single drizzle/ directory whose 16
 * migrations covered every table (GRC + ISMS + SaaS). Prod databases
 * were built from those migrations and the drizzle.__drizzle_migrations
 * table tracks the 16 hashes.
 *
 * AFTER THIS BRANCH, migrations are split across three packages, each
 * with its OWN bookkeeping table to keep timelines independent:
 *
 *   packages/grc-data-model/drizzle  → drizzle.__drizzle_migrations_grc
 *   packages/isms-schema/drizzle     → drizzle.__drizzle_migrations_isms
 *   drizzle/                          → drizzle.__drizzle_migrations_saas
 *
 * Why per-package tables and not a shared one:
 *
 *   drizzle-orm's migrator skips migrations using a timestamp comparison
 *   `lastDbMigration.created_at < migration.folderMillis`, NOT a hash
 *   lookup. With a SHARED __drizzle_migrations across three journals, a
 *   newer GRC migration would advance lastDbMigration past an older ISMS
 *   migration's folderMillis, causing the ISMS one to be silently skipped
 *   on its next run. Per-package tables eliminate the race.
 *
 * Each package has a *fresh* 0000 baseline that CREATEs its tables. On
 * existing prod those tables already exist, so naïvely running the new
 * baselines would error with "table already exists". This script writes
 * the baseline hash + the baseline's recorded folderMillis (from its
 * meta/_journal.json) into the corresponding per-package table, so
 * drizzle-orm sees the baseline as already applied.
 *
 * Usage:
 *
 *   # Inspect what would change (no DB writes):
 *   bun run scripts/converge-prod-migrations.ts
 *
 *   # Actually mark baselines as applied (DB writes):
 *   bun run scripts/converge-prod-migrations.ts --apply
 *
 * Run this ONCE per prod DB, BEFORE the first deploy that uses the
 * split chain (bun --cwd packages/grc-data-model run db:migrate && …).
 *
 * Safe to re-run: each INSERT is guarded by a (hash, table) uniqueness check.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

const baselines = [
  {
    label: "grc-data-model",
    journal: "packages/grc-data-model/drizzle/meta/_journal.json",
    migrationsDir: "packages/grc-data-model/drizzle",
    table: "__drizzle_migrations_grc",
  },
  {
    label: "isms-schema",
    journal: "packages/isms-schema/drizzle/meta/_journal.json",
    migrationsDir: "packages/isms-schema/drizzle",
    table: "__drizzle_migrations_isms",
  },
  {
    label: "nis2-saas",
    journal: "drizzle/meta/_journal.json",
    migrationsDir: "drizzle",
    table: "__drizzle_migrations_saas",
  },
] as const;

interface ResolvedBaseline {
  label: string;
  table: string;
  hash: string;
  folderMillis: number;
  sqlFile: string;
}

/**
 * Mirror what drizzle-orm's migrator does to compute the hash it expects
 * to see in `__drizzle_migrations.hash`:
 *
 *   const query = readFileSync(path).toString();
 *   const hash  = createHash("sha256").update(query).digest("hex");
 *
 * Source: node_modules/drizzle-orm/migrator.cjs.
 */
function resolveBaseline(b: typeof baselines[number]): ResolvedBaseline {
  const journal = JSON.parse(readFileSync(b.journal, "utf-8")) as Journal;
  const entry = journal.entries[0];
  if (!entry) {
    throw new Error(`No entries in ${b.journal} — has a baseline been generated?`);
  }
  const sqlFile = `${b.migrationsDir}/${entry.tag}.sql`;
  const query = readFileSync(sqlFile).toString();
  const hash = createHash("sha256").update(query).digest("hex");
  return {
    label: b.label,
    table: b.table,
    hash,
    folderMillis: entry.when,
    sqlFile,
  };
}

async function main() {
  const apply = process.argv.includes("--apply");

  console.log("=".repeat(72));
  console.log("Prod-DB convergence — split-migration cutover");
  console.log("=".repeat(72));
  console.log();

  const rows = baselines.map(resolveBaseline);

  console.log("Baselines to mark applied (one row per package, in its own table):");
  console.log();
  for (const r of rows) {
    console.log(`  ${r.label.padEnd(18)}  →  drizzle.${r.table}`);
    console.log(`    hash         ${r.hash}`);
    console.log(`    folderMillis ${r.folderMillis}  (${new Date(r.folderMillis).toISOString()})`);
    console.log(`    file         ${r.sqlFile}`);
    console.log();
  }

  if (!apply) {
    console.log("Dry run. Pass --apply to insert these into the three");
    console.log("drizzle.__drizzle_migrations_* tables on $DATABASE_URL.");
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("error: DATABASE_URL not set");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);

    let inserted = 0;
    let skipped = 0;
    for (const r of rows) {
      // drizzle-orm creates each migrations table lazily on first
      // migrate; we have to create them up-front so the INSERT lands
      // somewhere. Schema matches drizzle-orm's table definition exactly.
      await client.query(`
        CREATE TABLE IF NOT EXISTS drizzle.${r.table} (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `);

      const existing = await client.query(
        `SELECT id FROM drizzle.${r.table} WHERE hash = $1`,
        [r.hash],
      );
      if (existing.rowCount && existing.rowCount > 0) {
        console.log(`  skip   ${r.label} (already in drizzle.${r.table})`);
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO drizzle.${r.table} (hash, created_at) VALUES ($1, $2)`,
        [r.hash, r.folderMillis],
      );
      console.log(`  insert ${r.label} → drizzle.${r.table}`);
      inserted++;
    }
    console.log();
    console.log(`Done. ${inserted} inserted, ${skipped} skipped.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
