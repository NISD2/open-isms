/**
 * Generic framework seeder.
 *
 * Lets any consumer of `@nisd2/grc-data-model` populate a Postgres database
 * with the framework reference data (compliance_framework, requirement_category,
 * requirement, requirement_satisfaction) from the TS const arrays in
 * `frameworks/*.ts` and `satisfaction-pairs.ts`.
 *
 * The caller supplies a Drizzle `db` instance bound to its own schema.
 * Cleanup is scoped strictly to the framework code; other frameworks and any
 * operational data (companies, assessments, incidents, suppliers, etc.) are
 * never touched.
 *
 * Example:
 *
 *   import { drizzle } from "drizzle-orm/node-postgres";
 *   import {
 *     euAiActCategories,
 *     getEuAiActRequirementsForCategory,
 *   } from "@nisd2/grc-data-model/frameworks";
 *   import { aiActNis2SatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";
 *   import { seedFramework, linkSatisfactionPairs } from "@nisd2/grc-data-model/seed";
 *
 *   const db = drizzle(pool);
 *   await seedFramework(db, {
 *     code: "eu_ai_act",
 *     version: "2024/1689",
 *     effectiveDate: "2024-08-01",
 *     codePrefix: "AI-",
 *     sidebarLabel: "aiact",
 *     // Seed the reference data, keep it out of the UI. Only NIS 2 is active.
 *     isActive: false,
 *     categories: euAiActCategories,
 *     getRequirements: getEuAiActRequirementsForCategory,
 *   });
 *
 *   await linkSatisfactionPairs(db, aiActNis2SatisfactionPairs);
 */
import { eq, and, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { frameworkEnum } from "./enums";
import {
  complianceFramework,
  requirementCategory,
  requirement,
  requirementSatisfaction,
} from "./schema";
import type { FrameworkCategory, FrameworkRequirement } from "./frameworks/types";
import type { SatisfactionPair } from "./satisfaction-pairs";

export type FrameworkCode = (typeof frameworkEnum.enumValues)[number];

/**
 * Any Drizzle PgDatabase instance with relational query support.
 *
 * Generic over the consumer's schema so a fully-typed app `db` is assignable
 * without a cast. The seeder only touches the four tables this package owns;
 * the schema parameter is forwarded for variance reasons only.
 */
export type SeedDb<TSchema extends Record<string, unknown> = Record<string, unknown>> = PgDatabase<
  PgQueryResultHKT,
  TSchema,
  ExtractTablesWithRelations<TSchema>
>;

export interface FrameworkSeedSpec {
  /** Must match a value in the `framework` pg enum. */
  code: FrameworkCode;
  /** Regulation version string, e.g. "2024/1689". */
  version: string;
  /** ISO date string of the regulation's effective date. */
  effectiveDate: string;
  /** UI prefix for category codes, e.g. "AI-". */
  codePrefix: string;
  /** Sidebar label / i18n key, e.g. "aiact". */
  sidebarLabel: string;
  /**
   * Drives every framework-scoped surface: the sidebar and /compliance pages
   * (`getAllActiveCategories`) and what a new signup is provisioned
   * (`createAssessmentsForFrameworks`). Declared per framework rather than
   * hardcoded here, because the upsert below re-asserts it on every rerun: a
   * hardcoded `true` silently reactivated a framework someone had switched off.
   * Reference data for an inactive framework is still seeded, so satisfaction
   * pairs keep resolving and existing tenants keep their rows.
   */
  isActive: boolean;
  categories: FrameworkCategory[];
  getRequirements: (slug: string) => FrameworkRequirement[];
}

export interface SeedResult {
  frameworkId: string;
  categoryCount: number;
  requirementCount: number;
}

/**
 * Seed a single framework (idempotent, upsert-only).
 *
 * Matches existing rows by natural key and updates their metadata in place.
 * Never deletes requirements or categories, so FK references from operational
 * tables (company_requirement_status, requirement_assignment, sign_off_history,
 * etc.) stay intact. Safe to run in production any number of times.
 *
 * Natural keys:
 *   - complianceFramework.code (globally unique)
 *   - requirementCategory: (frameworkId, slug) — looked up, not enforced by DB
 *   - requirement.code (globally unique)
 *
 * Orphan handling: if a previously-seeded category or requirement is no longer
 * in the spec, it is LEFT ALONE. Removing framework content is a deliberate
 * curation step, not a seeding side-effect; do it through a separate migration
 * after confirming no live data references the row.
 */
export async function seedFramework<TSchema extends Record<string, unknown>>(
  db: SeedDb<TSchema>,
  spec: FrameworkSeedSpec,
): Promise<SeedResult> {
  const [fw] = await db
    .insert(complianceFramework)
    .values({
      code: spec.code,
      version: spec.version,
      effectiveDate: spec.effectiveDate,
      isActive: spec.isActive,
      codePrefix: spec.codePrefix,
      sidebarLabel: spec.sidebarLabel,
    })
    .onConflictDoUpdate({
      target: complianceFramework.code,
      set: {
        version: spec.version,
        effectiveDate: spec.effectiveDate,
        isActive: spec.isActive,
        codePrefix: spec.codePrefix,
        sidebarLabel: spec.sidebarLabel,
      },
    })
    .returning({ id: complianceFramework.id });

  if (!fw) {
    throw new Error(`Failed to upsert framework ${spec.code}`);
  }

  let categoryCount = 0;
  let requirementCount = 0;

  for (const cat of spec.categories) {
    const existingCat = await db
      .select({ id: requirementCategory.id })
      .from(requirementCategory)
      .where(
        and(
          eq(requirementCategory.frameworkId, fw.id),
          eq(requirementCategory.slug, cat.slug),
        ),
      )
      .limit(1);

    const catFields = {
      frameworkId: fw.id,
      code: cat.code,
      slug: cat.slug,
      referenceUrl: cat.referenceUrl,
      nationalUrl: cat.nationalUrl || null,
      sortOrder: cat.sortOrder,
      estimatedMinutes: cat.estimatedMinutes,
      relevantRoles: cat.relevantRoles ?? null,
      grundschutzModule: cat.grundschutzModule ?? null,
    };

    let categoryId: string;
    const existing = existingCat[0];
    if (existing) {
      await db
        .update(requirementCategory)
        .set(catFields)
        .where(eq(requirementCategory.id, existing.id));
      categoryId = existing.id;
    } else {
      const [inserted] = await db
        .insert(requirementCategory)
        .values(catFields)
        .returning({ id: requirementCategory.id });
      if (!inserted) continue;
      categoryId = inserted.id;
    }
    categoryCount++;

    const reqs = spec.getRequirements(cat.slug);
    for (let i = 0; i < reqs.length; i++) {
      const r = reqs[i];
      if (!r) continue;

      const reqFields = {
        categoryId,
        code: r.code,
        evidenceType: r.evidenceType,
        frequency: r.frequency,
        priority: r.priority,
        importance: r.importance,
        legalRef: r.legalRef || null,
        frameworkRef: r.frameworkRef || null,
        cirReference: r.cirReference || null,
        moduleRef: r.moduleRef || null,
        requiredSignOffRole: r.requiredSignOffRole || null,
        sortOrder: i,
      };

      await db
        .insert(requirement)
        .values(reqFields)
        .onConflictDoUpdate({
          target: requirement.code,
          set: reqFields,
        });
      requirementCount++;
    }
  }

  return { frameworkId: fw.id, categoryCount, requirementCount };
}

export interface LinkResult {
  linkedCount: number;
  skipped: string[];
}

/**
 * Insert cross-framework satisfaction pairs (idempotent).
 *
 * Pairs whose codes are not yet seeded are skipped silently and returned in
 * the `skipped` array so the caller can warn or retry.
 */
export async function linkSatisfactionPairs<TSchema extends Record<string, unknown>>(
  db: SeedDb<TSchema>,
  pairs: readonly SatisfactionPair[],
): Promise<LinkResult> {
  let linkedCount = 0;
  const skipped: string[] = [];

  for (const [aCode, bCode, rationale, kind] of pairs) {
    const equivalenceKind = kind ?? "overlapping";

    const aRows = await db
      .select({ id: requirement.id })
      .from(requirement)
      .where(eq(requirement.code, aCode))
      .limit(1);
    const bRows = await db
      .select({ id: requirement.id })
      .from(requirement)
      .where(eq(requirement.code, bCode))
      .limit(1);

    const a = aRows[0];
    const b = bRows[0];

    if (!a || !b) {
      skipped.push(`${aCode} <-> ${bCode}`);
      continue;
    }

    const already = await db
      .select({ id: requirementSatisfaction.id })
      .from(requirementSatisfaction)
      .where(
        and(
          eq(requirementSatisfaction.requirementAId, a.id),
          eq(requirementSatisfaction.requirementBId, b.id),
        ),
      )
      .limit(1);

    const existing = already[0];
    if (existing) {
      await db
        .update(requirementSatisfaction)
        .set({ rationale, equivalenceKind })
        .where(eq(requirementSatisfaction.id, existing.id));
      linkedCount++;
      continue;
    }

    await db.insert(requirementSatisfaction).values({
      requirementAId: a.id,
      requirementBId: b.id,
      rationale,
      equivalenceKind,
    });
    linkedCount++;
  }

  return { linkedCount, skipped };
}
