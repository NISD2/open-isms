/**
 * Every .sql file in a migration folder must appear in that folder's journal,
 * and every journal entry must have its file.
 *
 * scripts/runtime-migrate.mjs drives off the journal, not the directory
 * listing. So a .sql sitting there un-journaled simply never runs, silently
 * and forever. drizzle/ carried one for months: 0016_aberrant_devos, a
 * duplicate of DDL that had already moved into the isms-schema chain. It was
 * harmless because the columns arrived by the other route, but reading the
 * directory made it look like production had run it.
 *
 * The reverse, a journal entry whose file is missing, is the louder failure:
 * runtime-migrate throws on boot and the container will not start.
 *
 * Usage: bun scripts/check-migration-journals.ts
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";

/** Kept in step with the folder list in scripts/runtime-migrate.mjs. */
const FOLDERS = [
  "packages/grc-data-model/drizzle",
  "packages/isms-schema/drizzle",
  "drizzle",
] as const;

type Journal = { entries: Array<{ idx: number; when: number; tag: string }> };

type FolderReport = {
  folder: string;
  orphans: readonly string[];
  missing: readonly string[];
  outOfOrder: readonly string[];
  noJournal: boolean;
};

function inspect(folder: string): FolderReport {
  const base = { folder, orphans: [], missing: [], outOfOrder: [] };
  const journalPath = `${folder}/meta/_journal.json`;

  // A folder with .sql files but no journal is the loudest version of the
  // failure this script exists to catch: runtime-migrate logs "no journal —
  // skipping" and every migration in that chain silently never runs. Reporting
  // it as consistent would be worse than not checking at all. A folder with no
  // journal AND no .sql files is simply not a migration folder.
  if (!existsSync(journalPath)) {
    const strays = existsSync(folder)
      ? readdirSync(folder).filter((f) => f.endsWith(".sql"))
      : [];
    return { ...base, noJournal: strays.length > 0 };
  }

  const journal = JSON.parse(readFileSync(journalPath, "utf-8")) as Journal;
  const tags = journal.entries.map((e) => e.tag);
  const tagSet = new Set(tags);
  const files = readdirSync(folder)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => f.replace(/\.sql$/, ""));
  const fileSet = new Set(files);

  // runtime-migrate applies entries with `when` greater than the last applied
  // timestamp, so a non-increasing `when` would skip the entry on a database
  // that is already past it.
  const outOfOrder = journal.entries
    .filter((e, i) => i > 0 && e.when <= journal.entries[i - 1].when)
    .map((e) => `${e.tag} (when=${e.when} not greater than its predecessor)`);

  return {
    folder,
    orphans: files.filter((f) => !tagSet.has(f)).sort(),
    missing: tags.filter((t) => !fileSet.has(t)).sort(),
    outOfOrder,
    noJournal: false,
  };
}

const reports = FOLDERS.map(inspect);

for (const r of reports) {
  if (r.noJournal) {
    console.error(
      `${r.folder} has .sql files but no meta/_journal.json — runtime-migrate ` +
        `skips the whole chain, so none of them will ever run.`,
    );
  }
  for (const o of r.orphans) {
    console.error(`${r.folder}/${o}.sql is not in the journal, so it will never run.`);
  }
  for (const m of r.missing) {
    console.error(`${r.folder}/meta/_journal.json references ${m}, but the .sql is missing.`);
  }
  for (const w of r.outOfOrder) {
    console.error(`${r.folder}/meta/_journal.json: ${w}`);
  }
}

const problems = reports.reduce(
  (n, r) =>
    n + r.orphans.length + r.missing.length + r.outOfOrder.length + (r.noJournal ? 1 : 0),
  0,
);

if (problems === 0) {
  const counts = reports
    .map((r) => `${r.folder} ok`)
    .join(", ");
  console.log(`Migration journals consistent: ${counts}`);
}

process.exit(problems === 0 ? 0 : 1);
