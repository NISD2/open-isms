/**
 * NIS2 framework metadata sync.
 *
 * Pushes the current NIS2 requirement metadata (legalRef, cirReference,
 * frameworkRef, frequency, priority, moduleRef) and the cross-framework
 * satisfaction pairs from the TS source of truth into the database.
 *
 * Safe in any environment: the underlying seedFramework primitive matches
 * existing rows by natural key (framework code, category slug, requirement
 * code) and updates metadata in place. No rows are deleted and no
 * operational data (company_requirement_status, sign_off_history,
 * assignments, audit trails) is ever touched. Frequency changes only affect
 * nextReviewDate values computed after the next status change; existing
 * review dates are left as they are.
 *
 * Usage: bun run drizzle/seed-nis2-sync.ts
 */
import { db } from "@/lib/db";
import {
  nis2Categories,
  getNis2RequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import {
  nis2GdprSatisfactionPairs,
  aiActNis2SatisfactionPairs,
  craNis2SatisfactionPairs,
  iso27001Nis2SatisfactionPairs,
} from "@nisd2/grc-data-model/satisfaction-pairs";
import { linkSatisfactionPairs, seedFramework } from "@nisd2/grc-data-model/seed";

async function main() {
  console.log("NIS2 framework metadata sync\n");

  const { frameworkId, categoryCount, requirementCount } = await seedFramework(db, {
    code: "nis2",
    version: "2026",
    effectiveDate: "2026-03-17",
    codePrefix: "NIS2-",
    sidebarLabel: "nis2",
    categories: nis2Categories,
    getRequirements: getNis2RequirementsForCategory,
  });

  console.log(`  Framework: nis2 (${frameworkId})`);
  console.log(`  Upserted: ${categoryCount} categories, ${requirementCount} requirements`);

  const pairSets = [
    ["NIS2 <-> GDPR", nis2GdprSatisfactionPairs],
    ["AI Act <-> NIS2", aiActNis2SatisfactionPairs],
    ["CRA <-> NIS2", craNis2SatisfactionPairs],
    ["ISO 27001 <-> NIS2", iso27001Nis2SatisfactionPairs],
  ] as const;

  for (const [label, pairs] of pairSets) {
    const { linkedCount, skipped } = await linkSatisfactionPairs(db, pairs);
    console.log(`  ${label}: ${linkedCount} linked, ${skipped.length} skipped`);
    for (const s of skipped) console.warn(`    skipped: ${s}`);
  }

  console.log("\nSync complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
