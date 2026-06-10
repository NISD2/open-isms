/**
 * Smoke test: cross-framework satisfaction BFS propagation.
 *
 * Reads the live requirement_satisfaction graph and simulates what
 * propagateSatisfaction() would credit for a given source requirement,
 * without writing anything to the DB.
 *
 *   bun run scripts/smoke-propagation.ts <source-code>
 *
 * Defaults to "3.3" (the highest-degree hub: equivalent to G-BRC.1,
 * AI-INC.2, CRA-INC.2).
 */
import { db } from "@/lib/db";
import { requirement } from "@/schema";
import { eq } from "drizzle-orm";

type EdgeRow = {
  a_id: string;
  b_id: string;
  a_code: string;
  b_code: string;
  kind: "equivalent" | "overlapping";
};

async function simulate(sourceCode: string) {
  const sourceRow = await db.query.requirement.findFirst({
    where: eq(requirement.code, sourceCode),
  });
  if (!sourceRow) {
    console.error(`No requirement with code "${sourceCode}"`);
    process.exit(1);
  }

  const edgeQuery = await db.execute<EdgeRow>(`
    SELECT
      rs.requirement_a_id AS a_id,
      rs.requirement_b_id AS b_id,
      ra.code AS a_code,
      rb.code AS b_code,
      rs.equivalence_kind AS kind
    FROM requirement_satisfaction rs
    JOIN requirement ra ON ra.id = rs.requirement_a_id
    JOIN requirement rb ON rb.id = rs.requirement_b_id
  `);
  const edges = edgeQuery.rows;

  const codeFor = new Map<string, string>();
  const adjacency = new Map<string, Array<{ neighbor: string; kind: "equivalent" | "overlapping" }>>();
  for (const e of edges) {
    codeFor.set(e.a_id, e.a_code);
    codeFor.set(e.b_id, e.b_code);
    const aList = adjacency.get(e.a_id) ?? [];
    aList.push({ neighbor: e.b_id, kind: e.kind });
    adjacency.set(e.a_id, aList);
    const bList = adjacency.get(e.b_id) ?? [];
    bList.push({ neighbor: e.a_id, kind: e.kind });
    adjacency.set(e.b_id, bList);
  }

  const visited = new Set<string>([sourceRow.id]);
  const credited: Array<{ code: string; viaKind: "equivalent" | "overlapping"; viaCode: string }> = [];
  const queue: string[] = [sourceRow.id];
  const queueCodes = new Map<string, string>([[sourceRow.id, sourceCode]]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const currentCode = queueCodes.get(current) ?? "?";
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const { neighbor, kind } of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      const neighborCode = codeFor.get(neighbor) ?? "?";
      credited.push({ code: neighborCode, viaKind: kind, viaCode: currentCode });
      if (kind === "equivalent") {
        queue.push(neighbor);
        queueCodes.set(neighbor, neighborCode);
      }
    }
  }

  console.log(`\nSource: ${sourceCode}`);
  console.log(`Total credited: ${credited.length}\n`);

  const eqCredits = credited.filter((c) => c.viaKind === "equivalent");
  const overlapCredits = credited.filter((c) => c.viaKind === "overlapping");

  console.log(`Via equivalent edges (${eqCredits.length}):`);
  for (const c of eqCredits) {
    console.log(`  ${c.viaCode} -eq-> ${c.code}`);
  }
  console.log(`\nVia overlapping edges, one-hop (${overlapCredits.length}):`);
  for (const c of overlapCredits) {
    console.log(`  ${c.viaCode} -overlap-> ${c.code}`);
  }
}

const sourceCode = process.argv[2] ?? "3.3";
await simulate(sourceCode);
process.exit(0);
