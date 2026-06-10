/**
 * One-shot, idempotent backfill: tag the 16 equivalent satisfaction pairs.
 *
 * After migration 0011 every existing requirement_satisfaction row defaults
 * to 'overlapping'. This script reads the equivalent pairs from the package's
 * satisfaction-pairs reference data and runs targeted UPDATEs by joining on
 * requirement.code. Touches only the 16 specific rows. Does NOT delete or
 * recreate requirements, so live sign-offs are not affected.
 *
 * Usage:
 *   bun run scripts/backfill-equivalent-pairs.ts        # dev
 *   DATABASE_URL=$PROD_DB_URL bun run scripts/backfill-equivalent-pairs.ts
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requirement, requirementSatisfaction } from "@/schema";
import { allSatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";

const equivalentPairs = allSatisfactionPairs.filter(
  ([, , , kind]) => kind === "equivalent",
);

console.log(`Backfilling equivalence_kind = 'equivalent' for ${equivalentPairs.length} pairs.\n`);

let updated = 0;
let missing = 0;

for (const [aCode, bCode] of equivalentPairs) {
  const aRow = await db.query.requirement.findFirst({
    where: eq(requirement.code, aCode),
    columns: { id: true },
  });
  const bRow = await db.query.requirement.findFirst({
    where: eq(requirement.code, bCode),
    columns: { id: true },
  });

  if (!aRow || !bRow) {
    console.log(`  miss: ${aCode} <-> ${bCode} (requirement not seeded)`);
    missing++;
    continue;
  }

  const result = await db
    .update(requirementSatisfaction)
    .set({ equivalenceKind: "equivalent" })
    .where(
      and(
        eq(requirementSatisfaction.requirementAId, aRow.id),
        eq(requirementSatisfaction.requirementBId, bRow.id),
      ),
    )
    .returning({ id: requirementSatisfaction.id });

  if (result.length === 1) {
    console.log(`  ok:   ${aCode} <-> ${bCode}`);
    updated++;
  } else {
    console.log(`  miss: ${aCode} <-> ${bCode} (pair row not present)`);
    missing++;
  }
}

const verify = await db.execute<{ kind: string; cnt: number }>(sql`
  SELECT equivalence_kind AS kind, count(*)::int AS cnt
  FROM requirement_satisfaction
  GROUP BY equivalence_kind
  ORDER BY equivalence_kind
`);

console.log(`\nUpdated ${updated}, missed ${missing}.`);
console.log(`Current distribution:`, verify.rows);

process.exit(0);
