import { desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { auditLog, company, companyMembership, user } from "@/schema";
import { platformAdminProcedure, router } from "../init";

/** How far back "active" looks: a rolling week, counted from now. */
export const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** The newest entries a person's page shows; their whole history can run to thousands. */
export const ACTIVITY_LIMIT = 500;

/**
 * Who used the platform lately, for the platform admin's "Active users" tab. Kept apart from
 * `platformAdmin`, whose file is over the size limit.
 */
export const platformAdminUsersRouter = router({
  /**
   * Everyone who signed in during the past seven days, the latest first. `lastLoginAt` moves once
   * per completed sign-in and never on the silent token refreshes (lib/auth/config.ts), so this
   * counts sign-ins, not open tabs. The company is the one the person last worked in.
   */
  active: platformAdminProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        companyName: company.name,
      })
      .from(user)
      .leftJoin(company, eq(user.companyId, company.id))
      .where(gte(user.lastLoginAt, new Date(Date.now() - ACTIVE_WINDOW_MS)))
      .orderBy(desc(user.lastLoginAt)),
  ),

  /**
   * One person, for the admin's user dialog: the account, every company they belong to, and what
   * they did, from the audit log, newest first. Only what each entry says happened: its stored
   * values and the IP address stay in the log. Null for an id that names nobody (erased).
   */
  detail: platformAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [person, memberships, activity] = await Promise.all([
        ctx.db.query.user.findFirst({
          where: eq(user.id, input.id),
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            emailVerifiedAt: true,
            lastLoginAt: true,
            loginCount: true,
            grandfatheredAt: true,
          },
        }),
        ctx.db
          .select({
            companyId: company.id,
            companyName: company.name,
            role: companyMembership.role,
            jobTitle: companyMembership.jobTitle,
            since: companyMembership.createdAt,
          })
          .from(companyMembership)
          .innerJoin(company, eq(company.id, companyMembership.companyId))
          .where(eq(companyMembership.userId, input.id))
          .orderBy(desc(companyMembership.createdAt)),
        ctx.db
          .select({
            id: auditLog.id,
            at: auditLog.createdAt,
            action: auditLog.action,
            entityType: auditLog.entityType,
            description: auditLog.description,
            companyName: company.name,
          })
          .from(auditLog)
          .leftJoin(company, eq(company.id, auditLog.companyId))
          .where(eq(auditLog.userId, input.id))
          .orderBy(desc(auditLog.createdAt))
          .limit(ACTIVITY_LIMIT),
      ]);
      return person ? { person, memberships, activity } : null;
    }),
});
