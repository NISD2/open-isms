#!/usr/bin/env bun
/**
 * Publish every public workspace package to npm with provenance.
 * Triggered by .github/workflows/release.yml on tag push.
 *
 * Fails fast on first error. Verifies dist/ exists before each publish so
 * a missing build step is caught here, not by npm.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { $ } from "bun";

const root = resolve(import.meta.dir, "..");
const packagesDir = resolve(root, "packages");

const publishable: { name: string; dir: string }[] = [];
for (const name of readdirSync(packagesDir)) {
  const dir = resolve(packagesDir, name);
  const pkgPath = resolve(dir, "package.json");
  let pkg: { name?: string; private?: boolean };
  try { pkg = JSON.parse(readFileSync(pkgPath, "utf-8")); } catch { continue; }
  if (!pkg.name || pkg.private) continue;

  // Verify build output exists.
  const distPath = resolve(dir, "dist");
  try {
    statSync(distPath);
  } catch {
    console.error(`error: ${pkg.name} has no dist/ — did the build step run?`);
    process.exit(1);
  }

  publishable.push({ name: pkg.name, dir });
}

console.log(`Publishing ${publishable.length} package(s):\n`);
for (const { name } of publishable) console.log(`  ${name}`);
console.log();

for (const { name, dir } of publishable) {
  console.log(`── ${name}`);
  await $`bun publish --access public --provenance`.cwd(dir);
}

console.log(`\n  published ${publishable.length} packages`);
