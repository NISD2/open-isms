import { desc, eq, gte } from "drizzle-orm";
import { company, user } from "@/schema";
import { platformAdminProcedure, router } from "../init";

/** How far back "active" looks: a rolling week, counted from now. */
export const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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
});
