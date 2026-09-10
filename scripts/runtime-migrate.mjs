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
 * The transaction is the guarantee a self-hoster depends on: a migration that
 * fails leaves the database exactly as it was, because the bookkeeping INSERT
 * commits with the DDL or not at all. scripts/ci/migration-failure-drill.sh
 * proves it rather than asserting it.
 *
 * A migration whose first line is `-- migrate:no-transaction` runs outside one,
 * for statements Postgres refuses inside a transaction block. See
 * docs/migration-policy.md rule 3.
 *
 * The three chains run independently against their own per-package
 * bookkeeping tables — see docs/migrations.md.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";

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

// Fixed forever. Any process holding this advisory lock is migrating; every
// other instance waits rather than racing it. The pair is arbitrary but must
// never change, or two versions of this script would not exclude each other.
const LOCK_CLASS = 4919;
const LOCK_KEY = 1;

// How long to wait for another instance to finish migrating before giving up.
const LOCK_WAIT = process.env.MIGRATE_LOCK_WAIT ?? "300s";
// Ceiling on a single statement inside a migration. A DDL statement that
// cannot take its lock (a long-running query holding the table) fails the
// migration instead of blocking startup indefinitely — this shape has
// crash-looped a container before.
const LOCK_TIMEOUT = process.env.MIGRATE_LOCK_TIMEOUT ?? "10s";
const STATEMENT_TIMEOUT = process.env.MIGRATE_STATEMENT_TIMEOUT ?? "600s";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL not set — cannot migrate");
  process.exit(1);
}

const client = new Client({ connectionString: url });

// Postgres refusing the password is the single most common self-host failure
// after a reinstall, and until this block existed it surfaced as an unhandled
// rejection: forty lines of pg-protocol stack ending in `code: '28P01'`, which
// reads as a bug in the software rather than as leftover state on the disk.
//
// The cause is always the same. Docker keeps the database in a named volume
// that survives `docker compose down` and survives deleting the install
// directory, because compose derives the project name from the directory name
// and a new directory of the same name re-attaches the same volume. Postgres
// sets the password once, when initdb first creates that data directory, and
// never revisits it. So a second install that generates a new
// POSTGRES_PASSWORD hands us a password the database has never seen.
// Named in the messages so the copy-paste commands are already correct for
// this instance rather than for the defaults.
const { user, database } = (() => {
  try {
    const parsed = new URL(url);
    return {
      user: decodeURIComponent(parsed.username) || "openisms",
      database: decodeURIComponent(parsed.pathname.slice(1)) || "openisms",
    };
  } catch {
    return { user: "openisms", database: "openisms" };
  }
})();

// process.exit() discards anything still queued on stderr, and in the app
// container stderr is a pipe to the Docker log driver, where writes are
// asynchronous. Exiting straight after a kilobyte of console.error can
// truncate or lose the one artifact this whole path exists to produce. Wait
// for the write to drain, then leave.
async function bail(message) {
  await new Promise((resolve) => process.stderr.write(`${message}\n`, resolve));
  process.exit(1);
}

// Advice for a database that will not accept us. 28P01 gets the long form,
// because it is the common case, it has two different recoveries and picking
// the wrong one costs someone their data. Everything else gets a short form:
// a rethrow here dumps the same forty lines of pg-protocol internals that
// this block exists to stop, and "the host is not up yet" or "that database
// does not exist" reach it just as often on a Coolify-style deployment where
// compose's service_healthy gate does not apply.
try {
  await client.connect();
} catch (err) {
  if (err.code === "28P01") {
    await bail(`
[migrate] The database refused our password for ${user} (Postgres 28P01).

  Nothing is wrong with this release. The database on disk was created with a
  different password than the one this container was just given, which happens
  when POSTGRES_PASSWORD changes while the data directory stays. Deleting the
  install directory does not delete the data directory: it lives in a Docker
  volume, and a reinstall picks the same one back up.

  If there is nothing in this instance worth keeping, throw it away and let it
  be created again with the password you have now. This deletes the database,
  any uploaded evidence and any local backup archives, and cannot be undone:

      docker compose down -v
      docker compose up -d

  Your .env is left alone.

  If the instance holds data, keep it and tell the database the new password
  instead. This needs no old password, because Postgres trusts connections made
  from inside its own container:

      docker compose exec postgres psql -U ${user} -d ${database}
      \\password ${user}

  It asks for the password twice. Paste the POSTGRES_PASSWORD value from your
  .env, then \\q to leave, then:

      docker compose restart app

  Use \\password rather than writing the ALTER yourself: it prompts instead of
  taking the password on the command line, so nothing lands in your shell
  history or in the process list, and quotes in the password need no escaping.

  Full walkthrough: https://www.nisd2.eu/docs/self-hosting/troubleshooting
`);
  }

  await bail(`
[migrate] Could not connect to the database at ${database} as ${user}.

  ${err.code ? `Postgres reported ${err.code}. ` : ""}${err.message}

  The usual causes, in the order they are worth checking:

    the host in DATABASE_URL is wrong, or is not up yet
    the database named in DATABASE_URL does not exist (Postgres code 3D000),
      which is what a changed POSTGRES_DB looks like
    the password is wrong (28P01), which has its own message

  Nothing has been migrated, and the database is untouched.

  Full walkthrough: https://www.nisd2.eu/docs/self-hosting/troubleshooting
`);
}

console.log("[migrate] connected to database");

try {
  // Serialise the whole run. Without this, two replicas starting together
  // both read the same lastApplied and apply the same migrations twice.
  // lock_timeout applies to advisory locks too, so a stuck peer surfaces as
  // a clear error rather than an indefinite hang.
  await client.query(`SET lock_timeout = '${LOCK_WAIT}'`);
  try {
    await client.query(`SELECT pg_advisory_lock($1, $2)`, [LOCK_CLASS, LOCK_KEY]);
  } catch (err) {
    console.error(
      `[migrate] could not acquire the migration lock within ${LOCK_WAIT}. ` +
        `Another instance is migrating, or a previous run left a session open. ` +
        `Run exactly one instance during an upgrade.`,
    );
    throw err;
  }

  await client.query(`SET lock_timeout = '${LOCK_TIMEOUT}'`);
  await client.query(`SET statement_timeout = '${STATEMENT_TIMEOUT}'`);

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
    } catch {
      console.warn(
        `[migrate ${label}] no journal at ${folder}/meta/_journal.json — skipping`,
      );
      continue;
    }

    const appliedRes = await client.query(
      `SELECT hash, created_at FROM drizzle.${table} ORDER BY created_at DESC`,
    );
    const appliedHashes = new Map(
      appliedRes.rows.map((row) => [String(row.created_at), row.hash]),
    );
    let lastApplied = appliedRes.rows[0]?.created_at ?? 0;

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
      const sqlPath = `${folder}/${entry.tag}.sql`;
      const sql = readFileSync(sqlPath, "utf-8");
      const hash = createHash("sha256").update(sql).digest("hex");

      if (Number(lastApplied) >= entry.when) {
        // Applied migrations are immutable (see docs/migration-policy.md).
        // The hash has always been stored and never read back; comparing it
        // is how an edited migration becomes visible instead of silently
        // producing databases that disagree about what a version means.
        const recorded = appliedHashes.get(String(entry.when));
        if (recorded && recorded !== hash) {
          console.warn(
            `[migrate ${label}] WARNING: ${entry.tag} was applied with different SQL than the file now contains. ` +
              `This database and a freshly-installed one no longer agree. Report this with your version number.`,
          );
        }
        continue;
      }

      // Opt-out for statements Postgres refuses to run inside a transaction.
      // CREATE INDEX CONCURRENTLY is the one that matters: migration-policy.md
      // rule 3 recommends it on large tables, and without this a migration
      // following that advice fails at container start on every instance with
      // "cannot run inside a transaction block".
      //
      // The trade is explicit and belongs to whoever writes the migration: a
      // non-transactional migration that fails partway leaves the schema
      // partly changed and is NOT recorded as applied, so the next boot
      // retries it from the top. Every statement in such a file must therefore
      // be independently re-runnable — IF NOT EXISTS, or a guard.
      const nonTransactional = /^\s*--\s*migrate:no-transaction\b/m.test(sql);

      console.log(
        `[migrate ${label}] applying ${entry.tag}${nonTransactional ? " (no transaction)" : ""}`,
      );

      const statements = sql
        .split("--> statement-breakpoint")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt !== "");

      if (nonTransactional) {
        try {
          for (const stmt of statements) await client.query(stmt);
          await client.query(
            `INSERT INTO drizzle.${table} ("hash", "created_at") VALUES ($1, $2)`,
            [hash, entry.when],
          );
          appliedCount++;
        } catch (err) {
          console.error(
            `[migrate ${label}] FAILED on ${entry.tag} (no transaction — the schema may be partly changed, and this migration is not recorded as applied):`,
            err.message,
          );
          throw err;
        }
      } else {
        await client.query("BEGIN");
        try {
          for (const stmt of statements) await client.query(stmt);
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
    }

    if (appliedCount === 0) {
      console.log(`[migrate ${label}] up to date — 0 new migrations`);
    } else {
      console.log(`[migrate ${label}] applied ${appliedCount} migration(s)`);
    }
  }

  console.log("[migrate] all chains complete");

  // ---------------------------------------------------------------------
  // Framework reference data, once, on a database that has none.
  //
  // Migrations create the tables and correct the rows in them; nothing in the
  // chains inserts the frameworks themselves. Until this ran here, a fresh
  // install came up with an empty portal and the fix was a git clone, a bun
  // install and a seed script — three things a self-hoster should never need,
  // and the single most common reason a correct install looked broken.
  //
  // Guarded on an empty catalogue, so it happens exactly once and never
  // touches an instance that is in use. The file is upsert-only in any case.
  // Failure is logged and startup continues: reference data missing is a
  // portal with nothing in it, while refusing to boot over it would take down
  // an instance whose own data is fine.
  // ---------------------------------------------------------------------
  const seedPath = new URL("../db/framework-seed.sql", import.meta.url).pathname;

  try {
    const { rows } = await client.query(
      `SELECT count(*)::int AS n FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'requirement'`,
    );
    if (rows[0].n === 0) {
      console.log("[seed] no requirement table — skipping framework data");
    } else {
      const { rows: counted } = await client.query(
        `SELECT count(*)::int AS n FROM requirement`,
      );
      if (counted[0].n > 0) {
        console.log(`[seed] framework data present (${counted[0].n} requirements)`);
      } else {
        console.log("[seed] empty catalogue — loading db/framework-seed.sql");
        await client.query(readFileSync(seedPath, "utf-8"));
        const { rows: after } = await client.query(
          `SELECT count(*)::int AS n FROM requirement`,
        );
        console.log(`[seed] loaded ${after[0].n} requirements`);
      }
    }
  } catch (err) {
    console.warn(
      `[seed] could not load framework data: ${err.message}\n` +
        "[seed] the instance will start with an empty portal. Load it by hand with:\n" +
        "[seed]   docker compose exec -T postgres psql -U openisms -d openisms < framework-seed.sql",
    );
  }

  // ---------------------------------------------------------------------
  // First account, for an instance with no way to send mail.
  //
  // Sign-up verifies the address with a one-time code, so without a mail
  // transport nobody finishes registering. SMTP and Resend both solve that;
  // neither is available to someone evaluating on a laptop, behind a network
  // that blocks outbound 587, or on a genuinely offline machine.
  //
  // These two variables replace the verification email and nothing else. The
  // row written here is exactly what registering would have written, minus
  // the round trip: same bcrypt cost, same "member" role, no company. The
  // first company you create promotes you to admin through the normal path,
  // so this grants no privilege that signing up would not have.
  //
  // Deliberately NOT an upsert. An existing account is left alone, because a
  // variable that rewrites a password on every restart is a backdoor with a
  // friendly name: anyone who can read the compose file would own the account
  // permanently, and an operator who changed their password in the app would
  // find it silently reverted on the next deploy.
  // ---------------------------------------------------------------------
  await bootstrapAdmin(client);
} finally {
  // Session locks die with the connection, so this is belt-and-braces for the
  // case where the client is reused rather than ended.
  await client
    .query(`SELECT pg_advisory_unlock($1, $2)`, [LOCK_CLASS, LOCK_KEY])
    .catch(() => {});
  await client.end();
}

/**
 * Create the first account from BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD
 * when both are set and that address has no account yet.
 *
 * Validation mirrors app/api/auth/register/route.ts exactly (same address
 * shape, same 8-128 character range, same bcrypt cost of 12) so an account
 * made this way is indistinguishable from one made through the form. If the
 * rules there change, change them here.
 *
 * Never throws: a misconfigured variable is reported and skipped rather than
 * crash-looping a container whose own data is fine. The operator finds the
 * message when they cannot log in, which is the moment they go looking.
 */
async function bootstrapAdmin(client) {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";

  if (!email && !password) return;

  if (!email || !password) {
    console.error(
      "[bootstrap] set BOTH BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, or neither",
    );
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    console.error(`[bootstrap] BOOTSTRAP_ADMIN_EMAIL is not a usable address: ${email}`);
    return;
  }

  if (password.length < 8 || password.length > 128) {
    console.error(
      "[bootstrap] BOOTSTRAP_ADMIN_PASSWORD must be 8-128 characters, same as the sign-up form",
    );
    return;
  }

  try {
    const { rows: existing } = await client.query(
      `SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1`,
      [email],
    );
    if (existing.length > 0) {
      console.log(
        `[bootstrap] ${email} already has an account, leaving it untouched. ` +
          "Use the password-reset flow to change its password.",
      );
      return;
    }

    const { default: bcrypt } = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);
    const name = email.split("@")[0] || "Administrator";

    await client.query(
      `INSERT INTO "user" (email, name, password_hash, role, email_verified_at)
       VALUES ($1, $2, $3, 'member', now())`,
      [email, name, passwordHash],
    );

    console.log(
      `[bootstrap] created ${email}. Sign in, create your organisation, and then ` +
        "remove BOOTSTRAP_ADMIN_PASSWORD from the environment.",
    );
  } catch (err) {
    console.error(
      `[bootstrap] could not create the first account: ${err.message}\n` +
        "[bootstrap] the instance is otherwise fine; configure a mail transport " +
        "and register normally, or read the sign-in code out of this log.",
    );
  }
}
