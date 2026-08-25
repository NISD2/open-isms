/**
 * L0: the NIS 2 scope predicates compile to correct SQL.
 *
 * `nis2StatusScope` is consumed by the nightly deadline cron
 * (app/api/cron/deadlines/route.ts) inside Drizzle's RELATIONAL query builder.
 * RQB rewrites every Column chunk of a raw `sql` template to the root table
 * alias, so a predicate that reads correctly in source can still compile to
 * columns that do not exist. That is not hypothetical: written as sql`...` this
 * emitted `"companyRequirementStatus"."code"` and
 * `"companyRequirementStatus"."framework_id"`, Postgres raised 42703, and
 * phases 1 to 5 of the cron aborted behind a single audit row.
 *
 * The browser suite never requests that route, so nothing else catches this.
 * These assertions are the guard.
 */
import { describe, test, expect } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, isNull } from "drizzle-orm";
import * as schema from "@/schema";
import { companyRequirementStatus } from "@/schema";
import { nis2StatusScope } from "@/server/trpc/helpers/nis2-scope";

const db = drizzle.mock({ schema });

const compiled = db.query.companyRequirementStatus
  .findMany({
    where: and(
      nis2StatusScope(db),
      isNull(companyRequirementStatus.nextReviewDate),
    ),
    columns: { id: true },
  })
  .toSQL();

describe("nis2StatusScope inside the relational query builder", () => {
  test("scopes on the joined framework, not the root table", () => {
    expect(compiled.sql).toContain('"compliance_framework"."code"');
    expect(compiled.sql).toContain(
      '"compliance_framework"."id" = "company_assessment"."framework_id"',
    );
  });

  test("never attributes a joined column to company_requirement_status", () => {
    // The exact shape of the 42703 failure this test exists to prevent.
    expect(compiled.sql).not.toContain('"companyRequirementStatus"."code"');
    expect(compiled.sql).not.toContain('"companyRequirementStatus"."framework_id"');
  });

  test("still constrains the root table's assessment_id", () => {
    expect(compiled.sql).toContain('"companyRequirementStatus"."assessment_id" in');
  });

  test("binds nis2 as the framework code", () => {
    expect(compiled.params).toContain("nis2");
  });
});
