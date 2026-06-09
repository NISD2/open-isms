import { db, ensureDbConnected } from "@/lib/db";
import {
  ComplianceOverview,
  type CategoryCard,
} from "@nisd2/isms-pages";
import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import { sql } from "drizzle-orm";

export const metadata = {
  title: "Compliance — open-isms",
};

export const dynamic = "force-dynamic";

const NAMES_BY_CODE = new Map(nis2Categories.map((c) => [c.code, c]));

type CategoryRow = {
  id: string;
  code: string;
  slug: string;
  sort_order: number;
  requirement_count: string;
} & Record<string, unknown>;

export default async function CompliancePage() {
  await ensureDbConnected();

  // Raw SQL keeps this file independent of the grc-data-model drizzle
  // setup. The id/code/slug come from the DB; display strings come from
  // the package source (the single source of truth for English defaults).
  const result = await db.execute<CategoryRow>(sql`
    SELECT
      rc.id,
      rc.code,
      rc.slug,
      rc.sort_order,
      (SELECT COUNT(*)::text FROM requirement r WHERE r.category_id = rc.id) AS requirement_count
    FROM requirement_category rc
    JOIN compliance_framework cf ON cf.id = rc.framework_id
    WHERE cf.code = 'nis2'
    ORDER BY rc.sort_order
  `);

  const categories: CategoryCard[] = result.rows.map((row) => {
    const meta = NAMES_BY_CODE.get(row.code);
    const requirementCount = Number(row.requirement_count);
    return {
      id: row.id,
      code: row.code,
      name: meta?.name ?? row.code,
      slug: row.slug,
      description: meta?.description ?? null,
      legalBasis: null,
      sortOrder: row.sort_order,
      requirementCount,
      // OSS is single-tenant with no per-company compliance tracking yet,
      // so progress is always 0/N. When the requirement-status feature is
      // ported in, these come from company_requirement_status joins.
      completed: 0,
      total: requirementCount,
      requirementsLabel: `${requirementCount} requirement${requirementCount === 1 ? "" : "s"}`,
      progressLabel: `0 of ${requirementCount} complete`,
    };
  });

  return (
    <ComplianceOverview
      categories={categories}
      title="NIS 2 Compliance"
      subtitle="Track requirements across the 12 NIS 2 categories."
    />
  );
}
