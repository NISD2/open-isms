/**
 * Direct SQL against the e2e database, for provisioning and for asserting
 * persistence independently of the UI. Every call re-checks the
 * never-on-prod guard and opens a short-lived connection.
 */
import { Client } from "pg";
import { assertE2eTargets, E2E_DATABASE_URL } from "./env";

export async function e2eQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  assertE2eTargets();
  const pg = new Client({ connectionString: E2E_DATABASE_URL });
  await pg.connect();
  try {
    const res = await pg.query(sql, params);
    return res.rows as T[];
  } finally {
    await pg.end();
  }
}
