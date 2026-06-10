/**
 * Link ISO 27001:2022 ↔ NIS2 cross-framework satisfaction pairs.
 *
 * Idempotent: upserts by (requirementA, requirementB) natural key.
 * Safe to re-run; does not touch existing sign-offs or status rows.
 *
 * Usage: bun run drizzle/seed-iso27001.ts
 */
import { db } from "@/lib/db";
import { iso27001Nis2SatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";
import { linkSatisfactionPairs } from "@nisd2/grc-data-model/seed";

async function main() {
  console.log("ISO 27001 ↔ NIS2 satisfaction pairs seed\n");

  const { linkedCount, skipped } = await linkSatisfactionPairs(
    db,
    iso27001Nis2SatisfactionPairs,
  );

  console.log(`  ISO 27001 <-> NIS2: ${linkedCount} linked, ${skipped.length} skipped`);
  for (const s of skipped) console.warn(`    skipped: ${s}`);

  console.log("\nSeed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
