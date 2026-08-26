/**
 * An applied migration is immutable. See docs/migration-policy.md.
 *
 * Every database that has already run a migration records it as done and will
 * never run it again. Editing the file afterwards therefore does not change
 * those databases — it only changes the ones that have not run it yet. The
 * result is two populations that both believe they are on the same version
 * while holding different schemas, and nothing at runtime notices.
 *
 * This compares every migration file and journal entry that existed at the
 * most recent release tag against the working tree, and fails if any of them
 * moved. New migrations appended after the tag are the point of the exercise
 * and are ignored.
 *
 * No tags yet (before the first release) means nothing is frozen, so the check
 * passes and says so.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const CHAINS = [
  "packages/grc-data-model/drizzle",
  "packages/isms-schema/drizzle",
  "drizzle",
] as const;

type Finding = {
  readonly file: string;
  readonly problem: string;
  readonly remedy: string;
};

type JournalEntry = { readonly idx: number; readonly when: number; readonly tag: string };

const git = (args: readonly string[]): string =>
  execFileSync("git", [...args], { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });

const latestReleaseTag = (): string | null => {
  const tags = git(["tag", "--list", "v*", "--sort=-v:refname"]).trim();
  return tags === "" ? null : tags.split("\n")[0];
};

const fileAtRef = (ref: string, path: string): string | null => {
  try {
    return git(["show", `${ref}:${path}`]);
  } catch {
    return null;
  }
};

const filesAtRef = (ref: string, folder: string): readonly string[] => {
  const listed = git(["ls-tree", "-r", "--name-only", ref, "--", folder]).trim();
  return listed === "" ? [] : listed.split("\n");
};

const journalEntries = (raw: string): readonly JournalEntry[] => {
  const parsed: unknown = JSON.parse(raw);
  const entries = (parsed as { entries?: readonly JournalEntry[] }).entries;
  return entries ?? [];
};

const checkSqlFile = (ref: string, path: string): readonly Finding[] => {
  const atRef = fileAtRef(ref, path);
  if (atRef === null) return [];

  if (!existsSync(path)) {
    return [
      {
        file: path,
        problem: `deleted, but it shipped in ${ref}`,
        remedy:
          "Restore it. Databases that already ran it will never re-run it; removing the file only breaks fresh installs.",
      },
    ];
  }

  const now = readFileSync(path, "utf-8");
  return now === atRef
    ? []
    : [
        {
          file: path,
          problem: `edited after shipping in ${ref}`,
          remedy:
            "Revert this file and put the change in a new migration instead. Databases that already ran it will not pick up the edit.",
        },
      ];
};

const checkJournal = (ref: string, path: string): readonly Finding[] => {
  const atRef = fileAtRef(ref, path);
  if (atRef === null || !existsSync(path)) return [];

  const before = journalEntries(atRef);
  const after = journalEntries(readFileSync(path, "utf-8"));

  return before.flatMap((entry, position) => {
    const current = after[position];
    if (current === undefined) {
      return [
        {
          file: path,
          problem: `entry ${position} (${entry.tag}) was removed`,
          remedy: "Restore the entry. Journal history is append-only.",
        },
      ];
    }
    if (current.tag !== entry.tag || Number(current.when) !== Number(entry.when)) {
      return [
        {
          file: path,
          problem: `entry ${position} changed from ${entry.tag}@${entry.when} to ${current.tag}@${current.when}`,
          remedy:
            "New migrations append to the end with a fresh timestamp. Reordering or renumbering existing entries makes running databases skip a migration permanently.",
        },
      ];
    }
    return [];
  });
};

const baseline = latestReleaseTag();

if (baseline === null) {
  console.log("[migration-immutability] no release tags yet — nothing is frozen");
  process.exit(0);
}

const findings = CHAINS.flatMap((folder) =>
  filesAtRef(baseline, folder).flatMap((path) =>
    path.endsWith("/meta/_journal.json")
      ? checkJournal(baseline, path)
      : path.endsWith(".sql")
        ? checkSqlFile(baseline, path)
        : [],
  ),
);

if (findings.length > 0) {
  console.error(
    `[migration-immutability] ${findings.length} migration file(s) shipped in ${baseline} have changed:\n`,
  );
  for (const finding of findings) {
    console.error(`  ${finding.file}`);
    console.error(`    ${finding.problem}`);
    console.error(`    ${finding.remedy}\n`);
  }
  console.error("See docs/migration-policy.md.");
} else {
  console.log(
    `[migration-immutability] every migration shipped in ${baseline} is unchanged`,
  );
}

process.exit(findings.length > 0 ? 1 : 0);
