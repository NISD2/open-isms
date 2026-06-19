#!/usr/bin/env bun
/**
 * Reassemble translated info chunks into messages/info/<locale>.json.
 * Verifies the merged key set matches en.json exactly before writing.
 *
 * Usage: bun run scripts/i18n/merge-info.ts <locale>
 */
import { readFile, writeFile, readdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHUNK_DIR = resolve(ROOT, "scripts/i18n/_info-chunks");

const locale = process.argv[2];
if (!locale) {
  console.error("Usage: bun run scripts/i18n/merge-info.ts <locale>");
  process.exit(1);
}

const en = JSON.parse(await readFile(resolve(ROOT, "messages/info/en.json"), "utf-8"));
const enKeys = Object.keys(en.info);

const dir = resolve(CHUNK_DIR, locale);
const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();

const merged: Record<string, unknown> = {};
for (const f of files) {
  const chunk = JSON.parse(await readFile(resolve(dir, f), "utf-8"));
  for (const [k, v] of Object.entries(chunk.info ?? {})) merged[k] = v;
}

const missing = enKeys.filter((k) => !(k in merged));
const extra = Object.keys(merged).filter((k) => !enKeys.includes(k));
if (missing.length || extra.length) {
  console.error(`KEY MISMATCH for ${locale}:`);
  if (missing.length) console.error(`  missing ${missing.length}: ${missing.slice(0, 10).join(", ")}`);
  if (extra.length) console.error(`  extra ${extra.length}: ${extra.slice(0, 10).join(", ")}`);
  process.exit(1);
}

// emit in en key order
const ordered: Record<string, unknown> = {};
for (const k of enKeys) ordered[k] = merged[k];

await writeFile(
  resolve(ROOT, `messages/info/${locale}.json`),
  JSON.stringify({ info: ordered }, null, 2) + "\n",
  "utf-8",
);
console.log(`Merged ${files.length} chunks -> messages/info/${locale}.json (${enKeys.length} keys)`);
