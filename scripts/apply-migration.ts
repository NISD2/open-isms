import { readFile } from "node:fs/promises";
import { db } from "@/lib/db";
import { assertLocalDatabase } from "./lib/assert-local-database";

// Executes whatever SQL it is handed, statement by statement, with no
// transaction and no journal entry — so against production it is an unlogged,
// half-applyable schema change with no record that it happened.
assertLocalDatabase(
  process.env.DATABASE_URL ?? "",
  "scripts/apply-migration.ts executes arbitrary SQL with no transaction and " +
    "records nothing in the migration journal.",
);

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("usage: bun run scripts/apply-migration.ts <path>");
  process.exit(1);
}

const sql = await readFile(sqlPath, "utf8");
const chunks = sql.split("--> statement-breakpoint");

console.log(`Applying chunks from ${sqlPath}…`);

let executed = 0;
for (const chunk of chunks) {
  // Strip leading -- comment lines BEFORE deciding whether the chunk is empty.
  // (Bug: a previous version filtered out the whole chunk if its first line
  // started with `--`, which silently dropped the first SQL statement.)
  const cleaned = chunk
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .trim();
  if (!cleaned) continue;
  executed++;
  try {
    await db.execute(cleaned);
    console.log(`  [${executed}] OK`);
  } catch (err) {
    console.error(`  [${executed}] FAILED:`, err);
    console.error(`  SQL: ${cleaned.slice(0, 300)}…`);
    process.exit(1);
  }
}

console.log(`Done. Applied ${executed} statements.`);
process.exit(0);
