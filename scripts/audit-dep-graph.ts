#!/usr/bin/env bun
// Walk every TS/TSX import of @nisd2/* across the private monorepo and the OSS
// app, check whether the targeted package's exports map covers the subpath, and
// whether the export resolves to a published location (dist/) or only to source
// (src/), which would break for npm consumers.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { $ } from "bun";

const repoRoot = resolve(import.meta.dir, "..");
const packagesDir = resolve(repoRoot, "packages");

interface Pkg { exports: any; main: string; private: boolean }
const pkgs: Record<string, Pkg> = {};
for (const name of readdirSync(packagesDir)) {
  try {
    const pj = JSON.parse(readFileSync(resolve(packagesDir, name, "package.json"), "utf-8"));
    if (!pj.name) continue;
    // Honor publishConfig overrides — that's what npm consumers actually see.
    const pub = pj.publishConfig ?? {};
    pkgs[pj.name] = {
      exports: pub.exports ?? pj.exports ?? {},
      main: pub.main ?? pj.main ?? "",
      private: !!pj.private,
    };
  } catch {}
}

const grepRoots = ["app", "lib", "components", "schema", "apps/open-isms"];
const text = await $`grep -rhoE --include='*.ts' --include='*.tsx' '@nisd2/[A-Za-z0-9_./-]+' ${grepRoots} 2>/dev/null`.cwd(repoRoot).text();
const imports = [...new Set(text.split("\n").filter(Boolean))].sort();

function resolveExport(exp: any, subpath: string): string | null {
  if (typeof exp === "string") return subpath === "." ? exp : null;
  if (!exp || typeof exp !== "object") return null;
  if (exp[subpath]) {
    const t = exp[subpath];
    return typeof t === "string" ? t : (t.import || t.default || JSON.stringify(t));
  }
  for (const key of Object.keys(exp)) {
    if (key.endsWith("/*") && subpath.startsWith(key.slice(0, -1))) {
      const t = exp[key];
      const target = typeof t === "string" ? t : (t.import || t.default || JSON.stringify(t));
      return target.replace("*", subpath.slice(key.length - 1));
    }
  }
  return null;
}

let ok = 0, workspaceOnly = 0, missing = 0;
console.log(`\n${"IMPORT".padEnd(55)} ${"STATUS".padEnd(16)} TARGET`);
console.log("-".repeat(120));
for (const imp of imports) {
  const parts = imp.split("/");
  const pkgName = `${parts[0]}/${parts[1]}`;
  const subpath = parts.length > 2 ? "./" + parts.slice(2).join("/") : ".";
  const pkg = pkgs[pkgName];
  if (!pkg) { console.log(`${imp.padEnd(55)} ${"MISSING".padEnd(16)} (package not in this workspace)`); missing++; continue; }
  const target = resolveExport(pkg.exports, subpath);
  if (!target) { console.log(`${imp.padEnd(55)} ${"NO-EXPORT".padEnd(16)} —`); missing++; continue; }
  if (pkg.private) {
    console.log(`${imp.padEnd(55)} ${"WORKSPACE-ONLY".padEnd(16)} ${target}`);
    workspaceOnly++;
  } else {
    console.log(`${imp.padEnd(55)} ${"OK".padEnd(16)} ${target}`);
    ok++;
  }
}

console.log(`\nTotal imports: ${imports.length}`);
console.log(`  OK (public npm package, resolves via dist/):          ${ok}`);
console.log(`  WORKSPACE-ONLY (private package, source-only — fine`);
console.log(`         for workspace consumers, never npm-published):  ${workspaceOnly}`);
console.log(`  MISSING (not in workspace; may be external github dep): ${missing}`);
