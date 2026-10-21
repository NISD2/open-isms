/**
 * The newsletter sold an order and a closing price to four people at a company that had already
 * ordered. The audience now leaves out everyone who belongs to a paying customer, in a send to all
 * and in a send to a group alike, because both read this one condition.
 */
import { describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import type { DbOrTx } from "@/lib/db";
import * as schema from "@/schema";
import { newsletterAudience } from "./audience";

function audienceQuery() {
  const db = drizzle.mock({ schema }) as unknown as DbOrTx;
  const query = db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(newsletterAudience) as unknown as {
    toSQL: () => { sql: string; params: unknown[] };
  };
  return query.toSQL();
}

describe("newsletterAudience", () => {
  const { sql } = audienceQuery();

  test("still requires a verified, real address that has not opted out", () => {
    expect(sql).toContain(`"user"."email_followups_disabled" = $`);
    expect(sql).toContain(`"user"."is_disposable_email" = $`);
    expect(sql).toContain(`"user"."email_verified_at" is not null`);
  });

  test("leaves out anyone in a company on a full billing account", () => {
    expect(sql).toContain("not exists");
    expect(sql).toContain(`from "company_membership"`);
    expect(sql).toContain(
      `inner join "company" on "company"."id" = "company_membership"."company_id"`,
    );
    expect(sql).toContain(
      `inner join "billing_account" on "billing_account"."id" = "company"."billing_account_id"`,
    );
    expect(sql).toContain(`"billing_account"."access_level" = 'full'`);
  });

  test("counts every member of the company, not only the person who pays", () => {
    expect(sql).toContain(`"company_membership"."user_id" = "user"."id"`);
    expect(sql).not.toContain("owner_user_id");
  });

  test("a free or grandfathered account is still a prospect", () => {
    expect(sql).not.toContain(`'free'`);
    expect(sql).not.toContain(`'grandfathered'`);
  });
});
