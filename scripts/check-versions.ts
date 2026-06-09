#!/usr/bin/env bun
/**
 * Verify that every package.json version matches the expected tag.
 * Called by release.yml as a safety check before publishing.
 *
 *   bun scripts/check-versions.ts 0.2.0
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const expected = process.argv[2];
if (!expected) {
  console.error("Usage: bun scripts/check-versions.ts <version>");
  process.exit(1);
}

const root = resolve(import.meta.dir, "..");
const packagesDir = resolve(root, "packages");
const mismatches: { name: string; version: string }[] = [];

const rootPkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
if (rootPkg.version !== expected) {
  mismatches.push({ name: "(root)", version: rootPkg.version });
}

for (const name of readdirSync(packagesDir)) {
  const pkgPath = resolve(packagesDir, name, "package.json");
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    if (!pkg.name || pkg.private) continue;
    if (pkg.version !== expected) mismatches.push({ name: pkg.name, version: pkg.version });
  } catch { /* skip */ }
}

if (mismatches.length > 0) {
  console.error(`error: tag is v${expected} but ${mismatches.length} package(s) disagree:`);
  for (const { name, version } of mismatches) console.error(`  ${name} @ ${version}`);
  console.error(`\nRun scripts/release.ts to keep versions in sync.`);
  process.exit(1);
}

console.log(`  all packages at ${expected}`);
