import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { user } from "@/schema";
import { userUpdateSchema } from "@/schema/validators";

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
});
