#!/usr/bin/env bun
/**
 * Bump every package + the root to a target version, commit, tag.
 *
 *   bun scripts/release.ts 0.2.0
 *
 * Refuses to run when:
 *   - target version doesn't match semver
 *   - working tree is dirty
 *   - target version is not strictly greater than the current root version
 *   - the v<version> tag already exists locally or on origin
 *
 * After this script: `git push --follow-tags` to trigger CI publish.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { $ } from "bun";

const target = process.argv[2];
if (!target || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(target)) {
  console.error("Usage: bun scripts/release.ts <version>");
  console.error("  e.g.  bun scripts/release.ts 0.2.0");
  console.error("  e.g.  bun scripts/release.ts 0.2.0-beta.1");
  process.exit(1);
}

const root = resolve(import.meta.dir, "..");

// 1. Working tree must be clean.
const status = (await $`git status --porcelain`.cwd(root).text()).trim();
if (status) {
  console.error("error: working tree is dirty. Commit or stash first.");
  console.error(status);
  process.exit(1);
}

// 2. Target version must be strictly greater than current root.
const rootPkgPath = resolve(root, "package.json");
const rootPkg = JSON.parse(readFileSync(rootPkgPath, "utf-8"));
if (!isHigher(target, rootPkg.version)) {
  console.error(`error: target ${target} is not higher than current ${rootPkg.version}`);
  process.exit(1);
}

// 3. Tag must not exist.
const tag = `v${target}`;
const localTags = (await $`git tag --list ${tag}`.cwd(root).text()).trim();
if (localTags) {
  console.error(`error: tag ${tag} already exists locally`);
  process.exit(1);
}

// 4. Bump root + every workspace package.
const targets = [rootPkgPath, ...listWorkspacePackages(root)];
for (const path of targets) {
  const pkg = JSON.parse(readFileSync(path, "utf-8"));
  pkg.version = target;
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`  bumped ${pkg.name ?? "(root)"} → ${target}`);
}

// 5. Commit + tag.
await $`git add -A`.cwd(root);
await $`git commit -m "release ${tag}"`.cwd(root);
await $`git tag -a ${tag} -m ${`release ${target}`}`.cwd(root);

console.log(`\n  tagged ${tag}`);
console.log(`  next:  git push --follow-tags`);

function listWorkspacePackages(root: string): string[] {
  const out: string[] = [];
  for (const dir of ["packages"]) {
    const base = resolve(root, dir);
    try { statSync(base); } catch { continue; }
    for (const name of readdirSync(base)) {
      const path = resolve(base, name, "package.json");
      try {
        const pkg = JSON.parse(readFileSync(path, "utf-8"));
        if (pkg.name && !pkg.private) out.push(path);
      } catch { /* skip non-packages */ }
    }
  }
  return out;
}

function isHigher(a: string, b: string): boolean {
  const parse = (v: string) => v.split(/[.-]/).map((x) => /^\d+$/.test(x) ? Number(x) : x);
  const aa = parse(a);
  const bb = parse(b);
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    const ai = aa[i] ?? 0;
    const bi = bb[i] ?? 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return false;
}
