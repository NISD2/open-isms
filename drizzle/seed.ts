import { assertLocalDatabase } from "../scripts/lib/assert-local-database";

/**
 * Seed script — Populates the database with NIS2 framework data.
 *
 * Usage: bun run drizzle/seed.ts
 *
 * Inserts:
 *   1 framework  (NIS2/BSIG 2026)
 *   12 categories
 *   49 requirements
 *   8 prerequisites
 *
 * Idempotent: clears existing data before inserting.
 */
// Refuse anything but a local database.
//
// This previously checked NODE_ENV === "production", which is inverted in both
// directions: `bun run` leaves NODE_ENV undefined, so it never fired under the
// invocation this file documents, and the Dockerfile sets it to "production",
// so it fired only where the script never runs. The guard was decorative while
// docs/coolify-deployment.md listed `bun run db:seed` as a manual production
// step.
//
// It matters because cleanFramework below is not tenant-scoped: it resolves its
// delete set from the GLOBAL requirement catalog, so it removes evidence,
// requirement assignments, requirement statuses, category assignments and
// intake answers for EVERY company in the database. Untransacted, so a
// mid-way foreign-key abort leaves the earlier deletes committed.
assertLocalDatabase(
  process.env.DATABASE_URL ?? "",
  "drizzle/seed.ts deletes every tenant's evidence, requirement statuses and " +
    "intake answers before reseeding.",
);

import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, inArray, sql } from "drizzle-orm";
import * as schema from "@/schema";
import {
  nis2Categories,
  getNis2RequirementsForCategory,
  iso27001Categories,
  getIso27001RequirementsForCategory,
  type FrameworkCategory,
  type FrameworkRequirement,
} from "@nisd2/grc-data-model/frameworks";
import { SEED_COMPANY_DATA } from "./seed-company-data";
import { SEED_INTAKE_ANSWERS } from "./seed-intake-data";
import { backfillInitialDeadlines } from "@/lib/compliance/schedule-notifications";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import { getDefaultPolicyConfig, POLICY_TYPES } from "@/lib/compliance/policy-config-defaults";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required");
const db = drizzle(dbUrl, { schema });

// ------------------------------------------------------------------
// Reusable: clean all data for a given framework code
// ------------------------------------------------------------------
async function cleanFramework(code: (typeof schema.complianceFramework.$inferSelect)["code"]) {
  const existing = await db.query.complianceFramework.findFirst({
    where: eq(schema.complianceFramework.code, code),
  });
  if (!existing) return;

  const existingCategories = await db.query.requirementCategory.findMany({
    where: eq(schema.requirementCategory.frameworkId, existing.id),
  });
  const categoryIds = existingCategories.map((c) => c.id);

  if (categoryIds.length > 0) {
    const existingRequirements = await db.query.requirement.findMany({
      where: sql`${schema.requirement.categoryId} IN (${sql.join(
        categoryIds.map((id) => sql`${id}`),
        sql`, `
      )})`,
    });
    const requirementIds = existingRequirements.map((r) => r.id);

    if (requirementIds.length > 0) {
      // Delete evidence before statuses (FK constraint)
      const existingStatuses = await db.query.companyRequirementStatus.findMany({
        where: sql`${schema.companyRequirementStatus.requirementId} IN (${sql.join(
          requirementIds.map((id) => sql`${id}`),
          sql`, `
        )})`,
        columns: { id: true },
      });
      const statusIds = existingStatuses.map((s) => s.id);
      if (statusIds.length > 0) {
        await db.delete(schema.evidence).where(
          sql`${schema.evidence.requirementStatusId} IN (${sql.join(
            statusIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      }

      if (statusIds.length > 0) {
        await db.delete(schema.requirementAssignment).where(
          sql`${schema.requirementAssignment.statusId} IN (${sql.join(
            statusIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      }

      await db.delete(schema.companyRequirementStatus).where(
        sql`${schema.companyRequirementStatus.requirementId} IN (${sql.join(
          requirementIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

      await db.delete(schema.requirementPrerequisite).where(
        sql`${schema.requirementPrerequisite.requirementId} IN (${sql.join(
          requirementIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

      // Delete category assignments and intakes referencing these categories
      await db.delete(schema.categoryAssignment).where(
        sql`${schema.categoryAssignment.categoryId} IN (${sql.join(
          categoryIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

      await db.delete(schema.companyCategoryIntake).where(
        sql`${schema.companyCategoryIntake.categoryId} IN (${sql.join(
          categoryIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

      await db.delete(schema.requirement).where(
        sql`${schema.requirement.categoryId} IN (${sql.join(
          categoryIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    }

    await db
      .delete(schema.requirementCategory)
      .where(eq(schema.requirementCategory.frameworkId, existing.id));
  }

  // Don't delete framework or assessments — upsert framework, backfill status rows later
  // Assessments from real companies are preserved across re-seeds
}

// ------------------------------------------------------------------
// Reusable: seed categories + requirements for a framework
// ------------------------------------------------------------------
async function seedFrameworkData(
  frameworkId: string,
  categories: FrameworkCategory[],
  getRequirements: (slug: string) => FrameworkRequirement[]
): Promise<{ categoryMap: Map<string, string>; reqCount: number }> {
  const categoryMap = new Map<string, string>();
  let reqCount = 0;

  for (const cat of categories) {
    const [row] = await db
      .insert(schema.requirementCategory)
      .values({
        frameworkId,
        code: cat.code,
        slug: cat.slug,
        referenceUrl: cat.referenceUrl,
        nationalUrl: cat.nationalUrl,
        sortOrder: cat.sortOrder,
        estimatedMinutes: cat.estimatedMinutes,
        relevantRoles: cat.relevantRoles ?? null,
        grundschutzModule: cat.grundschutzModule ?? null,
      })
      .returning();

    categoryMap.set(cat.slug, row.id);
    console.log(`    ${cat.code} → ${cat.slug} (${row.id})`);
  }

  for (const cat of categories) {
    const categoryId = categoryMap.get(cat.slug)!;
    const requirements = getRequirements(cat.slug);

    console.log(`  ${cat.code}: ${requirements.length} requirements...`);

    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];

      await db
        .insert(schema.requirement)
        .values({
          categoryId,
          code: req.code,
          evidenceType: req.evidenceType as "document" | "proof" | "sign-off" | "technical" | "training",
          frequency: req.frequency as "one-time" | "monthly" | "quarterly" | "semi-annual" | "annual" | "every-3-years" | "on-change" | "ongoing",
          priority: req.priority,
          importance: req.importance,
          legalRef: req.legalRef || null,
          frameworkRef: req.frameworkRef || null,
          cirReference: req.cirReference || null,
          moduleRef: req.moduleRef || null,
          requiredSignOffRole: req.requiredSignOffRole || null,
          sortOrder: i,
        })
        .returning();

      reqCount++;
    }
  }

  return { categoryMap, reqCount };
}

// ==================================================================
// Main seed function
// ==================================================================
async function seed() {
  console.log("Seeding compliance data...\n");

  // ------------------------------------------------------------------
  // 0. Clean existing framework data
  // ------------------------------------------------------------------
  console.log("  Clearing existing data...");
  await cleanFramework("nis2");
  for (const staleCode of ["gdpr", "iso27001"] as const) {
    await cleanFramework(staleCode);
  }
  console.log("  Done.\n");

  // ------------------------------------------------------------------
  // 1. Seed NIS2 framework
  // ------------------------------------------------------------------
  console.log("  Upserting NIS2 framework...");
  const [nis2Fw] = await db
    .insert(schema.complianceFramework)
    .values({
      code: "nis2",
      version: "2026",
      effectiveDate: "2026-03-17",
      isActive: true,
      codePrefix: "NIS2-",
      sidebarLabel: "nis2",
    })
    .onConflictDoUpdate({
      target: schema.complianceFramework.code,
      set: {
        version: "2026",
        effectiveDate: "2026-03-17",
        isActive: true,
      },
    })
    .returning();

  console.log(`  Framework: ${nis2Fw.code} (${nis2Fw.id})\n`);

  const nis2Result = await seedFrameworkData(
    nis2Fw.id,
    nis2Categories,
    getNis2RequirementsForCategory
  );

  console.log();
  console.log(`  Seeded successfully:`);
  console.log(`     1 framework (NIS2)`);
  console.log(`     ${nis2Result.categoryMap.size} categories`);
  console.log(`     ${nis2Result.reqCount} requirements`);

  // ------------------------------------------------------------------
  // 1b. Seed requirement prerequisites (hard legal gates)
  // ------------------------------------------------------------------
  const allReqs = await db.query.requirement.findMany({
    where: sql`${schema.requirement.categoryId} IN (${sql.join(
      [...nis2Result.categoryMap.values()].map((id) => sql`${id}`),
      sql`, `
    )})`,
  });
  const reqByCode = new Map(allReqs.map((r) => [r.code, r.id]));

  const PREREQUISITES: { prerequisite: string; blocks: string; notes: string }[] = [
    // === Registration chain ===
    // 12.1 (classification, §28) and 12.2 (registration, §33) are parallel
    // filings, not sequenced, so 12.1 is not a prerequisite of 12.2.
    { prerequisite: "12.2", blocks: "12.3", notes: "Registration must exist before maintenance" },
    { prerequisite: "12.1", blocks: "12.4", notes: "Classification needed for compliance evidence scope" },

    // === Governance: CEO training gates sign-offs (§38 BSIG) ===
    { prerequisite: "1.1", blocks: "1.3", notes: "§38: CEO trained before budget sign-off" },
    { prerequisite: "1.1", blocks: "1.4", notes: "§38: CEO trained before liability acknowledgment" },
    { prerequisite: "1.1", blocks: "2.4", notes: "§38: CEO trained before IS policy sign-off" },
    { prerequisite: "1.1", blocks: "7.3", notes: "§38: CEO trained before management review" },

    // === Risk foundation: methodology + assets → risk register → treatment ===
    { prerequisite: "2.1", blocks: "2.3", notes: "Can't assess risks without methodology" },
    { prerequisite: "2.2", blocks: "2.3", notes: "Can't assess risks without asset inventory" },
    { prerequisite: "2.3", blocks: "2.4", notes: "Can't accept residual risks without register" },

    // === Incident handling: plan → detection → reporting → drill → review ===
    { prerequisite: "1.2", blocks: "3.1", notes: "Incident team requires defined roles (§30(1)(2))" },
    { prerequisite: "3.1", blocks: "3.2", notes: "Detection needs incident response plan" },
    { prerequisite: "3.1", blocks: "3.3", notes: "BSI reporting needs incident response plan" },
    { prerequisite: "3.1", blocks: "3.4", notes: "Drill needs incident response plan" },
    { prerequisite: "3.1", blocks: "3.5", notes: "Post-incident review needs incident response plan" },

    // === BCP: BIA → plans → DR → backup → testing ===
    { prerequisite: "2.3", blocks: "4.1", notes: "BIA requires risk assessment results (BSI-200-4)" },
    { prerequisite: "4.1", blocks: "4.2", notes: "BCP plan needs BIA results" },
    { prerequisite: "4.1", blocks: "4.3", notes: "DR plan needs BIA results" },
    { prerequisite: "4.1", blocks: "4.4", notes: "Backup strategy needs recovery targets from BIA" },
    { prerequisite: "4.2", blocks: "4.5", notes: "BCP testing needs BCP plan" },

    // === Supply chain: register → contracts → assessment → incidents ===
    { prerequisite: "2.2", blocks: "5.1", notes: "Supplier register needs asset context (§30(1)(4))" },
    { prerequisite: "5.1", blocks: "5.2", notes: "Contracts need supplier register" },
    { prerequisite: "5.1", blocks: "5.3", notes: "Assessment needs supplier register" },
    { prerequisite: "5.1", blocks: "5.4", notes: "Supplier incident process needs supplier register" },

    // === Procurement: secure procurement → dev → vulns → patches → changes ===
    { prerequisite: "2.3", blocks: "6.1", notes: "Procurement security depends on risk context (§30(1)(5))" },
    { prerequisite: "6.1", blocks: "6.2", notes: "Secure dev needs procurement policy" },
    { prerequisite: "2.2", blocks: "6.3", notes: "Vulnerability mgmt needs asset inventory" },
    { prerequisite: "2.2", blocks: "6.4", notes: "Patch mgmt needs asset inventory" },
    { prerequisite: "6.1", blocks: "6.5", notes: "Change mgmt needs procurement policy" },

    // === Effectiveness: KPIs → audit → review → improvements ===
    { prerequisite: "2.3", blocks: "7.1", notes: "KPIs need risk baseline to measure against" },
    { prerequisite: "2.3", blocks: "7.2", notes: "Audit scope derives from risk assessment" },
    { prerequisite: "7.1", blocks: "7.4", notes: "Improvements need KPI data" },

    // === Training: policy → awareness → role-specific → testing ===
    { prerequisite: "1.2", blocks: "8.1", notes: "IT security policy needs role definitions" },
    { prerequisite: "8.1", blocks: "8.2", notes: "Awareness program needs security policy" },
    { prerequisite: "1.1", blocks: "8.3", notes: "Management training content depends on CEO training (§38)" },
    { prerequisite: "8.2", blocks: "8.4", notes: "Phishing simulations need awareness program" },

    // === Crypto: policy first, then implementation ===
    { prerequisite: "2.3", blocks: "9.1", notes: "Crypto policy depends on risk assessment (§30(1)(8))" },
    { prerequisite: "9.1", blocks: "9.2", notes: "Encryption implementation needs crypto policy" },
    { prerequisite: "9.1", blocks: "9.3", notes: "Key management needs crypto policy" },

    // === Access control: policy → per-asset → lifecycle → reviews ===
    { prerequisite: "2.2", blocks: "10.1", notes: "Access policy needs asset inventory (§30(1)(9))" },
    { prerequisite: "10.1", blocks: "10.2", notes: "Per-asset access requires access policy" },
    { prerequisite: "10.1", blocks: "10.3", notes: "User lifecycle needs access policy" },
    { prerequisite: "10.1", blocks: "10.4", notes: "Access reviews need access policy" },

    // === Authentication (relaxed 2026-06: P0 MFA must not wait on the P1 access policy) ===
    // MFA stays scoped against the asset inventory; secure-comms and auth-standards are unblocked.
    // Existing prod data is migrated by grc/0001_relax_mfa_prereq.sql.
    { prerequisite: "2.2", blocks: "11.1", notes: "MFA is scoped against the asset inventory (§30(1)(9))" },
  ];

  for (const p of PREREQUISITES) {
    const prereqId = reqByCode.get(p.prerequisite);
    const blockedId = reqByCode.get(p.blocks);
    if (prereqId && blockedId) {
      await db.insert(schema.requirementPrerequisite).values({
        requirementId: blockedId,
        prerequisiteId: prereqId,
        notes: p.notes,
      });
    }
  }
  console.log(`     ${PREREQUISITES.length} prerequisites`);

  // ------------------------------------------------------------------
  // 1c. Seed ISO 27001 framework
  // ------------------------------------------------------------------
  console.log("\n  Upserting ISO 27001 framework...");
  const [iso27001Fw] = await db
    .insert(schema.complianceFramework)
    .values({
      code: "iso27001",
      version: "2022",
      effectiveDate: "2022-10-25",
      // NIS 2 is the only framework the product surfaces. ISO 27001 reference
      // data is still seeded so the NIS2 <-> ISO satisfaction pairs resolve,
      // but inactive keeps it out of the sidebar, out of /compliance, and out
      // of what createAssessmentsForFrameworks provisions for a new signup.
      isActive: false,
      codePrefix: "ISO27001-",
      sidebarLabel: "iso27001",
    })
    .onConflictDoUpdate({
      target: schema.complianceFramework.code,
      set: {
        version: "2022",
        effectiveDate: "2022-10-25",
        isActive: false,
      },
    })
    .returning();

  console.log(`  Framework: ${iso27001Fw.code} (${iso27001Fw.id})\n`);

  const iso27001Result = await seedFrameworkData(
    iso27001Fw.id,
    iso27001Categories,
    getIso27001RequirementsForCategory
  );

  console.log();
  console.log(`  Seeded successfully:`);
  console.log(`     1 framework (ISO 27001:2022)`);
  console.log(`     ${iso27001Result.categoryMap.size} categories`);
  console.log(`     ${iso27001Result.reqCount} requirements`);

  // ------------------------------------------------------------------
  // Load framework data (shared across all company seeds)
  // ------------------------------------------------------------------
  const allNis2Categories = await db.query.requirementCategory.findMany({
    where: eq(schema.requirementCategory.frameworkId, nis2Fw.id),
  });
  const nis2CategoryIds = allNis2Categories.map((c) => c.id);

  const allNis2Requirements = await db.query.requirement.findMany({
    where: sql`${schema.requirement.categoryId} IN (${sql.join(
      nis2CategoryIds.map((id) => sql`${id}`),
      sql`, `
    )})`,
  });

  // ------------------------------------------------------------------
  // Reusable: provision a company with full seed data
  // ------------------------------------------------------------------
  interface SeedCompanyConfig {
    companyName: string;
    companyProfile: {
      sector: string;
      entityType: "essential" | "important";
      employeeCount: number;
      contactEmail: string;
      cisoName: string;
      cisoReportsTo: string;
      bsiContactName: string;
      bsiContactEmail: string;
      bsiContactPhone: string;
      annualSecurityBudget: string;
      primaryLocations: string;
      legalForm?: string;
    };
    userEmail: string;
    userName: string;
    /** If true, create the user. If false, update existing user's companyId. */
    createUser: boolean;
  }

  async function cleanUserAndCompany(email: string) {
    const existing = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });
    if (!existing) return;

    await db.delete(schema.notification).where(
      eq(schema.notification.recipientId, existing.id)
    );
    await db.delete(schema.auditLog).where(
      eq(schema.auditLog.userId, existing.id)
    );
    if (existing.companyId) {
      await db.delete(schema.notification).where(
        eq(schema.notification.companyId, existing.companyId)
      );
      await db.delete(schema.auditLog).where(
        eq(schema.auditLog.companyId, existing.companyId)
      );
      const assessments = await db.query.companyAssessment.findMany({
        where: eq(schema.companyAssessment.companyId, existing.companyId),
      });
      for (const a of assessments) {
        await db.delete(schema.companyRequirementStatus).where(
          eq(schema.companyRequirementStatus.assessmentId, a.id)
        );
        await db.delete(schema.companyCategoryIntake).where(
          eq(schema.companyCategoryIntake.assessmentId, a.id)
        );
      }
      await db.delete(schema.companyAssessment).where(
        eq(schema.companyAssessment.companyId, existing.companyId)
      );
    }
    const savedCompanyId = existing.companyId;
    if (existing.email === "dev@nis2.local") {
      await db.delete(schema.user).where(eq(schema.user.id, existing.id));
    } else {
      await db.update(schema.user).set({ companyId: null }).where(eq(schema.user.id, existing.id));
    }
    if (savedCompanyId) {
      // Detach any remaining users from this company
      await db.update(schema.user).set({ companyId: null }).where(eq(schema.user.companyId, savedCompanyId));
      // Delete junction tables first (no companyId — join through parent)
      const companyRiskIds = db.select({ id: schema.risk.id }).from(schema.risk).where(eq(schema.risk.companyId, savedCompanyId));
      await db.delete(schema.riskAsset).where(inArray(schema.riskAsset.riskId, companyRiskIds)).catch(() => {});
      await db.delete(schema.riskSupplier).where(inArray(schema.riskSupplier.riskId, companyRiskIds)).catch(() => {});
      // Delete all company-scoped data (order matters: children before parents)
      // The supplier table is bilateral post-C3 (no `companyId`); delete by
      // customerCompanyId separately to handle the legacy entity-inventory rows.
      await db.delete(schema.supplier).where(eq(schema.supplier.customerCompanyId, savedCompanyId)).catch(() => {});
      // Delete audit findings before internal audits (FK: auditFinding.auditId → internalAudit.id)
      const companyAuditIds = db.select({ id: schema.internalAudit.id }).from(schema.internalAudit).where(eq(schema.internalAudit.companyId, savedCompanyId));
      await db.delete(schema.auditFinding).where(inArray(schema.auditFinding.auditId, companyAuditIds)).catch(() => {});
      const companyTables = [
        schema.patchRecord, schema.changeRequest,
        schema.asset, schema.risk, schema.incident,
        schema.trainingRecord,
        schema.policy, schema.kpiMeasurement, schema.improvementItem,
        schema.internalAudit, schema.exercise, schema.managementReview,
        schema.companyInvite, schema.bsiRegistration,
        schema.companyRiskMethodology, schema.companyPolicyConfig,
      ] as const;
      for (const table of companyTables) {
        await db.delete(table).where(eq(table.companyId, savedCompanyId)).catch(() => {});
      }
      await db.delete(schema.company).where(eq(schema.company.id, savedCompanyId));
    }
  }

  async function seedCompany(config: SeedCompanyConfig) {
    console.log(`\n  Setting up ${config.companyName}...`);

    await cleanUserAndCompany(config.userEmail);

    const [co] = await db
      .insert(schema.company)
      .values({
        name: config.companyName,
        legalForm: config.companyProfile.legalForm,
        sector: config.companyProfile.sector,
        entityType: config.companyProfile.entityType,
        employeeCount: config.companyProfile.employeeCount,
        contactEmail: config.companyProfile.contactEmail,
        cisoName: config.companyProfile.cisoName,
        cisoReportsTo: config.companyProfile.cisoReportsTo,
        bsiContactName: config.companyProfile.bsiContactName,
        bsiContactEmail: config.companyProfile.bsiContactEmail,
        bsiContactPhone: config.companyProfile.bsiContactPhone,
        annualSecurityBudget: config.companyProfile.annualSecurityBudget,
        primaryLocations: config.companyProfile.primaryLocations,
        // The demo company is a complete, working company. Without
        // activatedAt every compliance work surface renders the
        // "set up your organization" empty state instead of its content.
        activatedAt: new Date(),
        actsAsNis2Entity: true,
      })
      .returning();

    console.log(`    Company: ${co.name} (${co.id})`);

    let userId: string;
    if (config.createUser) {
      const [u] = await db
        .insert(schema.user)
        .values({
          companyId: co.id,
          email: config.userEmail,
          name: config.userName,
          role: "admin",
          isManagement: true,
          emailVerifiedAt: new Date(),
        })
        .returning();
      userId = u.id;
      console.log(`    User: ${u.email} (${userId}) [created]`);
    } else {
      await db
        .update(schema.user)
        .set({ companyId: co.id, role: "admin", isManagement: true, emailVerifiedAt: new Date() })
        .where(eq(schema.user.email, config.userEmail));
      const u = await db.query.user.findFirst({
        where: eq(schema.user.email, config.userEmail),
        columns: { id: true },
      });
      if (!u) throw new Error(`Seed user not found: ${config.userEmail}`);
      userId = u.id;
      console.log(`    User: ${config.userEmail} (${userId}) [updated]`);
    }

    const [assessment] = await db
      .insert(schema.companyAssessment)
      .values({
        companyId: co.id,
        frameworkId: nis2Fw.id,
        totalRequirements: nis2Result.reqCount,
      })
      .returning();

    console.log(`    Assessment: NIS2 (${assessment.id})`);

    const now = new Date();
    let completedCount = 0;
    for (const req of allNis2Requirements) {
      const companyData = SEED_COMPANY_DATA[req.code];
      const hasData = companyData && Object.keys(companyData).length > 0;
      await db.insert(schema.companyRequirementStatus).values({
        assessmentId: assessment.id,
        requirementId: req.id,
        status: hasData ? "completed" : "not_started",
        completedAt: hasData ? now : null,
        completedBy: hasData ? userId : null,
        signedOffBy: hasData ? userId : null,
        signedOffAt: hasData ? now : null,
        signedOffRole: hasData ? "ciso" : null,
        signedOffTemplateVersion: hasData ? 1 : null,
        signOffSnapshot: hasData ? {
          templateVersion: 1,
          companyProfile: {
            cisoName: config.companyProfile.cisoName,
            bsiContactName: config.companyProfile.bsiContactName,
          },
        } : null,
      });
      if (hasData) completedCount++;
    }
    console.log(`    ${allNis2Requirements.length} status rows (${completedCount} completed)`);

    for (const cat of allNis2Categories) {
      const answers = SEED_INTAKE_ANSWERS[cat.code];
      if (!answers) continue;
      await db.insert(schema.companyCategoryIntake).values({
        assessmentId: assessment.id,
        categoryId: cat.id,
        answers,
        completionPct: 100,
        lastSavedBy: userId,
        lastSavedAt: now,
        signedOffBy: userId,
        signedOffAt: now,
        signOffSnapshot: {
          answers,
          companyProfile: {
            cisoName: config.companyProfile.cisoName,
            cisoReportsTo: config.companyProfile.cisoReportsTo,
            bsiContactName: config.companyProfile.bsiContactName,
            bsiContactEmail: config.companyProfile.bsiContactEmail,
            annualSecurityBudget: config.companyProfile.annualSecurityBudget,
            primaryLocations: config.companyProfile.primaryLocations,
            employeeCount: config.companyProfile.employeeCount,
            sector: config.companyProfile.sector,
          },
        },
      });
    }
    console.log(`    ${Object.keys(SEED_INTAKE_ANSWERS).length} intake forms (all signed off)`);

    // Risk methodology
    const methDefaults = getDefaultMethodology("en");
    await db
      .insert(schema.companyRiskMethodology)
      .values({
        companyId: co.id,
        name: methDefaults.name,
        likelihoodLevels: methDefaults.likelihoodLevels,
        impactLevels: methDefaults.impactLevels,
        acceptanceThreshold: methDefaults.acceptanceThreshold,
        includesOt: methDefaults.includesOt,
      })
      .onConflictDoNothing();

    // Policy configs (crypto, access control, procurement, secure dev)
    for (const policyType of POLICY_TYPES) {
      await db
        .insert(schema.companyPolicyConfig)
        .values({
          companyId: co.id,
          policyType,
          config: getDefaultPolicyConfig(policyType, "en"),
        })
        .onConflictDoNothing();
    }

    // Seed assets (CIR 2024/2690 §12 — diversified NIS2 asset types)
    const SEED_ASSETS = [
      { name: "ERP System (SAP Business One)", type: "application", description: "Core enterprise resource planning — financials, procurement, inventory", isCritical: true, isOT: false, owner: "IT Lead", location: "Berlin (on-prem)", lastPatchDate: "2026-02-15", endOfLife: "2029-12-31" },
      { name: "Email & Collaboration (Microsoft 365)", type: "cloud_service", description: "Exchange Online, Teams, SharePoint — primary communication platform", isCritical: true, isOT: false, owner: "IT Lead", location: "Cloud (EU tenant)", lastPatchDate: "2026-03-01", endOfLife: null },
      { name: "Customer Database (PostgreSQL)", type: "database", description: "Primary customer and transaction data store", isCritical: true, isOT: false, owner: "IT Lead", location: "Berlin (on-prem)", lastPatchDate: "2026-01-20", endOfLife: "2028-11-09" },
      { name: "Company Website", type: "application", description: "Public-facing website and customer portal", isCritical: false, isOT: false, owner: "Marketing Lead", location: "Cloud (Hetzner DE)", lastPatchDate: "2026-02-28", endOfLife: null },
      { name: "Core Network (Firewall + Switch)", type: "network", description: "Firewalls, switches, routers, VPN concentrators", isCritical: true, isOT: false, owner: "Network Engineer", location: "Berlin, München", lastPatchDate: "2026-02-01", endOfLife: "2030-06-30" },
      { name: "Employee Laptops", type: "endpoint", description: "Windows 11 Pro fleet managed via Intune, BitLocker encrypted", isCritical: false, isOT: false, owner: "IT Lead", location: "Berlin, München, Remote", lastPatchDate: "2026-02-20", endOfLife: "2028-03-31", quantity: 45 },
      { name: "Backup Storage (NAS + S3)", type: "data_store", description: "On-prem NAS for local backups, S3 for offsite replication — AES-256 encrypted", isCritical: true, isOT: false, owner: "IT Lead", location: "Berlin (NAS), AWS eu-central-1 (S3)", lastPatchDate: "2026-01-15", endOfLife: "2029-01-31" },
      { name: "Office Building Berlin", type: "physical", description: "Main office — server room, badge access, CCTV, visitor management", isCritical: false, isOT: false, owner: "Office Manager", location: "Berlin", lastPatchDate: null, endOfLife: null },
    ];

    const assetRows = [];
    for (const a of SEED_ASSETS) {
      const [row] = await db.insert(schema.asset).values({ companyId: co.id, ...a }).returning();
      assetRows.push(row);
    }
    console.log(`    ${assetRows.length} assets seeded`);

    // Seed risks using BSI 200-3 scales (likelihood 1-4 × impact 1-4)
    const SEED_RISKS = [
      { title: "Ransomware attack on ERP system", description: "Encryption of SAP Business One database and connected file shares, causing operational shutdown", category: "Malware", likelihood: 3, impact: 4, treatment: "mitigate", treatmentDescription: "EDR on all endpoints (CrowdStrike), network segmentation, daily offline backups, incident response playbook", riskOwner: config.companyProfile.cisoName, assetIndices: [0, 4, 6] },
      { title: "Phishing / credential theft", description: "Social engineering leading to compromised user credentials and unauthorized access to cloud services", category: "Social Engineering", likelihood: 4, impact: 2, treatment: "mitigate", treatmentDescription: "MFA enforced for all users, quarterly phishing simulations ([awareness-platform]), security awareness training", riskOwner: config.companyProfile.cisoName, assetIndices: [1, 5] },
      { title: "Backup failure / data loss", description: "Backup corruption or untested restore procedures leading to unrecoverable data loss after incident", category: "Availability", likelihood: 2, impact: 3, treatment: "mitigate", treatmentDescription: "Monthly backup restore tests, dual backup targets (NAS + S3), automated integrity checks", riskOwner: "IT Lead", assetIndices: [6] },
      { title: "Insider threat / privilege misuse", description: "Malicious or negligent employee accessing sensitive data beyond their authorization", category: "Access Control", likelihood: 2, impact: 3, treatment: "mitigate", treatmentDescription: "Least-privilege access model, quarterly access reviews, PAM for admin accounts, audit logging", riskOwner: config.companyProfile.cisoName, assetIndices: [0, 1] },
      { title: "DDoS attack on company website", description: "Volumetric or application-layer DDoS rendering public website and customer portal unavailable", category: "Availability", likelihood: 3, impact: 1, treatment: "accept", treatmentDescription: "Low business impact — website is informational. Basic Cloudflare protection in place.", riskOwner: "Marketing Lead", assetIndices: [3] },
      { title: "Physical access breach", description: "Unauthorized physical access to server room or office areas containing sensitive equipment", category: "Physical", likelihood: 1, impact: 2, treatment: "accept", treatmentDescription: "Badge access, CCTV, visitor log in place. Residual risk acceptable given building security.", riskOwner: "Office Manager", assetIndices: [7, 4] },
    ];

    for (const r of SEED_RISKS) {
      const score = r.likelihood * r.impact;
      const [riskRow] = await db.insert(schema.risk).values({
        companyId: co.id,
        title: r.title,
        description: r.description,
        category: r.category,
        likelihood: r.likelihood,
        impact: r.impact,
        riskScore: score,
        treatment: r.treatment,
        treatmentDescription: r.treatmentDescription,
        riskOwner: r.riskOwner,
      }).returning();

      // Link risk to affected assets
      for (const idx of r.assetIndices) {
        const assetRow = assetRows[idx];
        if (assetRow) {
          await db.insert(schema.riskAsset).values({
            riskId: riskRow.id,
            assetId: assetRow.id,
          });
        }
      }
    }
    console.log(`    ${SEED_RISKS.length} risks seeded (with asset links)`);

    // Seed suppliers (CIR 5.1 — supply chain inventory)
    const SEED_SUPPLIERS = [
      { name: "Hetzner Online GmbH", description: "Cloud hosting provider for company website and staging environments", serviceType: "Cloud Hosting", riskLevel: "medium" as const, isCritical: false, hasAccessToSystems: true, hasAccessToData: false, hasSecurityClauses: true, hasIncidentNotificationClause: true, hasAuditRights: false, contactName: "Support Team", contactEmail: "support@hetzner.com", contractSecurityClauses: "SLA 99.9% uptime, 72h incident notification, data stored in EU only", auditFrequency: "biennial" as const, monitoringMethod: "Annual questionnaire", lastReviewDate: "2025-06-15", dueDiligenceProcess: "Security questionnaire + ISO 27001 cert check" },
      { name: "Microsoft (M365 tenant)", description: "Email, Teams, SharePoint — primary collaboration platform", serviceType: "SaaS", riskLevel: "high" as const, isCritical: true, hasAccessToSystems: true, hasAccessToData: true, hasSecurityClauses: true, hasIncidentNotificationClause: true, hasAuditRights: true, hasSecurityCertification: true, securityCertificationType: "ISO 27001, SOC 2 Type II", contactName: "Enterprise Support", contactEmail: "enterprise@microsoft.com", contractSecurityClauses: "Enterprise SLA 99.99% uptime, 24h incident notification, GDPR DPA, audit rights via SOC 2 reports", auditFrequency: "annual" as const, monitoringMethod: "SecurityScorecard continuous monitoring + annual SOC 2 review", lastReviewDate: "2025-10-15", dueDiligenceProcess: "ISO 27001 + SOC 2 Type II cert review + Microsoft Trust Center" },
      { name: "CrowdStrike GmbH", description: "Endpoint detection and response (EDR) platform", serviceType: "Managed Security", riskLevel: "high" as const, isCritical: true, hasAccessToSystems: true, hasAccessToData: true, hasSecurityClauses: true, hasIncidentNotificationClause: true, hasAuditRights: true, hasSecurityCertification: true, securityCertificationType: "SOC 2 Type II", contactName: "Account Manager", contactEmail: "sales@crowdstrike.com", contractSecurityClauses: "SLA 99.95%, 24h incident notification, data handling per GDPR DPA, secure deletion on termination", auditFrequency: "annual" as const, monitoringMethod: "SecurityScorecard + annual SOC 2 review", lastReviewDate: "2025-09-20", dueDiligenceProcess: "SOC 2 Type II cert review + reference call" },
      { name: "Büroreinigung Schmidt", description: "Office cleaning service with physical access to all office areas", serviceType: "Facility Services", riskLevel: "low" as const, isCritical: false, hasAccessToSystems: false, hasAccessToData: false, hasSecurityClauses: false, hasIncidentNotificationClause: false, hasAuditRights: false, contactName: "Herr Schmidt", contactEmail: "info@schmidt-reinigung.de", monitoringMethod: "Visual inspection during visits" },
    ];

    const supplierRows = [];
    for (const s of SEED_SUPPLIERS) {
      const [row] = await db.insert(schema.supplier).values({ customerCompanyId: co.id, ...s }).returning();
      supplierRows.push(row);
    }
    console.log(`    ${supplierRows.length} suppliers seeded`);

    // Link some risks to suppliers (supply chain risk mapping)
    // "Ransomware attack on ERP" (index 0) → CrowdStrike (index 2) as the EDR provider
    // "Phishing / credential theft" (index 1) → Microsoft M365 (index 1) as the email platform
    const SUPPLIER_RISK_LINKS = [
      { riskIndex: 0, supplierIndex: 2 },
      { riskIndex: 1, supplierIndex: 1 },
    ];

    // Collect risk rows for linking (re-query since we need IDs)
    const allRisks = await db.query.risk.findMany({ where: eq(schema.risk.companyId, co.id) });
    for (const link of SUPPLIER_RISK_LINKS) {
      const riskRow = allRisks[link.riskIndex];
      const supplierRow = supplierRows[link.supplierIndex];
      if (riskRow && supplierRow) {
        await db.insert(schema.riskSupplier).values({ riskId: riskRow.id, supplierId: supplierRow.id });
      }
    }
    console.log(`    ${SUPPLIER_RISK_LINKS.length} risk-supplier links seeded`);

    await backfillInitialDeadlines(db, {
      assessmentId: assessment.id,
      companyId: co.id,
      userId,
    });
    console.log("    Deadlines seeded");

    // Sample notifications
    const govReq = allNis2Requirements.find((r) => r.code === "1.1");
    const rskReq = allNis2Requirements.find((r) => r.code === "2.1");
    const incReq = allNis2Requirements.find((r) => r.code === "3.1");
    if (govReq && rskReq && incReq) {
      await db.insert(schema.notification).values([
        {
          companyId: co.id,
          recipientId: userId,
          entityType: "requirement",
          entityId: govReq.id,
          triggerField: "reminder_30d",
          subject: "Upcoming: 1.1 review scheduled",
          body: "1.1: Management Risk Approval",
          channel: "in_app" as const,
          status: "sent" as const,
          scheduledFor: now,
          sentAt: now,
          urgency: "info" as const,
          escalationLevel: 0,
          linkUrl: "/compliance/governance#1.1",
        },
        {
          companyId: co.id,
          recipientId: userId,
          entityType: "requirement",
          entityId: rskReq.id,
          triggerField: "reminder_7d",
          subject: "URGENT: 2.1 review deadline is approaching",
          body: "2.1: Risk Assessment Policy",
          channel: "in_app" as const,
          status: "sent" as const,
          scheduledFor: now,
          sentAt: now,
          urgency: "urgent" as const,
          escalationLevel: 0,
          linkUrl: "/compliance/risk-management#2.1",
        },
        {
          companyId: co.id,
          recipientId: userId,
          entityType: "requirement",
          entityId: incReq.id,
          triggerField: "escalation_level_1",
          subject: "OVERDUE: 3.1 is past its compliance deadline",
          body: "3.1: Incident Response Plan",
          channel: "in_app" as const,
          status: "sent" as const,
          scheduledFor: now,
          sentAt: now,
          urgency: "critical" as const,
          escalationLevel: 1,
          linkUrl: "/compliance/incident-handling#3.1",
        },
      ]);
      console.log("    Sample notifications created");
    }

    return { companyId: co.id, userId, assessmentId: assessment.id };
  }

  // ------------------------------------------------------------------
  // 2. Seed companies
  // ------------------------------------------------------------------

  // Dev user (local development)
  await seedCompany({
    companyName: "Dev GmbH",
    companyProfile: {
      sector: "Energy",
      entityType: "essential",
      employeeCount: 500,
      contactEmail: "dev@nis2.local",
      cisoName: "Max Mustermann",
      cisoReportsTo: "Geschäftsführer",
      bsiContactName: "Dr. Schmidt",
      bsiContactEmail: "bsi@dev-gmbh.example.com",
      bsiContactPhone: "+49 30 12345678",
      annualSecurityBudget: "250000",
      primaryLocations: "Berlin, München",
    },
    userEmail: "dev@nis2.local",
    userName: "Dev User",
    createUser: true,
  });

  // Operating-company dogfood (Kardashev Catalyst UG) lives in the
  // private notebook now: ~/repositories/NIS2/business/dogfood-seed-nisd2.ts.
  // Audit P-3 (2026-06-10). The public seed stops at Dev GmbH.

  // ------------------------------------------------------------------
  // 3. Backfill assessments + status rows for non-seeded companies
  // ------------------------------------------------------------------
  // Find companies that have users but no NIS2 assessment (e.g. real users who went through /setup)
  const allCompanies = await db.query.company.findMany({ columns: { id: true, name: true } });
  for (const co of allCompanies) {
    const existing = await db.query.companyAssessment.findFirst({
      where: and(eq(schema.companyAssessment.companyId, co.id), eq(schema.companyAssessment.frameworkId, nis2Fw.id)),
    });
    if (!existing) {
      const [newA] = await db.insert(schema.companyAssessment).values({
        companyId: co.id,
        frameworkId: nis2Fw.id,
        totalRequirements: allNis2Requirements.length,
      }).returning();
      console.log(`\n  Created NIS2 assessment for ${co.name} (${newA.id})`);
    }
  }

  const allAssessments = await db.query.companyAssessment.findMany({
    where: eq(schema.companyAssessment.frameworkId, nis2Fw.id),
  });

  for (const a of allAssessments) {
    const existingStatuses = await db.query.companyRequirementStatus.findMany({
      where: eq(schema.companyRequirementStatus.assessmentId, a.id),
      columns: { requirementId: true },
    });
    const existingReqIds = new Set(existingStatuses.map((s) => s.requirementId));
    const missing = allNis2Requirements.filter((r) => !existingReqIds.has(r.id));

    if (missing.length > 0) {
      await db.insert(schema.companyRequirementStatus).values(
        missing.map((r) => ({ assessmentId: a.id, requirementId: r.id }))
      );
      console.log(`\n  Backfilled ${missing.length} status rows for assessment ${a.id}`);
    }

    // Update total requirements count
    await db
      .update(schema.companyAssessment)
      .set({ totalRequirements: allNis2Requirements.length })
      .where(eq(schema.companyAssessment.id, a.id));
  }

  // The supplier portal questionnaire schema lives in code (drizzle-zod
  // derived from company columns) — no form_template seed row needed.

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
