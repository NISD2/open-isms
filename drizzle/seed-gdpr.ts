/**
 * Standalone GDPR framework seed.
 *
 * This script does two very different jobs, and the safety of the first does
 * not extend to the second.
 *
 * 1. REFERENCE DATA (default, safe anywhere). Upserts 1 framework, 6
 *    categories, 9 requirements and the NIS2 satisfaction pairs. seedFramework
 *    matches existing rows by natural key and updates metadata in place, so no
 *    operational data is touched and live sign-offs stay intact. Note that
 *    production no longer needs this: framework reference data ships as a
 *    generated migration and is applied at container start.
 *
 * 2. TENANT BACKFILL (opt-in). Creates a GDPR assessment for every company
 *    that lacks one and copies existing NIS2 sign-offs onto their linked GDPR
 *    requirements. This writes operational data for every tenant in the
 *    database: it manufactures sign-off records, which in a compliance system
 *    are legal evidence that somebody attested to something. It is a one-time
 *    backfill for companies that signed NIS2 before GDPR existed, not routine
 *    maintenance.
 *
 *    An earlier version of this header called the whole script "safe in any
 *    environment". That was true of job 1 and badly wrong about job 2, which
 *    ran unguarded against whatever DATABASE_URL happened to be set.
 *
 * Usage:
 *   bun run drizzle/seed-gdpr.ts                    # reference data only
 *   SEED_GDPR_BACKFILL=1 bun run drizzle/seed-gdpr.ts   # + tenant backfill
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
import { recalculateProgress } from "@/server/trpc/helpers/assessment-helpers";
import { recordSignOffChainEntry } from "@/server/trpc/helpers/sign-off-chain";
import {
  completedSignOffValues,
  effectiveSignOffRole,
  snapshotForVersion,
} from "@/server/trpc/helpers/sign-off-completion";
import type { Database } from "@/lib/db";

async function seed() {
  console.log("GDPR framework seed\n");

  const { frameworkId, categoryCount, requirementCount } = await seedFramework(db, {
    code: "gdpr",
    version: "2016/679",
    effectiveDate: "2018-05-25",
    codePrefix: "DSGVO-",
    sidebarLabel: "dsgvo",
    isActive: false,
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

  // Everything above this line is reference data. Everything below writes
  // operational rows for every tenant in the database, so it is opt-in.
  if (process.env.SEED_GDPR_BACKFILL !== "1") {
    console.log(
      "\n  Reference data done. Skipping the tenant backfill (assessment " +
        "bootstrap + NIS2 sign-off propagation), which writes operational " +
        "data for every company.\n  Re-run with SEED_GDPR_BACKFILL=1 to " +
        "include it.\n",
    );
    return;
  }

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
  let skippedRoleMismatch = 0;
  let skippedIncompleteSource = 0;

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

      // A copied sign-off is still a sign-off, so it answers to the same rules
      // the live propagation applies (see propagateSatisfaction). Without this
      // gate a CISO's NIS2 signature lands on a GDPR requirement that names
      // the DPO, which reads to an auditor as the wrong officer attesting.
      // No session here, so no admin bypass: a script cannot vouch for a role
      // nobody holds. effectiveSignOffRole supplies the same default the live
      // paths use when a requirement names no signer.
      const signerRole = signedSide.signedOffRole;
      if (
        !signerRole ||
        signerRole !== effectiveSignOffRole(unsignedSide.requirement.requiredSignOffRole)
      ) {
        skippedRoleMismatch++;
        continue;
      }

      // Narrowed here rather than asserted at the call site: a source row can
      // be status=completed with no signer at all (updateRequirementStatus
      // does exactly that), and copying those nulls forward would produce a
      // sign-off attributed to nobody.
      const signedOffBy = signedSide.signedOffBy;
      const signedOffAt = signedSide.signedOffAt;
      const sourceSnapshot = signedSide.signOffSnapshot;
      if (!signedOffBy || !signedOffAt || !sourceSnapshot) {
        skippedIncompleteSource++;
        continue;
      }

      // The source's snapshot describes the source requirement. Re-stamp it
      // for the target, or the row claims a version belonging to a different
      // requirement and escapes invalidation when its own text is bumped.
      const targetVersion = unsignedSide.requirement.templateVersion;
      const targetSnapshot = snapshotForVersion(sourceSnapshot, targetVersion);

      await db.transaction(async (tx) => {
        await tx
          .update(schema.companyRequirementStatus)
          .set(
            completedSignOffValues({
              userId: signedOffBy,
              signedOffRole: signerRole,
              templateVersion: targetVersion,
              snapshot: targetSnapshot,
              now: signedOffAt,
            }),
          )
          .where(eq(schema.companyRequirementStatus.id, unsignedSide.id));

        // sign-off-chain.ts states every writer of signOffSnapshot must append
        // a history row. This loop never did, so back-propagated rows had no
        // verifiable chain and verifySignOffChain reported them valid by
        // vacuous truth.
        await recordSignOffChainEntry(tx as unknown as Database, {
          companyId: co.id,
          statusId: unsignedSide.id,
          requirementId: unsignedSide.requirementId,
          signedOffBy,
          signedOffRole: signerRole,
          source: "module",
          templateVersion: targetVersion,
          companyProfile: targetSnapshot.companyProfile ?? {},
          data: { backfill: "seed-gdpr", sourceRequirementId: signedSide.requirementId },
        });
      });
      propagated++;
    }
  }

  console.log(
    `  Bootstrapped ${companiesBootstrapped} new GDPR assessments, ` +
      `created ${statusRowsCreated} status rows, propagated ${propagated} sign-offs.`,
  );
  if (skippedRoleMismatch > 0 || skippedIncompleteSource > 0) {
    console.log(
      `  Skipped ${skippedRoleMismatch} pair(s) whose target requires a ` +
        `different signer role, and ${skippedIncompleteSource} whose source ` +
        `row carries no signature to copy.`,
    );
  }

  // Recalculate progress counters for every assessment that may have
  // drifted (live signOff mutation does this; backfill must too).
  console.log("  Recalculating assessment progress counters...");
  const allAssessments = await db.query.companyAssessment.findMany();
  for (const a of allAssessments) {
    // Reuse the live path's counter logic rather than restating the
    // completed/approved/not_applicable rule, which is the sort of copy that
    // drifts the moment a status value is added.
    await recalculateProgress(db, a.id);
  }
  console.log(`  Recalculated ${allAssessments.length} assessment counters.\n`);
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
    with: {
      assessment: { columns: { companyId: true } },
      // The target's own required signer and template version decide whether a
      // copied sign-off is allowed and which version it records.
      requirement: { columns: { requiredSignOffRole: true, templateVersion: true } },
    },
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

// One exit point per outcome, at the end. seed() now returns early when the
// backfill is not opted into, and an early return alone would leave the
// connection pool holding the event loop open.
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
