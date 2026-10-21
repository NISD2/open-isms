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
import { activeUsers, activityTimes } from "./users";

const SINCE = new Date("2026-10-01T00:00:00.000Z");

describe("activityTimes", () => {
  const db = drizzle.mock({ schema }) as unknown as DbOrTx;
  const query = activityTimes(
    db,
    "22222222-2222-4222-8222-222222222222",
    SINCE,
    7,
  ) as unknown as {
    toSQL: () => { sql: string; params: unknown[] };
  };
  const { sql, params } = query.toSQL();

  test("reads only that person's own rows since the day asked for", () => {
    expect(sql).toContain(`"audit_log"."user_id" = $`);
    expect(params).toContain("22222222-2222-4222-8222-222222222222");
    expect(sql).toContain(`"audit_log"."created_at" >= `);
    expect(params).toContain(SINCE.toISOString());
  });

  test("an operator reading the platform and an assistant's work are not them at their desk", () => {
    expect(sql).toContain(`"audit_log"."entity_type" <> $`);
    expect(params).toContain("platformAdmin");
    expect(sql).toContain(`"audit_log"."user_agent" is null`);
    expect(sql).toContain(`not "audit_log"."user_agent" like $`);
  });

  test("hands over instants with an explicit UTC marker, newest first, and no more than the limit", () => {
    expect(sql).toContain(`to_char("created_at", 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`);
    expect(sql).toContain(`order by "audit_log"."created_at" desc`);
    expect(sql).toContain("limit $");
  });
});

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
