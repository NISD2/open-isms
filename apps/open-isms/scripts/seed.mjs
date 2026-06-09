/**
 * First-boot seed for the open-isms reference app.
 *
 * Runs after migrate, before the Next server starts. Idempotent:
 * checks whether the compliance_framework table has the 'nis2' row
 * and only seeds if it doesn't. Re-runs (container restarts, etc.)
 * are no-ops.
 *
 * For now only seeds NIS 2 (the OSS app's flagship framework). Extend
 * here when you want GDPR, EU AI Act, CRA, ISO 27001 in OSS too —
 * each is one extra seedFramework() call using the data already
 * exported from @nisd2/grc-data-model/frameworks.
 */

import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
// Import from the package's source files directly. The package's
// exports map points at ./dist/*.js, which we don't build inside the
// Docker container (skipped tsup). bun build resolves these TS source
// paths fine at bundle time. Relative paths are stable: this file is
// always at apps/open-isms/scripts/seed.mjs.
import {
  nis2Categories,
  getNis2RequirementsForCategory,
} from "../../../packages/grc-data-model/src/frameworks/index.ts";
import { seedFramework } from "../../../packages/grc-data-model/src/seed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[seed] DATABASE_URL not set");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();
console.log("[seed] connected to database");

try {
  const db = drizzle(client);

  // Idempotency: check if NIS 2 framework row already exists.
  const result = await db.execute(
    sql`SELECT 1 FROM compliance_framework WHERE code = 'nis2' LIMIT 1`,
  );

  if (result.rows.length > 0) {
    console.log("[seed] NIS 2 already seeded — skipping");
  } else {
    console.log("[seed] seeding NIS 2 (12 categories, ~49 requirements)");
    await seedFramework(db, {
      code: "nis2",
      version: "2022/2555",
      effectiveDate: "2024-10-17",
      codePrefix: "NIS-",
      sidebarLabel: "nis2",
      categories: nis2Categories,
      getRequirements: getNis2RequirementsForCategory,
    });
    console.log("[seed] NIS 2 seeded");
  }
} finally {
  await client.end();
}
