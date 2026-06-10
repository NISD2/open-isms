import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { auditLog, user } from "@/schema";

export const auditRouter = router({
  /** Paginated audit log list */
  list: protectedProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.companyId) return [];

      const conditions = [eq(auditLog.companyId, ctx.companyId)];
      if (input.entityType) {
        conditions.push(eq(auditLog.entityType, input.entityType));
      }
      if (input.entityId) {
        conditions.push(eq(auditLog.entityId, input.entityId));
      }

      const where = and(...conditions);

      const rows = await ctx.db.query.auditLog.findMany({
        where,
        orderBy: [desc(auditLog.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      // Batch load user names
      const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
      const users =
        userIds.length > 0
          ? await ctx.db.query.user.findMany({
              where: (u, { inArray }) => inArray(u.id, userIds),
              columns: { id: true, name: true },
            })
          : [];
      const userMap = new Map(users.map((u) => [u.id, u.name]));

      return rows.map((row) => ({
        ...row,
        userName: row.userId ? (userMap.get(row.userId) ?? "Unknown") : null,
      }));
    }),

  /** All audit entries for a specific entity */
  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.companyId) return [];
      return ctx.db.query.auditLog.findMany({
        where: and(
          eq(auditLog.companyId, ctx.companyId),
          eq(auditLog.entityType, input.entityType),
          eq(auditLog.entityId, input.entityId),
        ),
        orderBy: [desc(auditLog.createdAt)],
      });
    }),
});
