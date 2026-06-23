#!/usr/bin/env bun
/**
 * Translate a course (markdown lessons + structured TS data) from English into
 * every platform locale, using xAI via the Vercel AI SDK (the repo's existing
 * provider) and the shared legal-fidelity glossary.
 *
 * English is the single source of truth:
 *   - content/<slug>.en.md      -> content/<slug>.<locale>.md   (full-file)
 *   - dictionary.ts / index.ts / quizzes/*.ts: every locale-keyed string
 *     ({ en, de, ... }) is refilled from its `en` value. Non-string data
 *     (ids, correctIndex, slugs, term keys) is preserved verbatim.
 *
 * Companion to scripts/i18n/translate.ts (which handles next-intl namespaces).
 * Same provider, same glossary, same voice rules.
 *
 * Usage:
 *   bun run scripts/i18n/translate-course.ts --course cra-sbom --dry-run
 *   bun --env-file=.env run scripts/i18n/translate-course.ts --course cra-sbom --locale de
 *   bun --env-file=.env run scripts/i18n/translate-course.ts --course cra-sbom --all
 *   bun --env-file=.env run scripts/i18n/translate-course.ts --course cra-sbom --all --only md
 */

import { readFile, writeFile, readdir } from "fs/promises";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { SOURCE_LOCALE, TARGET_LOCALES, TRANSLATION_MODEL, type TargetLocale } from "./plan";
import { glossaryPromptBlock } from "./glossary";

const COURSES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../courses");

// The two platform-primary locales are not in plan.ts (it lists only the
// machine-translated wave locales). Courses ship all ten, so define them here.
const PRIMARY_LOCALES: TargetLocale[] = [
  {
    code: "de",
    label: "German",
    endonym: "Deutsch",
    wave: 1,
    nationalContext:
      "Germany transposed NIS2 via the BSIG (NIS2-Umsetzungsgesetz); competent authority is the BSI. The CRA applies directly EU-wide.",
  },
  {
    code: "nl",
    label: "Dutch",
    endonym: "Nederlands",
    wave: 1,
    nationalContext:
      "The Netherlands transposed NIS2 via the Cyberbeveiligingswet; competent authorities include the NCSC and RDI. The CRA applies directly EU-wide.",
  },
];

const ALL_TARGETS: TargetLocale[] = [...PRIMARY_LOCALES, ...TARGET_LOCALES];
const LOCALE_ORDER = ["en", ...ALL_TARGETS.map((l) => l.code)];

// ---------------------------------------------------------------------------
// AI (lazy import so --dry-run needs no key)
// ---------------------------------------------------------------------------

type TextTranslator = (text: string) => Promise<string>;
type BatchTranslator = (texts: string[]) => Promise<string[]>;

function systemPrompt(locale: TargetLocale, markdown: boolean): string {
  return [
    `You are a professional legal-technical translator. Translate from ${SOURCE_LOCALE} into ${locale.endonym} (${locale.label}).`,
    `This is content from a Cyber Resilience Act (EU 2024/2847) training course. Audience: product managers, engineers and security leads. Register: plain, professional, precise. No emojis. No em-dashes.`,
    "",
    `National context: ${locale.nationalContext}`,
    "",
    "HARD RULES:",
    "- Keep these terms unchanged (do NOT translate): CRA, SBOM, ENISA, CISA, KEV, NVD, CVE, CVSS, VEX, PURL, OWASP, CycloneDX, SPDX, ISO/IEC, Syft, Grype, cdxgen, Cosign, Sigstore, Dependency-Track, GitHub, GitLab, Linux Foundation, SHA-256, JSON, XML, YAML, SolarWinds, Log4Shell.",
    "- EU legal citations: keep every article/annex NUMBER identical; translate only the structural words using the official EUR-Lex terminology for the target language. Examples for German: 'Annex I, Part II, point (1)' -> 'Anhang I Teil II Nummer 1'; 'Article 13(13)' -> 'Artikel 13(13)'; 'Article 14' -> 'Artikel 14'.",
    markdown
      ? "- Preserve markdown structure EXACTLY: headings, lists, tables, blockquotes (>), bold/italic, line breaks."
      : "- Translate the string as a self-contained UI/content string.",
    markdown
      ? "- Keep fenced code blocks (```), inline code (`...`), URLs, file paths, CLI commands and flags, and JSON VERBATIM. Never translate anything inside code."
      : "- Keep any inline code (`...`), URLs and file paths verbatim.",
    "- Wiki-links [[term]] and [[term|display]]: keep the part BEFORE the pipe (the canonical English glossary key) EXACTLY as in English; translate only the display text after the pipe. For a bare [[term]] that needs a localized surface form, convert it to [[term|localized display]] keeping the English key. Universal terms (SBOM, CycloneDX, SPDX, VEX, PURL, CVE, attestation) stay as bare [[term]].",
    markdown
      ? "- Output ONLY the translated markdown. No commentary, no surrounding code fence."
      : "",
    "",
    glossaryPromptBlock(),
  ]
    .filter(Boolean)
    .join("\n");
}

async function makeTextTranslator(locale: TargetLocale): Promise<TextTranslator> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not set. Run with: bun --env-file=.env run ...");
  const { generateText } = await import("ai");
  const { createXai } = await import("@ai-sdk/xai");
  const xai = createXai({ apiKey });
  const system = systemPrompt(locale, true);
  return async (text: string): Promise<string> => {
    const { text: out } = await generateText({
      model: xai(TRANSLATION_MODEL),
      system,
      prompt: text,
    });
    return out.trim() + "\n";
  };
}

const chunkSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string() })),
});

async function makeBatchTranslator(locale: TargetLocale): Promise<BatchTranslator> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not set. Run with: bun --env-file=.env run ...");
  const { generateObject } = await import("ai");
  const { createXai } = await import("@ai-sdk/xai");
  const xai = createXai({ apiKey });
  const system = systemPrompt(locale, false);
  return async (texts: string[]): Promise<string[]> => {
    if (texts.length === 0) return [];
    const items = texts.map((text, idx) => ({ id: String(idx), text }));
    const { object } = await generateObject({
      model: xai(TRANSLATION_MODEL),
      schema: chunkSchema,
      system,
      prompt: [
        "Translate each input string. Return one item per id, same id, same count and order.",
        "Inputs (JSON):",
        JSON.stringify(items),
      ].join("\n"),
    });
    const byId = new Map(object.items.map((it) => [it.id, it.text]));
    return texts.map((orig, idx) => byId.get(String(idx)) ?? orig);
  };
}

// ---------------------------------------------------------------------------
// localeString tree walking (for the TS data files)
// ---------------------------------------------------------------------------

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** A localeString is an object whose `en` value is a string. */
function isLocaleString(node: Json): node is { [k: string]: Json } {
  return (
    typeof node === "object" &&
    node !== null &&
    !Array.isArray(node) &&
    typeof (node as { [k: string]: Json }).en === "string"
  );
}

/** Collect every localeString object reachable from the tree. */
function collectLocaleStrings(node: Json, out: { [k: string]: Json }[]): void {
  if (isLocaleString(node)) {
    out.push(node);
    return; // do not recurse into a localeString
  }
  if (Array.isArray(node)) {
    for (const child of node) collectLocaleStrings(child, out);
    return;
  }
  if (typeof node === "object" && node !== null) {
    for (const value of Object.values(node)) collectLocaleStrings(value, out);
  }
}

/** Genuine prose: >= 5 words and contains a lowercase alphabetic word >= 4 chars. */
function isProse(s: string): boolean {
  const words = s.trim().split(/\s+/);
  if (words.length < 5) return false;
  return words.some((w) => /^[a-z]{4,}$/.test(w.replace(/[.,;:'"()]/g, "")));
}

/** Code/command/identifier strings that must never be translated. */
function isCodeLike(s: string): boolean {
  return /[`<>$]|--|\b(syft|cdxgen|grype|cosign|cyclonedx)\b|:latest|\.(json|cdx|ts|md)\b/.test(s);
}

/** Order locale keys canonically, keeping any unexpected keys at the end. */
function orderLocaleKeys(obj: { [k: string]: Json }): { [k: string]: Json } {
  const out: { [k: string]: Json } = {};
  for (const code of LOCALE_ORDER) {
    if (code in obj) out[code] = obj[code];
  }
  for (const key of Object.keys(obj)) {
    if (!(key in out)) out[key] = obj[key];
  }
  return out;
}

// ---------------------------------------------------------------------------
// concurrency
// ---------------------------------------------------------------------------

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// TS data file emit (deterministic, valid TS object literals)
// ---------------------------------------------------------------------------

const TS_WRAPPERS: Record<string, (body: string) => string> = {
  index: (body) =>
    `import { courseSchema } from "@/lib/training/schemas";\n\nconst course = courseSchema.parse(${body});\n\nexport default course;\n`,
  dictionary: (body) =>
    `import { dictionaryTermSchema, type DictionaryTerm } from "@/lib/training/schemas";\nimport { z } from "zod";\n\n// Locale values are filled from the \`en\` source by scripts/i18n/translate-course.ts.\nconst dictionary: DictionaryTerm[] = z.array(dictionaryTermSchema).parse(${body});\n\nexport default dictionary;\n`,
  quiz: (body) =>
    `import { quizSchema } from "@/lib/training/schemas";\n\n// AUTHORING RULE: every question must be answerable from its lesson text alone.\n// Locale values are filled from the \`en\` source by scripts/i18n/translate-course.ts.\nconst quiz = quizSchema.parse(${body});\n\nexport default quiz;\n`,
};

function wrapperFor(relPath: string): (body: string) => string {
  if (relPath === "index.ts") return TS_WRAPPERS.index;
  if (relPath === "dictionary.ts") return TS_WRAPPERS.dictionary;
  if (relPath.startsWith("quizzes/")) return TS_WRAPPERS.quiz;
  throw new Error(`No emit wrapper for ${relPath}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  course: string;
  locales: string[];
  dryRun: boolean;
  only: "md" | "ts" | "both";
  repair: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let course = "";
  let dryRun = false;
  let repair = false;
  let only: "md" | "ts" | "both" = "both";
  const locales: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--course": course = argv[++i] ?? ""; break;
      case "--locale": { const c = argv[++i]; if (c) locales.push(c); break; }
      case "--all": for (const l of ALL_TARGETS) locales.push(l.code); break;
      case "--dry-run": dryRun = true; break;
      case "--repair": repair = true; break;
      case "--only": { const v = argv[++i]; if (v === "md" || v === "ts") only = v; break; }
    }
  }
  return { course, locales: [...new Set(locales)], dryRun, only, repair };
}

const CONCURRENCY = 4;
const BATCH = 40;

async function translateMarkdown(courseDir: string, targets: TargetLocale[], dryRun: boolean): Promise<void> {
  const contentDir = join(courseDir, "content");
  const files = (await readdir(contentDir)).filter((f) => f.endsWith(".en.md")).sort();
  console.log(`\nMarkdown: ${files.length} lessons x ${targets.length} locales`);
  for (const locale of targets) {
    const translate = dryRun ? null : await makeTextTranslator(locale);
    for (const file of files) {
      const slug = file.replace(".en.md", "");
      const src = await readFile(join(contentDir, file), "utf-8");
      const target = join(contentDir, `${slug}.${locale.code}.md`);
      if (dryRun) {
        console.log(`  [dry] ${slug}.${locale.code}.md  (~${Math.round(src.length / 4)} tok)`);
        continue;
      }
      if (!translate) continue;
      const out = await translate(src);
      await writeFile(target, out, "utf-8");
      console.log(`  wrote ${slug}.${locale.code}.md`);
    }
  }
}

async function translateTsData(courseDir: string, relPath: string, targets: TargetLocale[], dryRun: boolean): Promise<void> {
  const mod = await import(join(courseDir, relPath));
  const data = mod.default as unknown as Json;
  const localeStrings: { [k: string]: Json }[] = [];
  collectLocaleStrings(data, localeStrings);
  const enTexts = localeStrings.map((ls) => ls.en as string);

  if (dryRun) {
    console.log(`  [dry] ${relPath}: ${localeStrings.length} localeStrings x ${targets.length} locales`);
    return;
  }

  for (const locale of targets) {
    const translate = await makeBatchTranslator(locale);
    const batches = chunk(enTexts, BATCH);
    const translated = (await mapLimit(batches, CONCURRENCY, (b) => translate(b))).flat();
    if (translated.length !== enTexts.length) {
      throw new Error(`${relPath}/${locale.code}: count mismatch ${translated.length} vs ${enTexts.length}`);
    }
    localeStrings.forEach((ls, i) => { ls[locale.code] = translated[i]; });
    console.log(`  ${relPath}: ${locale.code} (${enTexts.length})`);
  }

  // Canonicalize key order on every localeString, then emit.
  const reordered: { [k: string]: Json }[] = [];
  collectLocaleStrings(data, reordered);
  for (const ls of reordered) {
    const ordered = orderLocaleKeys(ls);
    for (const k of Object.keys(ls)) delete ls[k];
    Object.assign(ls, ordered);
  }

  const body = JSON.stringify(data, null, 2);
  const out = wrapperFor(relPath)(body);
  await writeFile(join(courseDir, relPath), out, "utf-8");
  console.log(`  wrote ${relPath}`);
}

/** Re-translate, individually, any locale string that still equals its English
 *  prose source (a batch echo). One string per call is reliable. */
async function repairTsData(courseDir: string, relPath: string, targets: TargetLocale[], dryRun: boolean): Promise<void> {
  const mod = await import(join(courseDir, relPath));
  const data = mod.default as unknown as Json;
  const localeStrings: { [k: string]: Json }[] = [];
  collectLocaleStrings(data, localeStrings);

  const fixes: { ls: { [k: string]: Json }; locale: TargetLocale }[] = [];
  for (const ls of localeStrings) {
    const en = ls.en as string;
    if (!isProse(en) || isCodeLike(en)) continue;
    for (const locale of targets) {
      if (ls[locale.code] === en) fixes.push({ ls, locale });
    }
  }
  if (fixes.length === 0) return;
  console.log(`  ${relPath}: ${fixes.length} echoed string(s) to repair`);
  if (dryRun) {
    for (const f of fixes) console.log(`    [dry] ${f.locale.code} :: ${(f.ls.en as string).slice(0, 60)}`);
    return;
  }
  const translators = new Map<string, TextTranslator>();
  for (const { ls, locale } of fixes) {
    let t = translators.get(locale.code);
    if (!t) { t = await makeTextTranslator(locale); translators.set(locale.code, t); }
    ls[locale.code] = (await t(ls.en as string)).trim();
  }
  const reordered: { [k: string]: Json }[] = [];
  collectLocaleStrings(data, reordered);
  for (const ls of reordered) {
    const ordered = orderLocaleKeys(ls);
    for (const k of Object.keys(ls)) delete ls[k];
    Object.assign(ls, ordered);
  }
  await writeFile(join(courseDir, relPath), wrapperFor(relPath)(JSON.stringify(data, null, 2)), "utf-8");
  console.log(`  repaired ${relPath}`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args.course) { console.error("Missing --course <id>"); process.exit(1); }
  if (args.locales.length === 0) {
    console.error(`No locales. Use --locale <code> or --all. Available: ${ALL_TARGETS.map((l) => l.code).join(", ")}`);
    process.exit(1);
  }
  const targets = ALL_TARGETS.filter((l) => args.locales.includes(l.code));
  const courseDir = join(COURSES_DIR, args.course);

  console.log(`${args.dryRun ? "[DRY RUN] " : ""}course=${args.course} model=${TRANSLATION_MODEL}`);
  console.log(`locales: ${targets.map((l) => l.code).join(", ")}  only=${args.only}`);

  const quizFiles = (await readdir(join(courseDir, "quizzes"))).filter((f) => f.endsWith(".ts")).sort();
  const tsFiles = ["index.ts", "dictionary.ts", ...quizFiles.map((q) => `quizzes/${q}`)];

  if (args.repair) {
    console.log(`\nRepair mode: re-translating echoed prose strings`);
    for (const rel of tsFiles) await repairTsData(courseDir, rel, targets, args.dryRun);
    return;
  }

  if (args.only !== "ts") await translateMarkdown(courseDir, targets, args.dryRun);
  if (args.only !== "md") {
    console.log(`\nTS data files:`);
    for (const rel of tsFiles) await translateTsData(courseDir, rel, targets, args.dryRun);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
