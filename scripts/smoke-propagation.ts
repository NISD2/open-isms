/**
 * Smoke test: cross-framework satisfaction propagation.
 *
 * Reads the live requirement_satisfaction graph and lists what
 * propagateSatisfaction() would credit for a given source requirement,
 * through the same satisfactionTargets() walk, without writing anything.
 *
 *   bun run scripts/smoke-propagation.ts <source-code>
 *
 * Defaults to "3.3".
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { requirement, requirementCategory } from "@/schema";
import { satisfactionTargets } from "@/server/trpc/helpers/satisfaction-targets";

async function simulate(sourceCode: string): Promise<boolean> {
  const sourceRow = await db.query.requirement.findFirst({
    where: eq(requirement.code, sourceCode),
  });
  if (!sourceRow) {
    console.error(`No requirement with code "${sourceCode}"`);
    return false;
  }

  const edges = await db.query.requirementSatisfaction.findMany();
  const linked = [
    ...new Set([
      sourceRow.id,
      ...edges.flatMap((e) => [e.requirementAId, e.requirementBId]),
    ]),
  ];
  const rows = await db
    .select({
      id: requirement.id,
      code: requirement.code,
      frameworkId: requirementCategory.frameworkId,
    })
    .from(requirement)
    .innerJoin(requirementCategory, eq(requirementCategory.id, requirement.categoryId))
    .where(inArray(requirement.id, linked));
  const byId = new Map(rows.map((r) => [r.id, r]));

  const credited = satisfactionTargets(
    edges,
    sourceRow.id,
    (id) => byId.get(id)?.frameworkId,
  ).map((id) => byId.get(id)?.code ?? id);

  console.log(`\nSource: ${sourceCode}`);
  console.log(`Credited through equivalent links (${credited.length}):`);
  for (const code of credited) console.log(`  ${code}`);
  return true;
}

const ok = await simulate(process.argv[2] ?? "3.3");
process.exit(ok ? 0 : 1);
