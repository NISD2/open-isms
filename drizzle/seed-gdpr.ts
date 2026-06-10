/**
 * Standalone GDPR framework seed.
 *
 * Upserts: 1 framework (GDPR), 5 categories, 7 requirements.
 *
 * Safe in any environment: the underlying seedFramework primitive matches
 * existing rows by natural key (framework code, category slug, requirement
 * code) and updates metadata in place. No operational data is ever deleted,
 * so live sign-offs, assignments, and audit trails stay intact.
 *
 * Usage: bun run drizzle/seed-gdpr.ts
 */
import { eq, and, or, inArray } from "drizzle-orm";
import * as schema from "@/schema";
import { db } from "@/lib/db";
import {
  gdprCategories,
  getGdprRequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import { nis2GdprSatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";
import {
  linkSatisfactionPairs,
  seedFramework,
} from "@nisd2/grc-data-model/seed";

async function seed() {
  console.log("GDPR framework seed\n");

  const { frameworkId, categoryCount, requirementCount } = await seedFramework(db, {
    code: "gdpr",
    version: "2016/679",
    effectiveDate: "2018-05-25",
    codePrefix: "DSGVO-",
    sidebarLabel: "dsgvo",
    categories: gdprCategories,
    getRequirements: getGdprRequirementsForCategory,
  });

  console.log(`  Framework: gdpr (${frameworkId})`);
  console.log(`  Done: ${categoryCount} categories, ${requirementCount} requirements`);

  console.log("\n  Linking NIS2 <-> GDPR satisfaction pairs...");
  const { linkedCount, skipped } = await linkSatisfactionPairs(
    db,
    nis2GdprSatisfactionPairs,
  );
  for (const s of skipped) console.warn(`    skipped: ${s}`);
  console.log(`  Done: ${linkedCount} pairs linked, ${skipped.length} skipped`);

  const fw = await db.query.complianceFramework.findFirst({
    where: eq(schema.complianceFramework.id, frameworkId),
  });
  if (!fw) throw new Error("Framework lookup failed after upsert");

  // Bootstrap GDPR assessments for existing companies + propagate any
  // existing NIS2 sign-offs to their linked GDPR requirements. Idempotent.
  console.log("\n  Bootstrapping GDPR assessments for existing companies...");

  const allRequirements = await db.query.requirement.findMany({
    where: inArray(
      schema.requirement.categoryId,
      (await db.query.requirementCategory.findMany({
        where: eq(schema.requirementCategory.frameworkId, fw.id),
      })).map((c) => c.id),
    ),
  });

  const companies = await db.query.company.findMany();
  let companiesBootstrapped = 0;
  let statusRowsCreated = 0;
  let propagated = 0;

  for (const co of companies) {
    let gdprAssessment = await db.query.companyAssessment.findFirst({
      where: and(
        eq(schema.companyAssessment.companyId, co.id),
        eq(schema.companyAssessment.frameworkId, fw.id),
      ),
    });

    if (!gdprAssessment) {
      const [newAssessment] = await db
        .insert(schema.companyAssessment)
        .values({
          companyId: co.id,
          frameworkId: fw.id,
          totalRequirements: allRequirements.length,
          entityTypeAtAssessment: "important",
        })
        .returning();
      gdprAssessment = newAssessment;
      companiesBootstrapped++;
    }

    if (!gdprAssessment) continue;

    const existingStatuses = await db.query.companyRequirementStatus.findMany({
      where: eq(schema.companyRequirementStatus.assessmentId, gdprAssessment.id),
    });
    const existingReqIds = new Set(existingStatuses.map((s) => s.requirementId));
    const missingReqs = allRequirements.filter((r) => !existingReqIds.has(r.id));

    if (missingReqs.length > 0) {
      await db.insert(schema.companyRequirementStatus).values(
        missingReqs.map((r) => ({
          assessmentId: gdprAssessment!.id,
          requirementId: r.id,
        })),
      );
      statusRowsCreated += missingReqs.length;
    }

    // Back-propagate: for each satisfaction pair, if the source side is
    // already signed and the target side is not, copy the sign-off across.
    const pairs = await db.query.requirementSatisfaction.findMany();
    for (const pair of pairs) {
      const [signedSide, unsignedSide] = await resolveSidesForCompany(
        db,
        co.id,
        pair.requirementAId,
        pair.requirementBId,
      );
      if (!signedSide || !unsignedSide) continue;

      await db
        .update(schema.companyRequirementStatus)
        .set({
          status: "completed",
          signedOffBy: signedSide.signedOffBy,
          signedOffAt: signedSide.signedOffAt,
          signedOffRole: signedSide.signedOffRole,
          signedOffTemplateVersion: signedSide.signedOffTemplateVersion,
          signOffSnapshot: signedSide.signOffSnapshot,
          completedAt: signedSide.completedAt ?? signedSide.signedOffAt,
          completedBy: signedSide.signedOffBy,
          updatedAt: new Date(),
        })
        .where(eq(schema.companyRequirementStatus.id, unsignedSide.id));
      propagated++;
    }
  }

  console.log(
    `  Bootstrapped ${companiesBootstrapped} new GDPR assessments, ` +
      `created ${statusRowsCreated} status rows, propagated ${propagated} sign-offs.`,
  );

  // Recalculate progress counters for every assessment that may have
  // drifted (live signOff mutation does this; backfill must too).
  console.log("  Recalculating assessment progress counters...");
  const allAssessments = await db.query.companyAssessment.findMany();
  for (const a of allAssessments) {
    const statuses = await db.query.companyRequirementStatus.findMany({
      where: eq(schema.companyRequirementStatus.assessmentId, a.id),
    });
    const completed = statuses.filter(
      (s) => s.status === "completed" || s.status === "approved" || s.status === "not_applicable",
    ).length;
    const total = statuses.length;
    const percentage = total > 0 ? ((completed / total) * 100).toFixed(2) : "0";
    await db
      .update(schema.companyAssessment)
      .set({ completedRequirements: completed, compliancePercentage: percentage, updatedAt: new Date() })
      .where(eq(schema.companyAssessment.id, a.id));
  }
  console.log(`  Recalculated ${allAssessments.length} assessment counters.\n`);

  process.exit(0);
}

async function resolveSidesForCompany(
  db: typeof import("@/lib/db").db,
  companyId: string,
  reqAId: string,
  reqBId: string,
) {
  const statuses = await db.query.companyRequirementStatus.findMany({
    where: or(
      eq(schema.companyRequirementStatus.requirementId, reqAId),
      eq(schema.companyRequirementStatus.requirementId, reqBId),
    ),
    with: { assessment: { columns: { companyId: true } } },
  });
  const ourStatuses = statuses.filter((s) => s.assessment.companyId === companyId);
  const aStatus = ourStatuses.find((s) => s.requirementId === reqAId);
  const bStatus = ourStatuses.find((s) => s.requirementId === reqBId);
  if (!aStatus || !bStatus) return [null, null] as const;

  const aSigned = aStatus.status === "completed" || aStatus.status === "approved";
  const bSigned = bStatus.status === "completed" || bStatus.status === "approved";

  if (aSigned && !bSigned) return [aStatus, bStatus] as const;
  if (bSigned && !aSigned) return [bStatus, aStatus] as const;
  return [null, null] as const;
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
