import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  getDefaultPolicyConfig,
  POLICY_TYPES,
} from "@/lib/compliance/policy-config-defaults";
import { POLICY_CONFIG_SCHEMAS } from "@/lib/compliance/policy-config-schemas";
import { seedLocale } from "@/lib/compliance/seed-locale";
import { companyPolicyConfig } from "@/schema";
import { companyProcedure, router } from "../init";

const policyTypeSchema = z.enum(POLICY_TYPES);

export const policyConfigRouter = router({
  get: companyProcedure
    .input(z.object({ policyType: policyTypeSchema }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.query.companyPolicyConfig.findFirst({
        where: and(
          eq(companyPolicyConfig.companyId, ctx.companyId),
          eq(companyPolicyConfig.policyType, input.policyType),
        ),
      });
      if (existing) return existing;

      // Lazy-init with defaults, in the account's language
      const defaults = getDefaultPolicyConfig(
        input.policyType,
        await seedLocale(ctx.db, ctx.userId, ctx.companyId),
      );
      const [row] = await ctx.db
        .insert(companyPolicyConfig)
        .values({
          companyId: ctx.companyId,
          policyType: input.policyType,
          config: defaults,
        })
        .onConflictDoNothing()
        .returning();

      if (!row) {
        return ctx.db.query.companyPolicyConfig.findFirst({
          where: and(
            eq(companyPolicyConfig.companyId, ctx.companyId),
            eq(companyPolicyConfig.policyType, input.policyType),
          ),
        });
      }
      return row;
    }),

  update: companyProcedure
    .input(
      z.object({
        policyType: policyTypeSchema,
        config: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate config against the type-specific schema
      const validator = POLICY_CONFIG_SCHEMAS[input.policyType];
      const parsed = validator.parse(input.config);

      const [row] = await ctx.db
        .update(companyPolicyConfig)
        .set({ config: parsed, updatedAt: new Date() })
        .where(
          and(
            eq(companyPolicyConfig.companyId, ctx.companyId),
            eq(companyPolicyConfig.policyType, input.policyType),
          ),
        )
        .returning();

      return row;
    }),
});
