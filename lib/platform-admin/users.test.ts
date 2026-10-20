/**
 * "Active" meant "signed in" only, so a person working in a session that stayed open for days
 * (the sign-in time moves once per completed sign-in) was missing from the admin tab and from the
 * test endpoint's recent_users, while usage_stats counted them. Either a sign-in or a recorded
 * action in the window makes a person active; an operator reading the platform is neither.
 */
import { describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import type { DbOrTx } from "@/lib/db";
import * as schema from "@/schema";
import { activeUsers } from "./users";

const SINCE = new Date("2026-10-01T00:00:00.000Z");

function queryOf(since: Date) {
  const db = drizzle.mock({ schema }) as unknown as DbOrTx;
  const query = activeUsers(db, since, 5) as unknown as {
    toSQL: () => { sql: string; params: unknown[] };
  };
  return query.toSQL();
}

describe("activeUsers", () => {
  const { sql, params } = queryOf(SINCE);

  test("a sign-in or a recorded action in the window makes a person active", () => {
    expect(sql).toContain(`"user"."last_login_at" >= $`);
    expect(sql).toContain(`or "last_action_at" is not null`);
    expect(sql).toContain(`from "audit_log"`);
  });

  test("the actions are read from the same moment as the sign-ins, as UTC", () => {
    expect(params.filter((p) => p === SINCE.toISOString())).toHaveLength(2);
    expect(sql).toContain("::timestamp");
  });

  test("an operator reading the platform is not product use", () => {
    expect(sql).toContain(`"audit_log"."entity_type" <> $`);
    expect(params).toContain("platformAdmin");
  });

  test("the latest of the two comes first, and a missing side does not hide a person", () => {
    expect(sql).toContain(
      `order by greatest("user"."last_login_at", "last_action_at") desc`,
    );
  });
});
