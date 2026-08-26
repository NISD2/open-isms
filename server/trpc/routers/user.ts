import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { user } from "@/schema";
import { userUpdateSchema } from "@/schema/validators";
import { HINTS, HINT_COLUMN } from "@/lib/onboarding/hints";

export const userRouter = router({
  /**
   * Self-service display-name update. Signup only seeds `user.name` (email
   * local part for credentials signups, OAuth profile snapshot for Google)
   * and nothing ever syncs it afterwards, so this mutation is the one place
   * a user can correct the name that prints on their training certificate.
   */
  updateName: protectedProcedure
    .input(userUpdateSchema.pick({ name: true }).required())
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      if (!name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Name cannot be empty",
        });
      }

      await ctx.db
        .update(user)
        .set({ name, updatedAt: new Date() })
        .where(eq(user.id, ctx.userId));

      return { name };
    }),

  /**
   * Retire a one-time onboarding surface for the calling user.
   *
   * Scoped to `ctx.userId` and nothing else: the hint name is the only input,
   * so there is no id a caller could point at somebody else's row. Idempotent
   * — a second call just restamps a column that is already gating the surface
   * off.
   */
  dismissHint: protectedProcedure
    .input(z.object({ hint: z.enum(HINTS) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await ctx.db
        .update(user)
        .set({ [HINT_COLUMN[input.hint]]: now })
        .where(eq(user.id, ctx.userId));

      return { hint: input.hint };
    }),
});
