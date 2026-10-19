/**
 * The check end to end: a throwaway repository per test, real git, the real script.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "check-file-size.ts");
const OVER = 20_001;
const repos: string[] = [];

const repo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "file-size-"));
  repos.push(dir);
  execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: dir });
  return dir;
};

afterEach(() => {
  for (const dir of repos.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const git = (dir: string, ...args: string[]): void => {
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
    cwd: dir,
  });
};

const put = (dir: string, path: string, content: string | Uint8Array): void => {
  writeFileSync(join(dir, path), content);
  git(dir, "add", path);
};

const commit = (dir: string): void => git(dir, "commit", "--quiet", "-m", "c");

const check = (dir: string, ...args: string[]) => {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: dir,
    encoding: "utf8",
  });
  return { code: result.status, output: result.stderr };
};

describe("staged changes, as the pre-commit hook runs it", () => {
  test("passes small files without a word", () => {
    const dir = repo();
    put(dir, "small.ts", "export const a = 1;\n");
    expect(check(dir)).toEqual({ code: 0, output: "" });
  });

  test("refuses a new file over the limit, and says how to split it", () => {
    const dir = repo();
    put(dir, "seed.ts", "x");
    commit(dir);
    put(dir, "big.ts", "x".repeat(OVER));
    const { code, output } = check(dir);
    expect(code).toBe(1);
    expect(output).toContain("big.ts: 5,001 tokens (new file)");
    expect(output).toContain("How to split big.ts:");
    expect(output).not.toContain("fatal:");
  });

  test("refuses the first commit of a repository when it holds a file over the limit", () => {
    const dir = repo();
    put(dir, "big.ts", "x".repeat(OVER));
    expect(check(dir).code).toBe(1);
  });

  test("lets a file already over the limit through when it did not grow", () => {
    const dir = repo();
    put(dir, "big.json", "a".repeat(OVER + 10));
    git(dir, "commit", "--quiet", "--no-verify", "-m", "before the check");
    put(dir, "big.json", "b".repeat(OVER + 10));
    const { code, output } = check(dir);
    expect(code).toBe(0);
    expect(output).toContain("note: big.json");
  });

  test("refuses a file already over the limit that grew", () => {
    const dir = repo();
    put(dir, "big.json", "a".repeat(OVER));
    commit(dir);
    put(dir, "big.json", "a".repeat(OVER + 1));
    const { code, output } = check(dir);
    expect(code).toBe(1);
    expect(output).toContain("a file over the limit may not grow");
  });

  test("measures a renamed file against its old path", () => {
    const dir = repo();
    put(dir, "old.json", "a".repeat(OVER));
    commit(dir);
    git(dir, "mv", "old.json", "new.json");
    expect(check(dir).code).toBe(0);
  });

  test("measures what is staged, not what is in the working tree", () => {
    const dir = repo();
    put(dir, "a.ts", "x");
    writeFileSync(join(dir, "a.ts"), "x".repeat(OVER));
    expect(check(dir).code).toBe(0);
  });

  test("skips files .gitattributes marks as generated or vendored, read from the index", () => {
    const dir = repo();
    put(
      dir,
      ".gitattributes",
      "*.lock linguist-generated\nvendor/** linguist-vendored=true\n",
    );
    mkdirSync(join(dir, "vendor"));
    put(dir, "deps.lock", "x".repeat(OVER));
    put(dir, "vendor/list.txt", "x".repeat(OVER));
    expect(check(dir).code).toBe(0);
  });

  test("skips binary files", () => {
    const dir = repo();
    put(dir, "image.png", new Uint8Array(OVER).fill(0));
    expect(check(dir).code).toBe(0);
  });
});

describe("a branch since a ref, as CI runs it", () => {
  test("refuses a file the branch brought over the limit", () => {
    const dir = repo();
    put(dir, "seed.ts", "x");
    commit(dir);
    const base = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: dir,
      encoding: "utf8",
    }).trim();
    put(dir, "big.ts", "x".repeat(OVER));
    git(dir, "commit", "--quiet", "--no-verify", "-m", "skipped the hook");
    expect(check(dir, "--since", base).code).toBe(1);
    expect(check(dir, "--since", "HEAD").code).toBe(0);
  });

  test("stops with a usage error on a ref that does not resolve", () => {
    const dir = repo();
    put(dir, "seed.ts", "x");
    commit(dir);
    const { code, output } = check(dir, "--since", "no-such-ref");
    expect(code).toBe(2);
    expect(output).toContain("no such commit");
  });
});
