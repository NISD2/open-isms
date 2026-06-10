import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import {
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
import type { DbOrTx } from "@/lib/db";

const INVITE_EXPIRY_DAYS = 7;

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
