#!/usr/bin/env bun
/**
 * Translate next-intl message namespaces into the target locales defined in
 * plan.ts, using xAI via the Vercel AI SDK (the repo's existing provider).
 *
 * Source of truth for which locales exist: scripts/i18n/plan.ts
 * Legal-fidelity + term-lock policy: scripts/i18n/glossary.ts
 *
 * Usage:
 *   bun run scripts/i18n/translate.ts --locale fr --dry-run
 *   bun run scripts/i18n/translate.ts --wave 1 --dry-run
 *   bun --env-file=.env run scripts/i18n/translate.ts --locale fr
 *   bun --env-file=.env run scripts/i18n/translate.ts --locale fr --namespace common --force
 *   bun --env-file=.env run scripts/i18n/translate.ts --wave 1 --include-wiki   (discouraged)
 *
 * What it does NOT do:
 *   - It does not activate locales. Adding a code to i18n/routing.ts is a
 *     separate, deliberate go-live step (see README).
 *   - It refuses the `info` (wiki) namespace unless --include-wiki is passed.
 *     The wiki is curated/localised, not bulk-translated. See assessment §6.
 */

import { readFile, writeFile, readdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import {
  SOURCE_LOCALE,
  TARGET_LOCALES,
  TRANSLATION_MODEL,
  WIKI_NAMESPACE,
  getTargetLocale,
  localesForWave,
  type TargetLocale,
} from "./plan";
import { glossaryPromptBlock } from "./glossary";

const MESSAGES_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../messages",
);

const CHUNK_SIZE = 60; // strings per model call
const CONCURRENCY = 4; // concurrent model calls

// ---------------------------------------------------------------------------
// JSON tree helpers (structure-preserving, no casts)
// ---------------------------------------------------------------------------

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Collect every string leaf, in deterministic traversal order. */
function collectStrings(node: Json, out: string[]): void {
  if (typeof node === "string") {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectStrings(child, out);
    return;
  }
  if (node !== null && typeof node === "object") {
    for (const value of Object.values(node)) collectStrings(value, out);
  }
}

/** Rebuild the same tree, replacing the k-th string with translated[k]. */
function rebuild(node: Json, translated: string[], counter: { i: number }): Json {
  if (typeof node === "string") {
    const next = translated[counter.i];
    counter.i += 1;
    return next ?? node;
  }
  if (Array.isArray(node)) {
    return node.map((child) => rebuild(child, translated, counter));
  }
  if (node !== null && typeof node === "object") {
    const out: { [k: string]: Json } = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = rebuild(value, translated, counter);
    }
    return out;
  }
  return node;
}

// ---------------------------------------------------------------------------
// Placeholder preservation check (no regex — simple brace/tag scan)
// ---------------------------------------------------------------------------

function isIdentChar(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    (ch >= "0" && ch <= "9") ||
    ch === "_"
  );
}

/** Multiset of ICU argument names ({name}, {name, plural, ...}) plus tag
 *  names (<link>). Used to detect dropped/added placeholders. */
function placeholderTokens(s: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") {
      let j = i + 1;
      while (j < s.length && s[j] === " ") j += 1;
      let name = "";
      while (j < s.length && isIdentChar(s[j])) {
        name += s[j];
        j += 1;
      }
      if (name.length > 0) tokens.push(`{${name}}`);
    } else if (ch === "<") {
      let j = i + 1;
      if (j < s.length && s[j] === "/") j += 1;
      let name = "";
      while (j < s.length && isIdentChar(s[j])) {
        name += s[j];
        j += 1;
      }
      if (name.length > 0) tokens.push(`<${name}>`);
    }
  }
  return tokens.sort();
}

function placeholdersMatch(source: string, target: string): boolean {
  const a = placeholderTokens(source);
  const b = placeholderTokens(target);
  if (a.length !== b.length) return false;
  return a.every((token, idx) => token === b[idx]);
}

// ---------------------------------------------------------------------------
// Translation (lazy AI import so --dry-run needs no key)
// ---------------------------------------------------------------------------

const chunkSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string() })),
});

type Translator = (strings: string[]) => Promise<string[]>;

async function makeTranslator(locale: TargetLocale): Promise<Translator> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "XAI_API_KEY not set. Run with: bun --env-file=.env run scripts/i18n/translate.ts ...",
    );
  }
  const { generateObject } = await import("ai");
  const { createXai } = await import("@ai-sdk/xai");
  const xai = createXai({ apiKey });

  const system = [
    `You are a professional legal-technical translator. Translate from ${SOURCE_LOCALE} into ${locale.endonym} (${locale.label}).`,
    `This is the UI and content of a NIS2 / EU cybersecurity compliance platform for ${locale.label}-speaking SMEs.`,
    `Audience: company directors, CISOs and lawyers. Register: plain, professional, no marketing fluff, no emojis, no em-dashes.`,
    "",
    `National context: ${locale.nationalContext}`,
    "",
    glossaryPromptBlock(),
  ].join("\n");

  return async (strings: string[]): Promise<string[]> => {
    const items = strings.map((text, idx) => ({ id: String(idx), text }));
    const { object } = await generateObject({
      model: xai(TRANSLATION_MODEL),
      schema: chunkSchema,
      system,
      prompt: [
        `Translate each input string. Return one item per id, reusing the same id, same count and order.`,
        `Inputs (JSON):`,
        JSON.stringify(items),
      ].join("\n"),
    });

    const byId = new Map(object.items.map((it) => [it.id, it.text]));
    return strings.map((original, idx) => byId.get(String(idx)) ?? original);
  };
}

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Namespace + file helpers
// ---------------------------------------------------------------------------

async function listNamespaces(): Promise<string[]> {
  const entries = await readdir(MESSAGES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

async function readJson(path: string): Promise<Json> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as Json;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path, "utf-8");
    return true;
  } catch {
    return false;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  locales: string[];
  namespace: string | null;
  includeWiki: boolean;
  dryRun: boolean;
  force: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let namespace: string | null = null;
  let includeWiki = false;
  let dryRun = false;
  let force = false;
  const locales: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--locale":
        {
          const code = argv[++i];
          if (code) locales.push(code);
        }
        break;
      case "--wave":
        {
          const w = argv[++i];
          if (w === "1" || w === "2") {
            for (const l of localesForWave(w === "1" ? 1 : 2)) locales.push(l.code);
          }
        }
        break;
      case "--all":
        for (const l of TARGET_LOCALES) locales.push(l.code);
        break;
      case "--namespace":
        namespace = argv[++i] ?? null;
        break;
      case "--include-wiki":
        includeWiki = true;
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "--force":
        force = true;
        break;
    }
  }

  return { locales: [...new Set(locales)], namespace, includeWiki, dryRun, force };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function translateNamespace(
  locale: TargetLocale,
  namespace: string,
  args: Args,
): Promise<void> {
  const sourcePath = resolve(MESSAGES_DIR, namespace, `${SOURCE_LOCALE}.json`);
  const targetPath = resolve(MESSAGES_DIR, namespace, `${locale.code}.json`);

  const source = await readJson(sourcePath);
  const strings: string[] = [];
  collectStrings(source, strings);

  if (args.dryRun) {
    const chars = strings.reduce((sum, s) => sum + s.length, 0);
    console.log(
      `  [dry] ${locale.code}/${namespace}: ${strings.length} strings, ~${Math.round(
        chars / 4,
      )} tokens -> ${targetPath.replace(MESSAGES_DIR, "messages")}`,
    );
    return;
  }

  if (!args.force && (await fileExists(targetPath))) {
    console.log(`  skip ${locale.code}/${namespace} (exists; use --force)`);
    return;
  }

  const translate = await makeTranslator(locale);
  const batches = chunk(strings, CHUNK_SIZE);
  const translatedBatches = await mapLimit(batches, CONCURRENCY, (batch) =>
    translate(batch),
  );
  const translated = translatedBatches.flat();

  if (translated.length !== strings.length) {
    throw new Error(
      `${locale.code}/${namespace}: count mismatch (${translated.length} vs ${strings.length})`,
    );
  }

  let drift = 0;
  for (let i = 0; i < strings.length; i++) {
    if (!placeholdersMatch(strings[i], translated[i])) {
      drift += 1;
      console.warn(
        `  ! placeholder drift ${locale.code}/${namespace} #${i}: "${strings[i]}" -> "${translated[i]}"`,
      );
    }
  }

  const output = rebuild(source, translated, { i: 0 });
  await writeFile(targetPath, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(
    `  wrote ${locale.code}/${namespace} (${strings.length} strings${
      drift ? `, ${drift} placeholder warnings` : ""
    })`,
  );
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.locales.length === 0) {
    console.error(
      "No locales selected. Use --locale <code>, --wave 1|2, or --all.\n" +
        `Available: ${TARGET_LOCALES.map((l) => l.code).join(", ")}`,
    );
    process.exit(1);
  }

  const unknown = args.locales.filter((c) => !getTargetLocale(c));
  if (unknown.length > 0) {
    console.error(`Unknown locale(s): ${unknown.join(", ")}`);
    process.exit(1);
  }

  let namespaces = args.namespace ? [args.namespace] : await listNamespaces();
  if (!args.includeWiki && namespaces.includes(WIKI_NAMESPACE)) {
    namespaces = namespaces.filter((ns) => ns !== WIKI_NAMESPACE);
    console.log(
      `Skipping '${WIKI_NAMESPACE}' (the ~247k-word wiki is curated/localised, not bulk-translated). Pass --include-wiki to override.`,
    );
  }

  console.log(
    `${args.dryRun ? "[DRY RUN] " : ""}source=${SOURCE_LOCALE} model=${TRANSLATION_MODEL}`,
  );
  console.log(`locales: ${args.locales.join(", ")}`);
  console.log(`namespaces: ${namespaces.length}`);

  for (const code of args.locales) {
    const locale = getTargetLocale(code);
    if (!locale) continue;
    console.log(`\n== ${locale.label} (${locale.code}) ==`);
    for (const namespace of namespaces) {
      await translateNamespace(locale, namespace, args);
    }
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
