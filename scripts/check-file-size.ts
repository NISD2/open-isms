/**
 * Refuses a change that brings a hand-written file over 5,000 tokens (bytes / 4), or grows a file
 * that already is. The rule and why: scripts/file-size/policy.ts.
 *
 *   bun scripts/check-file-size.ts                what is staged; run by .githooks/pre-commit
 *   bun scripts/check-file-size.ts --since <ref>  what HEAD changed since <ref>; run by CI
 */

import {
  type ChangedPath,
  changedPaths,
  isBinary,
  notHandWritten,
  type Scope,
  sinceScope,
  sizeOf,
  stagedScope,
} from "./file-size/git";
import { type Finding, isOverLimit, report, verdictOf } from "./file-size/policy";

const scopeOf = (args: readonly string[]): Scope => {
  const at = args.indexOf("--since");
  if (at === -1) return stagedScope();
  const ref = args[at + 1];
  if (ref === undefined || ref.startsWith("--")) {
    throw new Error("--since takes a commit, for example: --since origin/main");
  }
  return sinceScope(ref);
};

/** The changed hand-written text files over the limit, each with its verdict. */
const findingsOf = (scope: Scope): readonly Finding[] => {
  const changed = changedPaths(scope);
  const skipped = notHandWritten(
    scope,
    changed.map(({ path }) => path),
  );
  return changed
    .filter(({ path }) => !skipped.has(path))
    .flatMap(({ path, from }: ChangedPath): Finding[] => {
      const bytes = sizeOf(scope.after(path)) ?? 0;
      if (!isOverLimit(bytes) || isBinary(scope.after(path))) return [];
      const previousBytes = scope.base === null ? null : sizeOf(`${scope.base}:${from}`);
      return [{ path, verdict: verdictOf({ path, bytes, previousBytes }) }];
    });
};

type Outcome = { readonly code: 0 | 1 | 2; readonly lines: readonly string[] };

const run = (args: readonly string[]): Outcome => {
  try {
    const { failed, lines } = report(findingsOf(scopeOf(args)));
    return { code: failed ? 1 : 0, lines };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { code: 2, lines: [`check-file-size: ${message}`] };
  }
};

const outcome = run(process.argv.slice(2));
if (outcome.lines.length > 0) console.error(outcome.lines.join("\n"));
process.exit(outcome.code);
