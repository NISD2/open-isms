#!/usr/bin/env bun
/**
 * Set every publishable workspace package to one version.
 *
 * Only for publish-npm.yml, which runs on demand. It writes files and nothing
 * else: no commit, no tag, no git at all. The app's own version is decided by
 * the release workflow from the newest tag and has nothing to do with these.
 *
 *   bun scripts/set-package-versions.ts 0.11.0
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
if (!target || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(target)) {
  console.error("Usage: bun scripts/set-package-versions.ts <version>");
  process.exit(1);
}

// Standard ESM rather than Bun's import.meta.dir, so this file typechecks
// with the rest of the app instead of being excluded like publish-all.ts.
const root = fileURLToPath(new URL("..", import.meta.url));
const packagesDir = resolve(root, "packages");

const publishable = readdirSync(packagesDir).flatMap((name) => {
  const path = resolve(packagesDir, name, "package.json");
  try {
    statSync(path);
  } catch {
    return [];
  }
  const pkg: { name?: string; private?: boolean } = JSON.parse(readFileSync(path, "utf-8"));
  return pkg.name && !pkg.private ? [{ path, name: pkg.name }] : [];
});

for (const { path, name } of publishable) {
  const pkg = JSON.parse(readFileSync(path, "utf-8"));
  pkg.version = target;
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`  ${name} → ${target}`);
}

console.log(`\n  ${publishable.length} package(s) set to ${target}`);
