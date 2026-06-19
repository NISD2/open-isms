#!/usr/bin/env bun
/**
 * Split messages/info/en.json into size-balanced chunk files so the wiki
 * namespace (~247k words, 162 top-level keys) can be translated in parallel.
 *
 * Output: scripts/i18n/_info-chunks/en/chunk-NN.json, each shaped { info: {subset} }.
 * Pair with merge-info.ts to reassemble messages/info/<locale>.json.
 */
import { readFile, writeFile, mkdir, rm } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHUNK_DIR = resolve(ROOT, "scripts/i18n/_info-chunks");
const TARGET = 90 * 1024; // ~90kb json per chunk

const raw = JSON.parse(await readFile(resolve(ROOT, "messages/info/en.json"), "utf-8"));
const info: Record<string, unknown> = raw.info;
const keys = Object.keys(info);

// greedy bin-pack by serialized size, largest first
const sized = keys
  .map((k) => ({ k, size: JSON.stringify(info[k]).length }))
  .sort((a, b) => b.size - a.size);

const bins: { keys: string[]; size: number }[] = [];
for (const { k, size } of sized) {
  let bin = bins.find((b) => b.size + size <= TARGET);
  if (!bin) {
    bin = { keys: [], size: 0 };
    bins.push(bin);
  }
  bin.keys.push(k);
  bin.size += size;
}

await rm(resolve(CHUNK_DIR, "en"), { recursive: true, force: true });
await mkdir(resolve(CHUNK_DIR, "en"), { recursive: true });

let i = 0;
const manifest: { chunk: string; keys: number; kb: number }[] = [];
for (const bin of bins) {
  const id = String(i).padStart(2, "0");
  const subset: Record<string, unknown> = {};
  // preserve original key order within the chunk
  for (const k of keys) if (bin.keys.includes(k)) subset[k] = info[k];
  await writeFile(
    resolve(CHUNK_DIR, "en", `chunk-${id}.json`),
    JSON.stringify({ info: subset }, null, 2) + "\n",
    "utf-8",
  );
  manifest.push({ chunk: `chunk-${id}`, keys: bin.keys.length, kb: Math.round(bin.size / 1024) });
  i += 1;
}

await writeFile(
  resolve(CHUNK_DIR, "manifest.json"),
  JSON.stringify({ totalKeys: keys.length, chunks: manifest }, null, 2) + "\n",
  "utf-8",
);

console.log(`Split info (${keys.length} keys) into ${bins.length} chunks:`);
for (const m of manifest) console.log(`  ${m.chunk}: ${m.keys} keys, ~${m.kb}kb`);
