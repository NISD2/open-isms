import { eq, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";
import {
  company,
  user,
  companyAssessment,
  companyRequirementStatus,
  requirementCategory,
  complianceFramework,
  companyInvite,
  categoryAssignment,
} from "@/schema";
import { getSlugsForRole, ALL_ROLE_KEYS, type RoleKey } from "@/lib/compliance/role-mapping";
import { sendMail, inviteEmail } from "@/lib/mail";
import { logAudit } from "@/lib/audit";
import { getAppUrl } from "@/lib/utils";
import type { Database, DbOrTx } from "@/lib/db";

const INVITE_EXPIRY_DAYS = 7;

/**
 * Placeholder identity for an auto-provisioned draft company. name/sector/
 * entityType are NOT NULL on the table, so a draft cannot be nameless at the
 * DB level. entityType "important" is safe because requirement content does not
 * depend on entity type; activateCompany restamps it to the confirmed value.
 * "n/a" mirrors the existing supplier-onboarding draft convention.
 */
export const DRAFT_COMPANY_NAME = "";
export const DRAFT_COMPANY_SECTOR = "n/a";

/**
 * Auto-provision a draft company for a freshly verified user and seed the NIS2
 * (+ other active framework) assessment so the journey renders at first entry.
 * A draft has activatedAt NULL, role flags false, placeholder identity, and NO
 * deadlines/reminders — activateCompany fills the real details and finalizes.
 *
 * Idempotent: re-checks user.companyId inside the transaction and no-ops
 * (returns null) if the user already has any company, so a verify/OAuth race or
 * a retried request can never mint a second company.
 */
export async function createDraftCompany(
  db: Database,
  userId: string,
): Promise<{ companyId: string } | null> {
  return db.transaction(async (tx) => {
    const current = await tx.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { companyId: true },
    });
    if (current?.companyId) return null;

    const [draft] = await tx
      .insert(company)
      .values({
        name: DRAFT_COMPANY_NAME,
        sector: DRAFT_COMPANY_SECTOR,
        entityType: "important",
        ownerId: userId,
        // activatedAt stays NULL (draft); actsAsNis2Entity stays false until
        // the user confirms they are a regulated entity in activateCompany.
      })
      .returning({ id: company.id });

    await tx
      .update(user)
      .set({ companyId: draft.id, role: "admin", updatedAt: new Date() })
      .where(eq(user.id, userId));

    // Seed the assessment + status rows so journey.getItems is non-empty. No
    // deadline backfill / reminder scheduling here — those wait for activation.
    await createAssessmentsForFrameworks(tx, draft.id, "important");

    return { companyId: draft.id };
  });
}

/**
 * Discard an abandoned draft company and its seeded rows, in FK order (status →
 * assessment → company), in its own transaction. Used when a draft-only user
 * joins another company (team or supplier invite). The caller must first move
 * user.companyId off this draft (else the user FK blocks the delete), then call
 * this BEST-EFFORT (in a try/catch) after that move has committed: a pure draft
 * is removed cleanly, and a draft that somehow accumulated FK-referenced data
 * (a user who did requirement work before joining) is left orphaned — harmless
 * and filtered from admin metrics — rather than rolling back the join.
 */
export async function discardDraftCompany(
  db: Database,
  companyId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const assessments = await tx.query.companyAssessment.findMany({
      where: eq(companyAssessment.companyId, companyId),
      columns: { id: true },
    });
    const assessmentIds = assessments.map((a) => a.id);
    if (assessmentIds.length > 0) {
      await tx
        .delete(companyRequirementStatus)
        .where(inArray(companyRequirementStatus.assessmentId, assessmentIds));
      await tx
        .delete(companyAssessment)
        .where(eq(companyAssessment.companyId, companyId));
    }
    await tx.delete(company).where(eq(company.id, companyId));
  });
}

/** Create an assessment for each active framework and initialize requirement statuses. */
export async function createAssessmentsForFrameworks(
  db: DbOrTx,
  companyId: string,
  entityType: "essential" | "important" | "kritis",
): Promise<{ firstAssessmentId: string; frameworkAssessmentMap: Map<string, string> }> {
  const frameworks = await db.query.complianceFramework.findMany({
    where: eq(complianceFramework.isActive, true),
  });
  if (frameworks.length === 0) throw new Error("No frameworks found. Run db:seed first.");

  const frameworkAssessmentMap = new Map<string, string>();
  let firstAssessmentId: string | null = null;

  for (const framework of frameworks) {
    const cats = await db.query.requirementCategory.findMany({
      where: eq(requirementCategory.frameworkId, framework.id),
      with: { requirements: true },
    });
    const allRequirements = cats.flatMap((c) => c.requirements);

    const [assessment] = await db
      .insert(companyAssessment)
      .values({
        companyId,
        frameworkId: framework.id,
        totalRequirements: allRequirements.length,
        entityTypeAtAssessment: entityType,
      })
      .returning();

    frameworkAssessmentMap.set(framework.id, assessment.id);
    if (!firstAssessmentId) firstAssessmentId = assessment.id;

    if (allRequirements.length > 0) {
      await db.insert(companyRequirementStatus).values(
        allRequirements.map((r) => ({
          assessmentId: assessment.id,
          requirementId: r.id,
        }))
      );
    }
  }

  if (!firstAssessmentId) throw new Error("No assessment created");
  return { firstAssessmentId, frameworkAssessmentMap };
}

/** Resolve team roles to category assignments, creating invites for external users. */
export async function processTeamRoleAssignments(
  db: DbOrTx,
  opts: {
    teamRoles: { roleKey: string; name?: string; email: string }[];
    companyId: string;
    companyName: string;
    userId: string;
    userEmail: string | undefined;
    userName: string | undefined;
    frameworkAssessmentMap: Map<string, string>;
  },
) {
  const allCategories = await db.query.requirementCategory.findMany();
  const slugMap = new Map<string, { categoryId: string; frameworkId: string }>();
  for (const cat of allCategories) {
    slugMap.set(cat.slug, { categoryId: cat.id, frameworkId: cat.frameworkId });
  }

  const validRoleKeys = new Set<string>(ALL_ROLE_KEYS);
  const uniqueRoleKeys = [...new Set(opts.teamRoles.map((r) => r.roleKey))]
    .filter((rk) => validRoleKeys.has(rk));
  const roleSlugsMap = new Map<string, string[]>();
  for (const rk of uniqueRoleKeys) {
    roleSlugsMap.set(rk, await getSlugsForRole(db, rk as RoleKey));
  }

  const byEmail = new Map<
    string,
    { name?: string; roleKeys: string[]; categoryIds: Set<string> }
  >();

  for (const role of opts.teamRoles) {
    const email = role.email.toLowerCase();
    const entry = byEmail.get(email) ?? { name: role.name, roleKeys: [], categoryIds: new Set() };
    entry.roleKeys.push(role.roleKey);
    if (role.name && !entry.name) entry.name = role.name;

    const slugsForRole = roleSlugsMap.get(role.roleKey) ?? [];
    for (const slug of slugsForRole) {
      const resolved = slugMap.get(slug);
      if (resolved) entry.categoryIds.add(resolved.categoryId);
    }

    byEmail.set(email, entry);
  }

  const currentUserEmail = opts.userEmail?.toLowerCase();
  const appUrl = getAppUrl();

  for (const [email, { roleKeys, categoryIds }] of byEmail) {
    if (categoryIds.size === 0) continue;
    const categoryIdArray = [...categoryIds];

    if (email === currentUserEmail) {
      const assignmentValues = categoryIdArray.flatMap((catId) => {
        const catInfo = allCategories.find((c) => c.id === catId);
        if (!catInfo) return [];
        const assessmentId = opts.frameworkAssessmentMap.get(catInfo.frameworkId);
        if (!assessmentId) return [];
        return [{ assessmentId, categoryId: catId, userId: opts.userId, assignedBy: opts.userId }];
      });

      for (const val of assignmentValues) {
        await db
          .insert(categoryAssignment)
          .values(val)
          .onConflictDoUpdate({
            target: [categoryAssignment.assessmentId, categoryAssignment.categoryId],
            set: { userId: val.userId, assignedBy: val.assignedBy, assignedAt: new Date() },
          });
      }
    } else {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await db
        .insert(companyInvite)
        .values({
          companyId: opts.companyId,
          invitedBy: opts.userId,
          email,
          token,
          expiresAt,
          assignmentContext: { roleKeys, categoryIds: categoryIdArray },
        })
        .onConflictDoUpdate({
          target: [companyInvite.companyId, companyInvite.email],
          set: {
            token,
            expiresAt,
            invitedBy: opts.userId,
            status: "pending",
            acceptedBy: null,
            acceptedAt: null,
            assignmentContext: { roleKeys, categoryIds: categoryIdArray },
          },
        });

      const inviteUrl = `${appUrl}/invite/${token}`;
      const inviterName = opts.userName ?? "Your team admin";

      sendMail({
        to: email,
        ...inviteEmail({
          companyName: opts.companyName,
          inviterName,
          inviteUrl,
          role: "member",
        }),
      }).then((r) => {
        if (r.success) {
          logAudit({
            companyId: opts.companyId,
            userId: opts.userId,
            action: "email.invite_sent",
            entityType: "email",
            entityId: r.id ?? null,
            description: `Team role invite sent to ${email} (${roleKeys.join(", ")})`,
          });
        }
      });
    }
  }
}
