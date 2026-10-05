/**
 * Inviting someone into a company: the one way a person joins an organization they did not create.
 * Shared by the team page's invite and the hand-off to management at the walk's lock, so both write
 * the same `company_invite` row and accept through the same /invite/[token] page.
 */
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ALL_ROLE_KEYS, type RoleKey } from "@/lib/compliance/role-keys";
import type { Database, DbOrTx } from "@/lib/db";
import { isMemberOf } from "@/lib/organization/membership";
import { getAppUrl } from "@/lib/utils";
import { companyInvite, user } from "@/schema";
import { verifyAssessmentOwnership } from "../guards";
import { resolveRoleAssignments } from "./resolve-role-assignments";

export const INVITE_EXPIRY_DAYS = 7;

const batchAssignmentSchema = z.object({
  roleKeys: z.array(z.string()),
  categoryIds: z.array(z.string().uuid()),
});

/** The one compliance role an invite was sent for, or null. */
export const invitedRoleOf = (raw: unknown): RoleKey | null => {
  const batch = batchAssignmentSchema.safeParse(raw);
  const [only, ...rest] = batch.success ? batch.data.roleKeys : [];
  const role = z.enum(ALL_ROLE_KEYS).safeParse(only);
  return role.success && rest.length === 0 ? role.data : null;
};

/**
 * Create or renew the invite for one address into one company. The caller has already established
 * that `invitedBy` may invite into `companyId` (its procedure tier); this checks the address is not
 * a member yet and that an assignment context points into the same company.
 */
export async function issueInvite(
  db: Database,
  input: {
    readonly companyId: string;
    readonly invitedBy: string;
    readonly email: string;
    /** Already normalised by `inviteRedirectPath`. */
    readonly redirectPath: string | null;
    /** Compliance role to give on accept, with the categories it owns. */
    readonly complianceRole?: RoleKey;
    /** When inviting from the assignment popover: assign this category on accept. */
    readonly assignmentContext?: {
      readonly assessmentId: string;
      readonly categoryId: string;
    };
  },
): Promise<{
  readonly inviteId: string;
  readonly token: string;
  readonly inviteUrl: string;
}> {
  const email = input.email.toLowerCase();

  // Someone who belongs to another organization can be invited too: accepting adds a membership
  // and leaves their other organizations as they are.
  const alreadyMember = await db.query.user.findFirst({
    where: and(eq(user.email, email), isMemberOf(db, input.companyId)),
    columns: { id: true },
  });
  if (alreadyMember) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This person is already a member of your company.",
    });
  }

  // Audit H-1 (2026-06-10): the single-format assignmentContext flows into a
  // `(assessmentId, categoryId)` upsert at accept time. Without an ownership check, an admin in
  // tenant A could supply tenant B's (assessmentId, categoryId) pair and overwrite tenant B's
  // category_assignment row, locking the legitimate owner out of enforceAssignment + sign-off.
  // Verify ownership at the issue site so the bad input never reaches the DB.
  // applyAssignmentContext re-checks at accept time as defense in depth.
  if (input.assignmentContext) {
    await verifyAssessmentOwnership(
      db,
      input.assignmentContext.assessmentId,
      input.companyId,
    );
  }

  // Kept even when the role owns no category: accepting gives a new member the role itself.
  const assignmentContext: Record<string, unknown> | null = input.complianceRole
    ? {
        roleKeys: [input.complianceRole],
        categoryIds: (
          await resolveRoleAssignments(
            db,
            input.companyId,
            input.complianceRole,
            input.invitedBy,
          )
        ).map((r) => r.categoryId),
      }
    : (input.assignmentContext ?? null);

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Upsert: if a pending invite exists for this email+company, reset it
  const [invite] = await db
    .insert(companyInvite)
    .values({
      companyId: input.companyId,
      invitedBy: input.invitedBy,
      email,
      token,
      expiresAt,
      redirectPath: input.redirectPath,
      assignmentContext,
    })
    .onConflictDoUpdate({
      target: [companyInvite.companyId, companyInvite.email],
      set: {
        token,
        expiresAt,
        invitedBy: input.invitedBy,
        status: "pending",
        acceptedBy: null,
        acceptedAt: null,
        redirectPath: input.redirectPath,
        assignmentContext,
      },
    })
    .returning({ id: companyInvite.id });
  if (!invite) throw new Error("company invite upsert returned no row");

  return { inviteId: invite.id, token, inviteUrl: `${getAppUrl()}/invite/${token}` };
}

/**
 * The invite this person accepted into this company, if any: who sent it and for which compliance
 * role. One row per company and address, so a later invite to the same address replaces it.
 */
export async function acceptedInviteOf(
  db: DbOrTx,
  input: { readonly companyId: string; readonly userId: string },
): Promise<{ readonly invitedBy: string; readonly role: RoleKey | null } | null> {
  const row = await db.query.companyInvite.findFirst({
    where: and(
      eq(companyInvite.companyId, input.companyId),
      eq(companyInvite.acceptedBy, input.userId),
      eq(companyInvite.status, "accepted"),
    ),
    columns: { invitedBy: true, assignmentContext: true },
  });
  return row
    ? { invitedBy: row.invitedBy, role: invitedRoleOf(row.assignmentContext) }
    : null;
}
