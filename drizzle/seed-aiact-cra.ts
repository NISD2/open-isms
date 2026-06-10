/**
 * Seed the EU AI Act and Cyber Resilience Act frameworks.
 *
 * Thin caller over `@nisd2/grc-data-model/seed`. The underlying primitive
 * upserts by natural key (framework code, category slug, requirement code)
 * and never deletes operational data, so live sign-offs survive re-runs.
 *
 * Usage: bun run drizzle/seed-aiact-cra.ts
 */
import { db } from "@/lib/db";
import {
  euAiActCategories,
  getEuAiActRequirementsForCategory,
  euCraCategories,
  getEuCraRequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import {
  aiActNis2SatisfactionPairs,
  aiActGdprSatisfactionPairs,
  craNis2SatisfactionPairs,
  craAiActSatisfactionPairs,
  craGdprSatisfactionPairs,
} from "@nisd2/grc-data-model/satisfaction-pairs";
import {
  seedFramework,
  linkSatisfactionPairs,
} from "@nisd2/grc-data-model/seed";

async function main() {
  console.log("EU AI Act + CRA framework seed\n");

  const ai = await seedFramework(db, {
    code: "eu_ai_act",
    version: "2024/1689",
    effectiveDate: "2024-08-01",
    codePrefix: "AI-",
    sidebarLabel: "aiact",
    categories: euAiActCategories,
    getRequirements: getEuAiActRequirementsForCategory,
  });
  console.log(`  eu_ai_act: ${ai.categoryCount} categories, ${ai.requirementCount} requirements`);

  const cra = await seedFramework(db, {
    code: "eu_cra",
    version: "2024/2847",
    effectiveDate: "2024-12-10",
    codePrefix: "CRA-",
    sidebarLabel: "cra",
    categories: euCraCategories,
    getRequirements: getEuCraRequirementsForCategory,
  });
  console.log(`  eu_cra:    ${cra.categoryCount} categories, ${cra.requirementCount} requirements`);

  console.log("\nLinking cross-framework satisfaction pairs...");
  const sets: [string, typeof aiActNis2SatisfactionPairs][] = [
    ["AI Act <-> NIS 2", aiActNis2SatisfactionPairs],
    ["AI Act <-> GDPR", aiActGdprSatisfactionPairs],
    ["CRA <-> NIS 2", craNis2SatisfactionPairs],
    ["CRA <-> AI Act", craAiActSatisfactionPairs],
    ["CRA <-> GDPR", craGdprSatisfactionPairs],
  ];

  for (const [label, pairs] of sets) {
    const { linkedCount, skipped } = await linkSatisfactionPairs(db, pairs);
    console.log(`  ${label}: ${linkedCount} linked, ${skipped.length} skipped`);
    for (const s of skipped) console.warn(`    skipped: ${s}`);
  }

  console.log("\nSeed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
