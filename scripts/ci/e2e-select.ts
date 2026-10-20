/**
 * Picks the browser specs a pull request runs (e2e/select). Writes `specs` to $GITHUB_OUTPUT:
 * the spec files to pass to Playwright, or nothing for the whole suite.
 *
 *   E2E_LABELS='["e2e:full"]' bun scripts/ci/e2e-select.ts [base-ref]
 *
 * The changed files are what HEAD changed since it left `base-ref` (default origin/main).
 */

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { z } from "zod";
import { selectSpecs } from "../../e2e/select/select";

// Throws on a failing git, so a base that does not resolve fails the job instead of selecting less.
const git = (...args: string[]): string => execFileSync("git", args, { encoding: "utf8" });

const base = process.argv[2] ?? "origin/main";
const changed = git("diff", "--name-only", `${base}...HEAD`)
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line !== "");
const parsed = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
// A label list that does not parse is read as no labels: the selection still runs, never less.
const labels = z
  .array(z.string())
  .catch([])
  .parse(parsed(process.env.E2E_LABELS ?? "[]"));

const selection = selectSpecs(changed, labels);
const specs = selection.kind === "all" ? "" : selection.specs.join(" ");
console.log(
  selection.kind === "all"
    ? `Whole suite: ${selection.because}.`
    : `Areas ${selection.areas.join(", ") || "none"} from ${changed.length} changed files:\n  ${selection.specs.join("\n  ")}`,
);
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `specs=${specs}\n`);
