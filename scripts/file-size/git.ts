/**
 * What the size check reads from git: the files a change touches, which of them nobody writes by
 * hand, and their sizes before and after. Every read is of git objects (the index or a commit),
 * never the working tree, so what is measured is exactly what is committed.
 */

import { execFileSync } from "node:child_process";

/** Which change to measure, and how to name a file's content before and after it. */
export interface Scope {
  /** The revision the change is compared with; null for the first commit of a repository. */
  readonly base: string | null;
  /** The object name of a path after the change: in the index, or in a commit. */
  readonly after: (path: string) => string;
  /** How `git diff` selects the change. */
  readonly diff: readonly string[];
  /** Where `git check-attr` reads .gitattributes, so a change to that file counts too. */
  readonly attributes: readonly string[];
}

/**
 * Git's stderr is captured, not inherited: asking for a path HEAD does not have is how a new file
 * is recognised, and its "fatal: path ... does not exist" would otherwise land in the report.
 */
const OPTIONS = { maxBuffer: 256 * 1024 * 1024, stdio: "pipe" } as const;

const git = (args: readonly string[], input?: string): string =>
  execFileSync("git", args, { ...OPTIONS, encoding: "utf8", input });

const resolves = (revision: string): boolean => {
  try {
    git(["rev-parse", "--verify", "--quiet", `${revision}^{commit}`]);
    return true;
  } catch {
    return false;
  }
};

/** What is staged for the next commit, measured against HEAD: the pre-commit hook. */
export const stagedScope = (): Scope => ({
  base: resolves("HEAD") ? "HEAD" : null,
  after: (path) => `:${path}`,
  diff: ["--cached"],
  attributes: ["--cached"],
});

/** What HEAD changed since `ref`, for CI, where the hook may never have run. */
export const sinceScope = (ref: string): Scope => {
  if (!resolves(ref)) throw new Error(`--since ${ref}: no such commit`);
  return {
    base: ref,
    after: (path) => `HEAD:${path}`,
    diff: [ref, "HEAD"],
    attributes: ["--source", "HEAD"],
  };
};

export interface ChangedPath {
  readonly path: string;
  /** The path before the change: the same path, or the old one for a rename. */
  readonly from: string;
}

/**
 * Parses `git diff --name-status -z`: a status field, then one path, or two for a rename
 * (`R<score>`, old path, new path), each NUL-terminated.
 */
export const parseNameStatus = (output: string): readonly ChangedPath[] => {
  const fields = output.split("\0");
  const changed: ChangedPath[] = [];
  for (let at = 0; at < fields.length - 1; ) {
    const status = fields[at] ?? "";
    const first = fields[at + 1] ?? "";
    if (status.startsWith("R")) {
      changed.push({ from: first, path: fields[at + 2] ?? "" });
      at += 3;
    } else {
      changed.push({ from: first, path: first });
      at += 2;
    }
  }
  return changed;
};

/** Added, copied, modified and renamed files; a deletion has nothing left to measure. */
export const changedPaths = (scope: Scope): readonly ChangedPath[] =>
  parseNameStatus(
    git(["diff", ...scope.diff, "--name-status", "-z", "-M", "--diff-filter=ACMR"]),
  );

const NOT_HAND_WRITTEN = ["linguist-generated", "linguist-vendored"] as const;

/**
 * Parses `git check-attr -z`: path, attribute and value triples, each NUL-terminated. Returns the
 * paths where any of the attributes is set (`path attr` gives "set", `path attr=true` gives "true").
 */
export const parseCheckAttr = (output: string): ReadonlySet<string> => {
  const fields = output.split("\0");
  const triples = Array.from({ length: Math.floor(fields.length / 3) }, (_, index) =>
    fields.slice(index * 3, index * 3 + 3),
  );
  return new Set(
    triples.flatMap(([path = "", , value = ""]) =>
      value === "set" || value === "true" ? [path] : [],
    ),
  );
};

/** The paths `.gitattributes` marks as written by no person or agent. */
export const notHandWritten = (
  scope: Scope,
  paths: readonly string[],
): ReadonlySet<string> =>
  paths.length === 0
    ? new Set()
    : parseCheckAttr(
        git(
          ["check-attr", ...scope.attributes, "--stdin", "-z", ...NOT_HAND_WRITTEN],
          paths.map((path) => `${path}\0`).join(""),
        ),
      );

/** The size in bytes of a git object such as `:path` or `HEAD:path`, or null when there is none. */
export const sizeOf = (object: string): number | null => {
  try {
    return Number(git(["cat-file", "-s", object]).trim());
  } catch {
    return null;
  }
};

/** Git's own test for binary content: a NUL byte in the first 8,000 bytes. */
export const isBinary = (object: string): boolean =>
  execFileSync("git", ["cat-file", "-p", object], OPTIONS).subarray(0, 8000).includes(0);
