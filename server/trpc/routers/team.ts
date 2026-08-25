import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../init";
import {
  user,
  company,
  companyInvite,
  categoryAssignment,
  companyAssessment,
  requirementCategory,
  notification,
} from "@/schema";
import { sendMail, inviteEmail, memberRemovedEmail } from "@/lib/mail";
import { logAudit } from "@/lib/audit";
import { getAppUrl } from "@/lib/utils";
import { ALL_ROLE_KEYS } from "@/lib/compliance/role-mapping";
import { resolveRoleAssignments } from "../helpers/resolve-role-assignments";
import { discardDraftCompany } from "../helpers/setup-helpers";
import { verifyAssessmentOwnership } from "../guards";
import { getNis2AssessmentIds } from "../helpers/nis2-scope";

const INVITE_EXPIRY_DAYS = 7;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export const teamRouter = router({
  /** List members of the current company with their category assignments */
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) return [];

    const members = await ctx.db.query.user.findMany({
      where: eq(user.companyId, ctx.companyId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        createdAt: true,
      },
    });

    // Category-level assignments, NIS 2 only: the /team page listed member
    // assignments carrying DSGVO / AI-Act / CRA category codes otherwise.
    const assessmentIds = await getNis2AssessmentIds(ctx.db, ctx.companyId);

    if (assessmentIds.length === 0) {
      return members.map((m) => ({ ...m, assignments: [] as Array<{ categoryCode: string; categoryName: string }> }));
    }

    const assignments = await ctx.db.query.categoryAssignment.findMany({
      where: inArray(categoryAssignment.assessmentId, assessmentIds),
      columns: { userId: true },
      with: {
        category: { columns: { code: true } },
      },
    });

    // Group by userId → unique categories
    const byUser = new Map<string, Map<string, { categoryCode: string }>>();
    for (const a of assignments) {
      if (!byUser.has(a.userId)) byUser.set(a.userId, new Map());
      const cats = byUser.get(a.userId) ?? new Map();
      if (!cats.has(a.category.code)) {
        cats.set(a.category.code, { categoryCode: a.category.code });
      }
    }

    return members.map((m) => ({
      ...m,
      assignments: [...(byUser.get(m.id)?.values() ?? [])],
    }));
  }),

  /** List pending invites for the current company (admin only) */
  listInvites: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.companyInvite.findMany({
      where: and(
        eq(companyInvite.companyId, ctx.companyId),
        eq(companyInvite.status, "pending"),
      ),
      orderBy: desc(companyInvite.createdAt),
    });
  }),

  /** Create an invite link (admin only) */
  invite: adminProcedure
    .input(z.object({
      email: z.string().email(),
      redirectPath: z.string().max(500).optional(),
      /** Compliance role to auto-assign categories on accept */
      complianceRole: z.enum(ALL_ROLE_KEYS).optional(),
      /** When inviting from assignment popover, auto-assign on accept */
      assignmentContext: z.object({
        assessmentId: z.string().uuid(),
        categoryId: z.string().uuid(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();

      // Check if user with this email already exists
      const existing = await ctx.db.query.user.findFirst({
        where: eq(user.email, email),
        columns: { id: true, companyId: true },
      });
      const existingCompany = existing?.companyId
        ? await ctx.db.query.company.findFirst({
            where: eq(company.id, existing.companyId),
            columns: { activatedAt: true },
          })
        : null;

      if (existing?.companyId === ctx.companyId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This person is already a member of your company.",
        });
      }

      // Block only if they already belong to a DIFFERENT, ACTIVATED company. A
      // draft shell (auto-provisioned, never activated) is discarded when they
      // accept, so inviting a draft-only user is legitimate.
      if (
        existing?.companyId &&
        existing.companyId !== ctx.companyId &&
        existingCompany?.activatedAt
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This email is already associated with another organization.",
        });
      }

      // Audit H-1 (2026-06-10): the single-format assignmentContext flows
      // into a `(assessmentId, categoryId)` upsert at accept time. Without
      // an ownership check, an admin in tenant A could supply tenant B's
      // (assessmentId, categoryId) pair and overwrite tenant B's
      // category_assignment row, locking the legitimate owner out of
      // enforceAssignment + sign-off. Verify ownership at the issue site
      // so the bad input never reaches the DB. applyAssignmentContext
      // re-checks at accept time as defense in depth.
      if (input.assignmentContext) {
        await verifyAssessmentOwnership(
          ctx.db,
          input.assignmentContext.assessmentId,
          ctx.companyId,
        );
      }

      // Resolve compliance role → assignment context
      let resolvedAssignment: Record<string, unknown> | null =
        input.assignmentContext ?? null;

      if (input.complianceRole) {
        const rows = await resolveRoleAssignments(
          ctx.db,
          ctx.companyId,
          input.complianceRole,
          ctx.userId,
        );
        if (rows.length > 0) {
          resolvedAssignment = {
            roleKeys: [input.complianceRole],
            categoryIds: rows.map((r) => r.categoryId),
          };
        }
      }

      const token = generateToken();
      const expiresAt = new Date(
        Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      );

      // Upsert: if a pending invite exists for this email+company, reset it
      const [invite] = await ctx.db
        .insert(companyInvite)
        .values({
          companyId: ctx.companyId,
          invitedBy: ctx.userId,
          email,
          token,
          expiresAt,
          redirectPath: input.redirectPath ?? null,
          assignmentContext: resolvedAssignment,
        })
        .onConflictDoUpdate({
          target: [companyInvite.companyId, companyInvite.email],
          set: {
            token,
            expiresAt,
            invitedBy: ctx.userId,
            status: "pending",
            acceptedBy: null,
            acceptedAt: null,
            redirectPath: input.redirectPath ?? null,
            assignmentContext: resolvedAssignment,
          },
        })
        .returning();

      const inviteUrl = `${getAppUrl()}/invite/${token}`;

      // Send invite email (fire-and-forget)
      const companyRow = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { name: true },
      });
      const inviterName = ctx.session.user.name ?? "Your team admin";
      const emailRole = input.complianceRole ?? "member";

      sendMail({
        to: email,
        ...inviteEmail({
          companyName: companyRow?.name ?? "your company",
          inviterName,
          inviteUrl,
          role: emailRole,
        }),
      }).then((r) => {
        if (r.success) {
          logAudit({
            companyId: ctx.companyId,
            userId: ctx.userId,
            action: "email.invite_sent",
            entityType: "email",
            entityId: r.id ?? null,
            description: `Invite email sent to ${email}`,
          });
        }
      });

      return { inviteId: invite.id, token, inviteUrl };
    }),

  /** Look up an invite by token (for the accept page) */
  getByToken: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.query.companyInvite.findFirst({
        where: eq(companyInvite.token, input.token),
        with: {
          company: { columns: { id: true, name: true } },
        },
      });

      if (!invite) return null;

      return {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        companyName: invite.company.name,
        companyId: invite.companyId,
      };
    }),

  /** Accept an invite (any authenticated user) */
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.query.companyInvite.findFirst({
        where: and(
          eq(companyInvite.token, input.token),
          eq(companyInvite.status, "pending"),
        ),
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found or already used.",
        });
      }

      if (invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has expired.",
        });
      }

      // Email must match
      const userEmail = ctx.session.user.email?.toLowerCase();
      if (userEmail !== invite.email.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite was sent to a different email address.",
        });
      }

      // The user must not already belong to an ACTIVATED company. Every verified
      // user auto-gets a draft shell, so accepting an invite is legitimate for a
      // draft-only user: their draft is discarded and they move into the
      // inviting company. Only a real (activated) membership blocks the accept.
      const currentCompany = ctx.companyId
        ? await ctx.db.query.company.findFirst({
            where: eq(company.id, ctx.companyId),
            columns: { id: true, activatedAt: true },
          })
        : null;
      if (currentCompany?.activatedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of a company.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        // Move the user onto the inviting company first, clearing the draft's
        // user FK before the draft shell is discarded.
        await tx
          .update(user)
          .set({
            companyId: invite.companyId,
            role: invite.role,
            updatedAt: new Date(),
          })
          .where(eq(user.id, ctx.userId));

        await tx
          .update(companyInvite)
          .set({
            status: "accepted",
            acceptedBy: ctx.userId,
            acceptedAt: new Date(),
          })
          .where(eq(companyInvite.id, invite.id));
      });

      // Discard the now-abandoned draft shell (best-effort, post-commit, its own
      // transaction). An impure draft is left orphaned rather than failing the
      // accept the user already completed above.
      if (currentCompany) {
        try {
          await discardDraftCompany(ctx.db, currentCompany.id);
        } catch (err) {
          console.error("[team.acceptInvite] draft discard skipped:", err);
        }
      }

      // Auto-assign based on the invite's assignment context
      if (invite.assignmentContext) {
        await applyAssignmentContext(
          ctx.db,
          invite.assignmentContext,
          invite.companyId,
          ctx.userId,
          invite.invitedBy,
        );
      }

      return { companyId: invite.companyId };
    }),

  /** Revoke a pending invite (admin only) */
  revokeInvite: adminProcedure
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(companyInvite)
        .set({ status: "revoked" })
        .where(
          and(
            eq(companyInvite.id, input.inviteId),
            eq(companyInvite.companyId, ctx.companyId),
            eq(companyInvite.status, "pending"),
          ),
        )
        .returning();

      return { revoked: !!updated };
    }),

  /** Remove a member from the company (admin only) */
  removeMember: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself.",
        });
      }

      // Verify user belongs to this company
      const member = await ctx.db.query.user.findFirst({
        where: and(
          eq(user.id, input.userId),
          eq(user.companyId, ctx.companyId),
        ),
      });
      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in your company.",
        });
      }

      // Delete category assignments for this user in company assessments
      const assessments = await ctx.db.query.companyAssessment.findMany({
        where: eq(companyAssessment.companyId, ctx.companyId),
        columns: { id: true },
      });
      const assessmentIds = assessments.map((a) => a.id);

      if (assessmentIds.length > 0) {
        await ctx.db
          .delete(categoryAssignment)
          .where(
            and(
              eq(categoryAssignment.userId, input.userId),
              inArray(categoryAssignment.assessmentId, assessmentIds),
            ),
          );
      }

      // Cancel pending notifications for the removed user in this company
      await ctx.db
        .update(notification)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(notification.recipientId, input.userId),
            eq(notification.companyId, ctx.companyId),
            inArray(notification.status, ["pending", "sent"]),
          ),
        );

      // Unlink user from company
      await ctx.db
        .update(user)
        .set({ companyId: null, role: "member", updatedAt: new Date() })
        .where(eq(user.id, input.userId));

      // Notify removed member (fire-and-forget)
      const companyRow = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { name: true },
      });

      sendMail({
        to: member.email,
        ...memberRemovedEmail({
          companyName: companyRow?.name ?? "your company",
          memberName: member.name,
        }),
      }).then((r) => {
        if (r.success) {
          logAudit({
            companyId: ctx.companyId,
            userId: ctx.userId,
            action: "email.member_removed",
            entityType: "email",
            entityId: r.id ?? null,
            description: `Removal email sent to ${member.email}`,
          });
        }
      });

      return { removed: true };
    }),

  /** Assign a compliance role to an existing member (admin only) */
  assignRole: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      roleKey: z.enum(ALL_ROLE_KEYS),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to this company
      const member = await ctx.db.query.user.findFirst({
        where: and(
          eq(user.id, input.userId),
          eq(user.companyId, ctx.companyId),
        ),
      });
      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in your company.",
        });
      }

      // Set the user's jobTitle to the compliance role
      await ctx.db
        .update(user)
        .set({ jobTitle: input.roleKey, updatedAt: new Date() })
        .where(eq(user.id, input.userId));

      const rows = await resolveRoleAssignments(
        ctx.db,
        ctx.companyId,
        input.roleKey,
        ctx.userId,
      );

      if (rows.length === 0) {
        return { assigned: 0 };
      }

      const values = rows.map((r) => ({
        assessmentId: r.assessmentId,
        categoryId: r.categoryId,
        userId: input.userId,
        assignedBy: r.assignedBy,
      }));

      const result = await ctx.db
        .insert(categoryAssignment)
        .values(values)
        .onConflictDoNothing();

      return { assigned: result.rowCount ?? values.length };
    }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const batchAssignmentSchema = z.object({
  roleKeys: z.array(z.string()),
  categoryIds: z.array(z.string().uuid()),
});

const singleAssignmentSchema = z.object({
  assessmentId: z.string().uuid(),
  categoryId: z.string().uuid(),
});

async function applyAssignmentContext(
  db: import("@/lib/db").Database,
  raw: unknown,
  companyId: string,
  userId: string,
  assignedBy: string,
) {
  // Try batch format: { roleKeys, categoryIds }
  const batch = batchAssignmentSchema.safeParse(raw);
  if (batch.success) {
    const categories = await db.query.requirementCategory.findMany({
      where: inArray(requirementCategory.id, batch.data.categoryIds),
      columns: { id: true, frameworkId: true },
    });

    const assessments = await db.query.companyAssessment.findMany({
      where: eq(companyAssessment.companyId, companyId),
      columns: { id: true, frameworkId: true },
    });
    const fwToAssessment = new Map(assessments.map((a) => [a.frameworkId, a.id]));

    const values = categories.flatMap((cat) => {
      const assessmentId = fwToAssessment.get(cat.frameworkId);
      if (!assessmentId) return [];
      return [{ assessmentId, categoryId: cat.id, userId, assignedBy }];
    });

    for (const val of values) {
      await db
        .insert(categoryAssignment)
        .values(val)
        .onConflictDoUpdate({
          target: [categoryAssignment.assessmentId, categoryAssignment.categoryId],
          set: { userId: val.userId, assignedBy: val.assignedBy, assignedAt: new Date() },
        });
    }
    return;
  }

  // Try single format: { assessmentId, categoryId }
  const single = singleAssignmentSchema.safeParse(raw);
  if (single.success) {
    // Audit H-1 (2026-06-10) defense in depth: re-verify the assessment
    // still belongs to the inviting company. If the invite was poisoned
    // (or the assessment was deleted/reassigned between issue and
    // accept), skip silently rather than rewrite another tenant's row.
    // The `(assessmentId, categoryId)` unique index is global, so an
    // unchecked upsert here is a cross-tenant write primitive.
    const owningAssessment = await db.query.companyAssessment.findFirst({
      where: eq(companyAssessment.id, single.data.assessmentId),
      columns: { id: true, companyId: true, frameworkId: true },
    });
    if (!owningAssessment || owningAssessment.companyId !== companyId) {
      return;
    }
    // The category must belong to the same framework as the assessment,
    // otherwise the pair is internally inconsistent (audit LOW).
    const owningCategory = await db.query.requirementCategory.findFirst({
      where: and(
        eq(requirementCategory.id, single.data.categoryId),
        eq(requirementCategory.frameworkId, owningAssessment.frameworkId),
      ),
      columns: { id: true },
    });
    if (!owningCategory) {
      return;
    }

    await db
      .insert(categoryAssignment)
      .values({
        assessmentId: single.data.assessmentId,
        categoryId: single.data.categoryId,
        userId,
        assignedBy,
      })
      .onConflictDoUpdate({
        target: [categoryAssignment.assessmentId, categoryAssignment.categoryId],
        set: { userId, assignedBy, assignedAt: new Date() },
      });
  }
}
