/**
 * Generate AI guidance for compliance requirement forms.
 *
 * Reads all requirements from DB, calls LLM for structured guidance,
 * writes to data/guidance/{en,de}.json.
 *
 * Usage:
 *   bun run scripts/generate-guidance.ts
 *   bun run scripts/generate-guidance.ts --force
 *   bun run scripts/generate-guidance.ts --requirement 1.1
 *   bun run scripts/generate-guidance.ts --category 1
 *   bun run scripts/generate-guidance.ts --locale en
 *   bun run scripts/generate-guidance.ts --category GOV --locale de --force
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/schema";
import { REQUIREMENT_FIELD_MAP, CUSTOM_EDITOR_FIELDS } from "@/lib/compliance/requirement-fields";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import {
  generateRequirementGuidance,
  type GenerationInput,
} from "@/lib/ai/generate-requirement-guidance";
import type { GuidanceFile, RequirementGuidanceData } from "@/lib/ai/guidance-types";
import requirementsEn from "@/messages/requirements/en.json";
import complianceEn from "@/messages/compliance/en.json";
import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../data/guidance");
const LOCALES = ["en", "de"] as const;
const CONCURRENCY = 5;

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let force = false;
  let requirementFilter: string | null = null;
  let categoryFilter: string | null = null;
  let localeFilter: "en" | "de" | null = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--force":
        force = true;
        break;
      case "--requirement":
        requirementFilter = args[++i] ?? null;
        break;
      case "--category":
        categoryFilter = args[++i] ?? null;
        break;
      case "--locale":
        localeFilter = args[++i] as "en" | "de" | null;
        break;
    }
  }

  return { force, requirementFilter, categoryFilter, localeFilter };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadExisting(locale: string): Promise<GuidanceFile> {
  const path = resolve(DATA_DIR, `${locale}.json`);
  try {
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as GuidanceFile;
  } catch {
    return {};
  }
}

async function saveFile(locale: string, data: GuidanceFile) {
  await mkdir(DATA_DIR, { recursive: true });
  const path = resolve(DATA_DIR, `${locale}.json`);
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

async function runBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { force, requirementFilter, categoryFilter, localeFilter } = parseArgs();
  const locales = localeFilter ? [localeFilter] : [...LOCALES];

  console.log("Connecting to database...");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required");
  const db = drizzle(dbUrl, { schema });

  // Load all requirements with their categories
  const allRequirements = await db.query.requirement.findMany({
    with: { category: true },
    orderBy: (r, { asc }) => [asc(r.sortOrder)],
  });

  // Filter requirements
  let requirements = allRequirements;
  if (requirementFilter) {
    requirements = requirements.filter((r) => r.code === requirementFilter);
  }
  if (categoryFilter) {
    requirements = requirements.filter((r) => r.category.code === categoryFilter);
  }

  if (requirements.length === 0) {
    console.log("No matching requirements found.");
    process.exit(0);
  }

  console.log(`Found ${requirements.length} requirements to process.`);

  for (const locale of locales) {
    console.log(`\n--- Generating ${locale.toUpperCase()} guidance ---`);
    const existing = await loadExisting(locale);

    // Build work items (skip already-generated unless --force)
    const work: Array<{
      req: (typeof requirements)[0];
      locale: "en" | "de";
    }> = [];

    for (const req of requirements) {
      if (!force && existing[req.code]) {
        continue;
      }
      work.push({ req, locale: locale as "en" | "de" });
    }

    if (work.length === 0) {
      console.log(`  All ${requirements.length} requirements already generated. Use --force to regenerate.`);
      continue;
    }

    console.log(`  Generating ${work.length} requirements (${requirements.length - work.length} skipped)...`);

    let completed = 0;
    let successCount = 0;

    await runBatch(work, CONCURRENCY, async ({ req, locale: loc }) => {
      // Build field metadata for this requirement
      const fieldInfo = REQUIREMENT_FIELD_MAP[req.code];
      let fieldMetas: GenerationInput["fields"] = [];

      if (fieldInfo) {
        const catSchema = CATEGORY_SCHEMAS[fieldInfo.categoryCode];
        if (catSchema) {
          const allFields = introspectSchema(catSchema, []);
          fieldMetas = allFields
            .filter((f) => fieldInfo.fieldKeys.includes(f.key))
            .map((f) => ({
              key: f.key,
              label: f.label,
              type: f.type,
              required: f.required,
              options: f.options,
            }));
        }
      }

      // Fallback: custom editor fields (structured editors not in schema-form)
      if (fieldMetas.length === 0 && CUSTOM_EDITOR_FIELDS[req.code]) {
        fieldMetas = CUSTOM_EDITOR_FIELDS[req.code];
      }

      const reqKey = req.code.replace(/\./g, "_") as keyof typeof requirementsEn.requirements;
      const catKey = req.category.code as keyof typeof complianceEn.compliance.categories;
      const input: GenerationInput = {
        requirementCode: req.code,
        requirementTitle: requirementsEn.requirements[reqKey]?.title ?? req.code,
        description: requirementsEn.requirements[reqKey]?.description ?? "",
        evidenceType: req.evidenceType,
        legalRef: req.legalRef,
        frameworkRef: req.frameworkRef,
        categoryName: complianceEn.compliance.categories[catKey]?.name ?? req.category.code,
        categoryCode: req.category.code,
        fields: fieldMetas,
        locale: loc,
      };

      try {
        const guidance = await generateRequirementGuidance(input);
        existing[req.code] = guidance;
        await saveFile(locale as "en" | "de", existing);
        completed++;
        successCount++;
        console.log(`  [${completed}/${work.length}] ${req.code} ✓`);
      } catch (error) {
        completed++;
        console.error(`  [${completed}/${work.length}] ${req.code} ✗ ${error instanceof Error ? error.message : error}`);
      }
    });

    console.log(`  ${locale}.json: ${successCount}/${work.length} succeeded, ${Object.keys(existing).length} total`);
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
