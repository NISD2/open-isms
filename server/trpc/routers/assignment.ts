import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure, adminProcedure } from "../init";
import {
  categoryAssignment,
  companyRequirementStatus,
  requirementAssignment,
  user,
  company,
  requirementCategory,
  requirement,
  notification,
} from "@/schema";
import { verifyAssessmentOwnership, verifyStatusOwnership } from "../guards";
import {
  sendMail,
  categoryAssignedEmail,
  categoryUnassignedEmail,
} from "@/lib/mail";
import { logAudit } from "@/lib/audit";
import { getAppUrl } from "@/lib/utils";

export const assignmentRouter = router({
  /** List all category owners for an assessment */
  list: companyProcedure
    .input(z.object({ assessmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      return ctx.db.query.categoryAssignment.findMany({
        where: eq(categoryAssignment.assessmentId, input.assessmentId),
        with: {
          user: { columns: { id: true, name: true, email: true } },
          category: { columns: { id: true, code: true, slug: true } },
        },
      });
    }),

  /** List users in the same company (for assignment dropdown) */
  listAssignableUsers: companyProcedure.query(async ({ ctx }) => {
    return ctx.db.query.user.findMany({
      where: eq(user.companyId, ctx.companyId),
      columns: { id: true, name: true, email: true, role: true, jobTitle: true },
    });
  }),

  /** Assign a user as category owner (replaces previous owner) */
  assign: adminProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        categoryId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      // Verify the target user belongs to this company
      const member = await ctx.db.query.user.findFirst({
        where: and(eq(user.id, input.userId), eq(user.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found in your company" });
      }

      // Upsert: replaces previous owner for this category
      const [row] = await ctx.db
        .insert(categoryAssignment)
        .values({
          assessmentId: input.assessmentId,
          categoryId: input.categoryId,
          userId: input.userId,
          assignedBy: ctx.userId,
        })
        .onConflictDoUpdate({
          target: [categoryAssignment.assessmentId, categoryAssignment.categoryId],
          set: {
            userId: input.userId,
            assignedBy: ctx.userId,
            assignedAt: new Date(),
          },
        })
        .returning();

      if (row) {
        // Fire-and-forget email notification
        const [assignee, category, companyRow] = await Promise.all([
          ctx.db.query.user.findFirst({
            where: eq(user.id, input.userId),
            columns: { name: true, email: true },
          }),
          ctx.db.query.requirementCategory.findFirst({
            where: eq(requirementCategory.id, input.categoryId),
            columns: { code: true, slug: true },
          }),
          ctx.db.query.company.findFirst({
            where: eq(company.id, ctx.companyId),
            columns: { name: true },
          }),
        ]);

        if (assignee && category) {
          const categoriesEn = (await import("@/messages/compliance/en.json")).default.compliance.categories;
          const catName = categoriesEn[category.code as keyof typeof categoriesEn]?.name ?? category.code;

          sendMail({
            to: assignee.email,
            ...categoryAssignedEmail({
              assigneeName: assignee.name,
              categoryName: catName,
              categoryCode: category.code,
              companyName: companyRow?.name ?? "your company",
              assignerName: ctx.session.user.name ?? "Your admin",
              categoryUrl: `${getAppUrl()}/compliance/${category.slug}`,
            }),
          }).then((r) => {
            if (r.success) {
              logAudit({
                companyId: ctx.companyId,
                userId: ctx.userId,
                action: "email.assignment_assigned",
                entityType: "email",
                entityId: r.id ?? null,
                description: `Assignment email sent to ${assignee.email} for ${category.code}`,
              });
            }
          });
        }
      }

      return row ?? null;
    }),

  /** Remove a category owner (admin only) */
  unassign: adminProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        categoryId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const [deleted] = await ctx.db
        .delete(categoryAssignment)
        .where(
          and(
            eq(categoryAssignment.assessmentId, input.assessmentId),
            eq(categoryAssignment.categoryId, input.categoryId),
            eq(categoryAssignment.userId, input.userId),
          )
        )
        .returning();

      if (deleted) {
        // Cancel pending notifications for this user in the category
        const reqIds = await ctx.db.query.requirement
          .findMany({
            where: eq(requirement.categoryId, input.categoryId),
            columns: { id: true },
          })
          .then((rows) => rows.map((r) => r.id));

        if (reqIds.length > 0) {
          await ctx.db
            .update(notification)
            .set({ status: "cancelled" })
            .where(
              and(
                eq(notification.recipientId, input.userId),
                eq(notification.companyId, ctx.companyId),
                inArray(notification.entityId, reqIds),
                eq(notification.entityType, "requirement"),
                inArray(notification.status, ["pending", "sent"]),
              ),
            );
        }

        // Fire-and-forget email notification
        const [assignee, category, companyRow] = await Promise.all([
          ctx.db.query.user.findFirst({
            where: eq(user.id, input.userId),
            columns: { name: true, email: true },
          }),
          ctx.db.query.requirementCategory.findFirst({
            where: eq(requirementCategory.id, input.categoryId),
            columns: { code: true },
          }),
          ctx.db.query.company.findFirst({
            where: eq(company.id, ctx.companyId),
            columns: { name: true },
          }),
        ]);

        if (assignee && category) {
          const categoriesEn = (await import("@/messages/compliance/en.json")).default.compliance.categories;
          const catName = categoriesEn[category.code as keyof typeof categoriesEn]?.name ?? category.code;

          sendMail({
            to: assignee.email,
            ...categoryUnassignedEmail({
              assigneeName: assignee.name,
              categoryName: catName,
              categoryCode: category.code,
              companyName: companyRow?.name ?? "your company",
            }),
          }).then((r) => {
            if (r.success) {
              logAudit({
                companyId: ctx.companyId,
                userId: ctx.userId,
                action: "email.assignment_unassigned",
                entityType: "email",
                entityId: r.id ?? null,
                description: `Unassignment email sent to ${assignee.email} for ${category.code}`,
              });
            }
          });
        }
      }

      return { deleted: !!deleted };
    }),

  /** Assign a user to a specific requirement (adds to junction table) */
  assignRequirement: adminProcedure
    .input(
      z.object({
        statusId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.query.user.findFirst({
        where: and(eq(user.id, input.userId), eq(user.companyId, ctx.companyId)),
        columns: { id: true },
      });
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found in your company" });
      }

      await verifyStatusOwnership(ctx.db, input.statusId, ctx.companyId);

      const [row] = await ctx.db
        .insert(requirementAssignment)
        .values({
          statusId: input.statusId,
          userId: input.userId,
          assignedBy: ctx.userId,
        })
        .onConflictDoNothing()
        .returning();

      return row ?? null;
    }),

  /** Unassign a user from a specific requirement */
  unassignRequirement: adminProcedure
    .input(z.object({ statusId: z.string().uuid(), userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyStatusOwnership(ctx.db, input.statusId, ctx.companyId);

      await ctx.db
        .delete(requirementAssignment)
        .where(
          and(
            eq(requirementAssignment.statusId, input.statusId),
            eq(requirementAssignment.userId, input.userId),
          )
        );

      return { removed: true };
    }),

  /** List all assignment rows for a requirement status */
  getRequirementAssignments: companyProcedure
    .input(z.object({ statusId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyStatusOwnership(ctx.db, input.statusId, ctx.companyId);

      return ctx.db.query.requirementAssignment.findMany({
        where: eq(requirementAssignment.statusId, input.statusId),
        with: {
          user: { columns: { id: true, name: true, email: true, jobTitle: true } },
        },
      });
    }),

  /** List assignments by assessment + requirement — single JOIN, no sequential lookups */
  getAssignmentsByRequirement: companyProcedure
    .input(z.object({ assessmentId: z.string().uuid(), requirementId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyAssessmentOwnership(ctx.db, input.assessmentId, ctx.companyId);

      const rows = await ctx.db
        .select({
          id: requirementAssignment.id,
          userId: requirementAssignment.userId,
          signedOffAt: requirementAssignment.signedOffAt,
          userName: user.name,
          userEmail: user.email,
          userJobTitle: user.jobTitle,
        })
        .from(requirementAssignment)
        .innerJoin(
          companyRequirementStatus,
          eq(requirementAssignment.statusId, companyRequirementStatus.id),
        )
        .innerJoin(user, eq(requirementAssignment.userId, user.id))
        .where(
          and(
            eq(companyRequirementStatus.assessmentId, input.assessmentId),
            eq(companyRequirementStatus.requirementId, input.requirementId),
          ),
        );

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        signedOffAt: r.signedOffAt,
        user: { id: r.userId, name: r.userName, email: r.userEmail, jobTitle: r.userJobTitle },
      }));
    }),
});
