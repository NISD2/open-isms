import { and, desc, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { auditLog } from "@/schema";
import { reviewerProcedure, router } from "../init";

/**
 * Router keys (server/trpc/router.ts) whose procedures are the platform operator's. Their automatic
 * rows carry the key as entity_type. Before those procedures moved to the platform audit scope, the
 * rows were filed under the operator's own open company with inputs naming other customers, and the
 * log is append-only, so tenant reads leave them out instead.
 */
const PLATFORM_ROUTER_KEYS = ["platformAdmin", "newsletter"] as const;

const tenantRows = (companyId: string) => [
  eq(auditLog.companyId, companyId),
  notInArray(auditLog.entityType, [...PLATFORM_ROUTER_KEYS]),
];

// Reviewer tier: each row carries the raw input of a mutation anywhere in the
// company, wider than what a member scoped to assigned categories can open.
export const auditRouter = router({
  /** Paginated audit log list */
  list: reviewerProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        ...tenantRows(ctx.companyId),
        input.entityType ? eq(auditLog.entityType, input.entityType) : undefined,
        input.entityId ? eq(auditLog.entityId, input.entityId) : undefined,
      );

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
  getByEntity: reviewerProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.auditLog.findMany({
        where: and(
          ...tenantRows(ctx.companyId),
          eq(auditLog.entityType, input.entityType),
          eq(auditLog.entityId, input.entityId),
        ),
        orderBy: [desc(auditLog.createdAt)],
      });
    }),
});
