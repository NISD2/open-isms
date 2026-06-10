import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { user } from "@/schema";

/**
 * Dev-only router — guarded by NODE_ENV check.
 * Provides utilities for local development and testing.
 */
export const devRouter = router({
  /** Switch the current user's role (admin / member / reviewer) */
  switchRole: protectedProcedure
    .input(z.object({ role: z.enum(["admin", "member", "reviewer", "legal_reviewer"]) }))
    .mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV !== "development") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Dev only" });
      }

      await ctx.db
        .update(user)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(user.id, ctx.userId));

      return { role: input.role };
    }),
});
