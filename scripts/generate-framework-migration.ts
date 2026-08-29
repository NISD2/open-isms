#!/usr/bin/env bun
/**
 * Generate a data migration that syncs framework reference data into an
 * already-seeded database.
 *
 * Why this exists:
 *
 *   Framework metadata — legal references, CIR Annex points, priorities,
 *   review frequencies, satisfaction pairs — lives in `requirement` and
 *   `requirement_satisfaction` ROWS, not in the schema. Editing
 *   packages/grc-data-model changes what a fresh `drizzle/seed.ts` produces,
 *   but every already-seeded database (production included) keeps the old
 *   values forever: schema migrations do not touch row content, and nothing
 *   re-runs the seeder on deploy. Before this script the only remedy was to
 *   run a sync script by hand against the production database, which is both
 *   easy to forget and awkward to do at all — the runner image has no bun and
 *   the database is only reachable from inside the deploy network.
 *
 *   Emitting the sync as a numbered migration instead means
 *   scripts/runtime-migrate.mjs applies it at container start like any other
 *   migration: tracked in drizzle.__drizzle_migrations_saas, applied exactly
 *   once, rolled back and blocking startup if it fails.
 *
 * Usage, after changing framework data:
 *
 *   bun run scripts/generate-framework-migration.ts
 *
 * It writes drizzle/<next-idx>_framework_data_sync.sql and appends the journal
 * entry, so no one hand-edits meta/_journal.json or picks a `when` timestamp.
 * Pass --dry-run to print the SQL to stdout without writing anything.
 *
 * Second mode, --seed-file:
 *
 *   bun run scripts/generate-framework-migration.ts --seed-file
 *
 * Writes db/framework-seed.sql instead of a migration: the same upserts, plus
 * the two `compliance_framework` rows drizzle/seed.ts creates, joined with
 * plain semicolons so `psql -f` can run it. That file is what a self-hoster
 * applies to fill a fresh database, with no checkout, no bun and no demo
 * tenant. `bun run check:framework-seed` fails CI when it is out of date.
 *
 * Safety: upsert-only. Rows are matched on their natural keys
 * (requirement.code, requirement_category.slug, uq_satisfaction_pair) and
 * nothing is ever deleted, so company_requirement_status, sign_off_history and
 * requirement_assignment are untouched. A satisfaction pair whose requirement
 * codes are not seeded in the target database is skipped rather than failing,
 * matching how linkSatisfactionPairs behaves when a framework is inactive.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  nis2Categories,
  getNis2RequirementsForCategory,
  gdprCategories,
  getGdprRequirementsForCategory,
  euAiActCategories,
  getEuAiActRequirementsForCategory,
  euCraCategories,
  getEuCraRequirementsForCategory,
  iso27001Categories,
  getIso27001RequirementsForCategory,
  type FrameworkCategory,
  type FrameworkRequirement,
} from "@nisd2/grc-data-model/frameworks";
import { allSatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRIZZLE_DIR = join(ROOT, "drizzle");
const JOURNAL_PATH = join(DRIZZLE_DIR, "meta", "_journal.json");
const MIGRATION_NAME = "framework_data_sync";

/** Single-quote a SQL string literal, or render NULL. */
const sqlLiteral = (v: string | null): string =>
  v === null ? "NULL" : `'${v.replace(/'/g, "''")}'`;

/**
 * Every framework whose reference data is generated from this package, keyed
 * by its `compliance_framework.code`. Adding a framework here is all it takes
 * for its data to be carried into existing databases.
 */
const FRAMEWORKS: readonly {
  code: string;
  categories: FrameworkCategory[];
  getRequirements: (slug: string) => FrameworkRequirement[];
}[] = [
  { code: "nis2", categories: nis2Categories, getRequirements: getNis2RequirementsForCategory },
  { code: "gdpr", categories: gdprCategories, getRequirements: getGdprRequirementsForCategory },
  { code: "iso27001", categories: iso27001Categories, getRequirements: getIso27001RequirementsForCategory },
  { code: "eu_ai_act", categories: euAiActCategories, getRequirements: getEuAiActRequirementsForCategory },
  { code: "eu_cra", categories: euCraCategories, getRequirements: getEuCraRequirementsForCategory },
] as const;

/**
 * --only <code>[,<code>] narrows the migration to specific frameworks. Ship
 * the delta you have actually reviewed: emitting a framework whose difference
 * from the target database is unknown is how a reference-data migration turns
 * into an incident.
 */
const onlyIndex = process.argv.indexOf("--only");
const onlyArg = onlyIndex === -1 ? null : process.argv[onlyIndex + 1];
const only = onlyArg ? new Set(onlyArg.split(",").map((c) => c.trim())) : null;

const selected = only ? FRAMEWORKS.filter((f) => only.has(f.code)) : FRAMEWORKS;
if (selected.length === 0) {
  throw new Error(`--only ${onlyArg} matched no framework in ${FRAMEWORKS.map((f) => f.code).join(", ")}`);
}

/** Which framework each requirement code belongs to, for scoping pairs. */
const frameworkByCode = new Map(
  FRAMEWORKS.flatMap((f) =>
    f.categories.flatMap((c) => f.getRequirements(c.slug).map((r) => [r.code, f.code] as const)),
  ),
);

// Insert-if-missing then update, rather than a bare UPDATE: a framework change
// that adds a CATEGORY has to create it, or every requirement underneath it is
// silently skipped when its INSERT .. SELECT finds no category to attach to.
// (framework_id, slug) has no unique constraint — the seeder looks it up by
// hand — so this cannot be an ON CONFLICT and has to be two statements.
const categoryStatements = selected.flatMap((f) =>
  f.categories.flatMap((c) => {
    const frameworkId = `(SELECT "id" FROM "compliance_framework" WHERE "code" = ${sqlLiteral(f.code)})`;
    const roles = c.relevantRoles
      ? `${sqlLiteral(JSON.stringify(c.relevantRoles))}::jsonb`
      : "NULL";
    return [
      `INSERT INTO "requirement_category" (` +
        `"framework_id", "code", "slug", "reference_url", "national_url", ` +
        `"relevant_roles", "grundschutz_module", "sort_order", "estimated_minutes") ` +
        `SELECT f."id", ${sqlLiteral(c.code)}, ${sqlLiteral(c.slug)}, ` +
        `${sqlLiteral(c.referenceUrl || null)}, ${sqlLiteral(c.nationalUrl || null)}, ` +
        `${roles}, ${sqlLiteral(c.grundschutzModule ?? null)}, ${c.sortOrder}, ${c.estimatedMinutes} ` +
        `FROM "compliance_framework" f WHERE f."code" = ${sqlLiteral(f.code)} ` +
        `AND NOT EXISTS (SELECT 1 FROM "requirement_category" rc ` +
        `WHERE rc."slug" = ${sqlLiteral(c.slug)} AND rc."framework_id" = f."id")`,
      `UPDATE "requirement_category" SET ` +
        `"code" = ${sqlLiteral(c.code)}, ` +
        `"reference_url" = ${sqlLiteral(c.referenceUrl || null)}, ` +
        `"national_url" = ${sqlLiteral(c.nationalUrl || null)}, ` +
        `"relevant_roles" = ${roles}, ` +
        `"grundschutz_module" = ${sqlLiteral(c.grundschutzModule ?? null)}, ` +
        `"sort_order" = ${c.sortOrder}, ` +
        `"estimated_minutes" = ${c.estimatedMinutes}, ` +
        `"updated_at" = now() ` +
        `WHERE "slug" = ${sqlLiteral(c.slug)} AND "framework_id" = ${frameworkId}`,
    ];
  }),
);

// Insert-on-conflict rather than a bare UPDATE, so a framework change that
// ADDS a requirement is carried into already-seeded databases too. sort_order
// is the index within the category, matching seedFramework.
const requirements = selected.flatMap((f) =>
  f.categories.flatMap((c) =>
    f.getRequirements(c.slug).map((r, sortOrder) => ({
      ...r,
      frameworkCode: f.code,
      categorySlug: c.slug,
      sortOrder,
    })),
  ),
);

const requirementStatements = requirements.map(
  (r) =>
    `INSERT INTO "requirement" (` +
    `"category_id", "code", "evidence_type", "frequency", "priority", "importance", ` +
    `"legal_ref", "framework_ref", "cir_reference", "module_ref", "required_sign_off_role", "sort_order") ` +
    `SELECT rc."id", ${sqlLiteral(r.code)}, ${sqlLiteral(r.evidenceType)}::"evidence_type", ` +
    `${sqlLiteral(r.frequency)}::"frequency", ${sqlLiteral(r.priority)}::"priority", ` +
    `${sqlLiteral(r.importance)}::"requirement_importance", ` +
    `${sqlLiteral(r.legalRef || null)}, ${sqlLiteral(r.frameworkRef)}, ${sqlLiteral(r.cirReference)}, ` +
    `${sqlLiteral(r.moduleRef)}, ${sqlLiteral(r.requiredSignOffRole)}, ${r.sortOrder} ` +
    `FROM "requirement_category" rc ` +
    `WHERE rc."slug" = ${sqlLiteral(r.categorySlug)} ` +
    `AND rc."framework_id" = (SELECT "id" FROM "compliance_framework" WHERE "code" = ${sqlLiteral(r.frameworkCode)}) ` +
    `ON CONFLICT ("code") DO UPDATE SET ` +
    `"category_id" = EXCLUDED."category_id", "evidence_type" = EXCLUDED."evidence_type", ` +
    `"frequency" = EXCLUDED."frequency", "priority" = EXCLUDED."priority", ` +
    `"importance" = EXCLUDED."importance", "legal_ref" = EXCLUDED."legal_ref", ` +
    `"framework_ref" = EXCLUDED."framework_ref", "cir_reference" = EXCLUDED."cir_reference", ` +
    `"module_ref" = EXCLUDED."module_ref", ` +
    `"required_sign_off_role" = EXCLUDED."required_sign_off_role", ` +
    `"sort_order" = EXCLUDED."sort_order", "updated_at" = now()`,
);

// A pair rides along when either side belongs to a selected framework: the
// ISO 27001 <-> NIS 2 crosswalk was reviewed as part of the NIS 2 audit even
// though ISO's own requirement rows are not in this migration.
const selectedCodes = new Set(selected.map((f) => f.code));
const pairs = allSatisfactionPairs.filter(([a, b]) => {
  const fa = frameworkByCode.get(a);
  const fb = frameworkByCode.get(b);
  return (fa !== undefined && selectedCodes.has(fa)) || (fb !== undefined && selectedCodes.has(fb));
});

const pairStatements = pairs.map(
  ([a, b, rationale, kind]) =>
    `INSERT INTO "requirement_satisfaction" ("requirement_a_id", "requirement_b_id", "rationale", "equivalence_kind") ` +
    `SELECT ra."id", rb."id", ${sqlLiteral(rationale)}, ${sqlLiteral(kind ?? "overlapping")}::"equivalence_kind" ` +
    `FROM "requirement" ra, "requirement" rb ` +
    `WHERE ra."code" = ${sqlLiteral(a)} AND rb."code" = ${sqlLiteral(b)} ` +
    `ON CONFLICT ON CONSTRAINT "uq_satisfaction_pair" DO UPDATE SET ` +
    `"rationale" = EXCLUDED."rationale", "equivalence_kind" = EXCLUDED."equivalence_kind"`,
);

/**
 * The framework rows themselves. A migration never needs these — every
 * database that has ever run drizzle/seed.ts already has them, and the
 * category and requirement upserts below are scoped to an existing framework
 * row, so on a database without one they match nothing and do nothing.
 *
 * The seed file does need them, because its whole job is a database where
 * nothing has been seeded. Values match drizzle/seed.ts exactly, ISO 27001
 * inactive included: it is seeded only so the NIS 2 satisfaction pairs
 * resolve, and being inactive keeps it out of the sidebar, out of /compliance
 * and out of what a new signup is provisioned with.
 */
const dryRun = process.argv.includes("--dry-run");

const FRAMEWORK_ROWS = [
  { code: "nis2", version: "2026", effectiveDate: "2026-03-17", isActive: true, codePrefix: "NIS2-", sidebarLabel: "nis2" },
  { code: "iso27001", version: "2022", effectiveDate: "2022-10-25", isActive: false, codePrefix: "ISO27001-", sidebarLabel: "iso27001" },
] as const;

const frameworkStatements = FRAMEWORK_ROWS.filter((row) =>
  selected.some((f) => f.code === row.code),
).map(
  (row) =>
    `INSERT INTO "compliance_framework" (` +
      `"code", "version", "effective_date", "is_active", "code_prefix", "sidebar_label") ` +
      `VALUES (${sqlLiteral(row.code)}, ${sqlLiteral(row.version)}, ${sqlLiteral(row.effectiveDate)}, ` +
      `${row.isActive}, ${sqlLiteral(row.codePrefix)}, ${sqlLiteral(row.sidebarLabel)}) ` +
      `ON CONFLICT ("code") DO UPDATE SET ` +
      `"version" = EXCLUDED."version", ` +
      `"effective_date" = EXCLUDED."effective_date", ` +
      `"is_active" = EXCLUDED."is_active"`,
);

const statements = [
  ...categoryStatements,
  ...requirementStatements,
  ...pairStatements,
];

const sql =
  [
    `-- Framework reference data sync: ${selected.map((f) => f.code).join(", ")}.`,
    "-- Generated by scripts/generate-framework-migration.ts; do not hand-edit.",
    `-- Regenerate with: bun run scripts/generate-framework-migration.ts${only ? ` --only ${[...only].join(",")}` : ""}`,
    "-- Upsert-only: no deletes, no operational tables touched.",
    "",
  ].join("\n") + statements.join(";\n--> statement-breakpoint\n") + ";\n";

const categoryCountAll = selected.reduce((n, f) => n + f.categories.length, 0);

/**
 * Seed-file mode exits here. It shares every statement above with the
 * migration path, which is the point: two generators would drift, and the
 * one that drifts is always the one nobody runs.
 */
const seedFileMode = process.argv.includes("--seed-file");

if (seedFileMode) {
  const seedSql =
    [
      "-- open-isms framework reference data.",
      "--",
      "-- Fills a fresh database with the frameworks, categories, requirements and",
      "-- cross-framework satisfaction pairs. Apply it once after the first start:",
      "--",
      "--   docker compose exec -T postgres psql -U openisms -d openisms < framework-seed.sql",
      "--",
      "-- Upsert-only and safe to re-run: nothing is deleted and no company data is",
      "-- touched, so it cannot damage an instance that is already in use.",
      "--",
      "-- Not included: the requirement prerequisites drizzle/seed.ts also writes.",
      "-- Those gate the order requirements are worked in; without them nothing is",
      "-- gated, which is a difference worth knowing and not a broken install.",
      "--",
      "-- Generated by scripts/generate-framework-migration.ts --seed-file.",
      "-- Do not hand-edit; `bun run check:framework-seed` compares it to the data.",
      "",
    ].join("\n") +
    [...frameworkStatements, ...statements].join(";\n\n") +
    ";\n";

  const seedPath = join(ROOT, "db", "framework-seed.sql");
  if (dryRun) {
    // Synchronous write to fd 1, and no process.exit afterwards. Both matter:
    // console.log would append a newline the file does not have, and exiting
    // right after an async stdout write truncates it at the pipe buffer, which
    // made `check:framework-seed` compare half a file and always fail.
    writeFileSync(1, seedSql);
  } else {
    mkdirSync(dirname(seedPath), { recursive: true });
    writeFileSync(seedPath, seedSql);
    console.log(
      `wrote db/framework-seed.sql (${selected.map((f) => f.code).join("+")}, ` +
        `${categoryCountAll} categories, ${requirements.length} requirements, ` +
        `${pairs.length} pairs, ${frameworkStatements.length + statements.length} statements)`,
    );
  }
}

// Migration mode. Guarded rather than reached by an early process.exit above,
// because exiting mid-script is what truncated the seed file's stdout.
if (!seedFileMode) {
  const journal: { entries: JournalEntry[] } = JSON.parse(
    readFileSync(JOURNAL_PATH, "utf-8"),
  );
  const previous = journal.entries.at(-1);
  if (!previous) {
    throw new Error(`no existing entries in ${JOURNAL_PATH}; refusing to guess a baseline`);
  }

  const idx = previous.idx + 1;
  const tag = `${String(idx).padStart(4, "0")}_${MIGRATION_NAME}`;
  const when = Date.now();
  if (when <= previous.when) {
    // runtime-migrate.mjs applies entries with `when > lastApplied`, so a
    // non-increasing timestamp would silently never run.
    throw new Error(
      `clock skew: new timestamp ${when} is not after the previous entry's ${previous.when}`,
    );
  }

  const summary = `${selected.map((f) => f.code).join("+")}, ${categoryCountAll} categories, ${requirements.length} requirements, ${pairs.length} pairs`;

  if (dryRun) {
    console.log(sql);
    console.error(`-- dry run: ${summary} (${statements.length} statements), would write ${tag}.sql`);
  } else {
    writeFileSync(join(DRIZZLE_DIR, `${tag}.sql`), sql);
    writeFileSync(
      JOURNAL_PATH,
      `${JSON.stringify(
        {
          ...journal,
          entries: [
            ...journal.entries,
            { idx, version: previous.version, when, tag, breakpoints: true },
          ],
        },
        null,
        2,
      )}\n`,
    );
    console.log(`wrote drizzle/${tag}.sql (${summary}, ${statements.length} statements)`);
    console.log(`appended journal entry idx ${idx}`);
  }
}
