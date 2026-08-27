#!/usr/bin/env bun
/**
 * The two ways a migration bricks somebody else's instance, caught here rather
 * than on their server. See docs/migration-policy.md rule 3.
 *
 * 1. A constraint added in one step. CI builds its schema from scratch, so a
 *    bare `SET NOT NULL` or a new `UNIQUE` index passes by construction and
 *    fails on a database with years of real tenant data in it: nulls where you
 *    did not expect them, duplicates the constraint rejects.
 *
 * 2. `-- migrate:no-transaction` used for anything other than the one thing it
 *    exists for. That marker turns off the all-or-nothing guarantee for a file,
 *    so a failure halfway leaves the schema partly changed AND unrecorded — the
 *    next boot retries from the top and hits "already exists". The only reason
 *    to reach for it is CREATE INDEX CONCURRENTLY, which Postgres refuses to
 *    run inside a transaction. Any other use is someone silencing an error.
 *
 * Both are opt-out-able with an inline comment, because there are real
 * exceptions — a brand-new table has no existing rows to violate anything. The
 * point is that the exception becomes visible in review instead of implicit.
 *
 *   bun scripts/check-migration-safety.ts
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CHAINS = [
  "packages/grc-data-model/drizzle",
  "packages/isms-schema/drizzle",
  "drizzle",
] as const;

const ALLOW = "migration-safety:allow";
const NO_TRANSACTION = /^\s*--\s*migrate:no-transaction\b/m;

type Finding = { readonly file: string; readonly problem: string; readonly remedy: string };

const root = fileURLToPath(new URL("..", import.meta.url));

const git = (args: readonly string[]): string =>
  execFileSync("git", [...args], { cwd: root, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });

/**
 * Migrations that shipped in a release are immutable (rule 1), so they cannot
 * be annotated and there is nothing to be done about them. Only what has not
 * shipped yet is actionable.
 */
const shippedAlready = (): ReadonlySet<string> => {
  const tags = git(["tag", "--list", "v*", "--sort=-v:refname"]).trim();
  if (tags === "") return new Set();
  const latest = tags.split("\n")[0];
  const listed = git(["ls-tree", "-r", "--name-only", latest]).trim();
  return new Set(listed === "" ? [] : listed.split("\n"));
};

/**
 * Tables created by this same migration have no existing rows, so an index or
 * constraint on them cannot fail on anybody's data. Only pre-existing tables
 * carry that risk.
 *
 * This reads SQL with patterns rather than a parser, which is the tool this
 * repo normally avoids. It is a heuristic guard with a visible opt-out, not a
 * source of truth: a miss costs a review comment, and a false positive costs
 * one line. A real parser would be a dependency for a lint rule.
 */
const tablesCreatedHere = (sql: string): ReadonlySet<string> => {
  const names = [...sql.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([\w.]+)"?/gi)];
  return new Set(names.map((m) => (m[1] ?? "").toLowerCase()));
};

const targetOf = (sql: string, pattern: RegExp): string => {
  const m = sql.match(pattern);
  return (m?.[1] ?? "").toLowerCase();
};

/** Comments cannot violate a constraint; only statements can. */
const stripComments = (sql: string): string =>
  sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

const RISKY = [
  {
    pattern: /\bSET\s+NOT\s+NULL\b/i,
    target: /\bALTER\s+TABLE\s+(?:ONLY\s+)?"?([\w.]+)"?/i,
    problem: "adds NOT NULL in one step",
    remedy:
      "Add the column nullable, backfill in the same migration, and set NOT NULL in a later one. Existing rows are why this passes CI and fails on a real database.",
  },
  {
    pattern: /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b(?![\s\S]*\bCONCURRENTLY\b)/i,
    target: /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b[\s\S]*?\bON\s+"?([\w.]+)"?/i,
    problem: "creates an index without CONCURRENTLY",
    remedy:
      "On a large table this holds a write lock for the duration. Use CREATE INDEX CONCURRENTLY with `-- migrate:no-transaction`, or mark this allowed if the table is small or new.",
  },
  {
    pattern: /\bADD\s+CONSTRAINT\b(?![\s\S]*\bNOT\s+VALID\b)/i,
    target: /\bALTER\s+TABLE\s+(?:ONLY\s+)?"?([\w.]+)"?/i,
    problem: "adds a constraint without NOT VALID",
    remedy:
      "Add it NOT VALID, then VALIDATE CONSTRAINT in a later migration. Validating immediately scans every existing row and fails on the first that does not fit.",
  },
] as const;

const checkFile = (path: string): readonly Finding[] => {
  const raw = readFileSync(path, "utf-8");
  const sql = stripComments(raw);
  if (raw.includes(ALLOW)) return [];

  const findings: Finding[] = [];

  // The escape hatch is only ever justified by CONCURRENTLY.
  if (NO_TRANSACTION.test(raw) && !/\bCONCURRENTLY\b/i.test(sql)) {
    findings.push({
      file: path,
      problem: "uses -- migrate:no-transaction without CONCURRENTLY",
      remedy:
        "That marker turns off the all-or-nothing guarantee: a failure halfway leaves the schema partly changed and unrecorded, so the next boot retries and hits 'already exists'. CREATE INDEX CONCURRENTLY is the only statement that needs it.",
    });
  }

  const fresh = tablesCreatedHere(sql);
  for (const { pattern, target, problem, remedy } of RISKY) {
    if (!pattern.test(sql)) continue;
    if (fresh.has(targetOf(sql, target))) continue;
    findings.push({ file: path, problem, remedy });
  }

  return findings;
};

const shipped = shippedAlready();

const findings = CHAINS.flatMap((chain) => {
  const dir = resolve(root, chain);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .filter((name) => !shipped.has(`${chain}/${name}`))
    .flatMap((name) => checkFile(resolve(dir, name)));
});

if (findings.length > 0) {
  console.error(
    `[migration-safety] ${findings.length} finding(s). These pass CI against an empty schema and fail on a database with real data:\n`,
  );
  for (const { file, problem, remedy } of findings) {
    console.error(`  ${file.replace(root, "")}`);
    console.error(`    ${problem}`);
    console.error(`    ${remedy}\n`);
  }
  console.error(
    `See docs/migration-policy.md rule 3. If an exception is genuinely correct, add a\n  -- ${ALLOW}: <why>\ncomment to the migration so the reasoning is visible in review.`,
  );
} else {
  console.log("[migration-safety] no one-step constraints, no unjustified no-transaction markers");
}

process.exit(findings.length > 0 ? 1 : 0);
