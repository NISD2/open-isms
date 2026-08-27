import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { router, publicProcedure } from "../init";
import { requirementCategory, requirement } from "@/schema";

export const requirementRouter = router({
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const req = await ctx.db.query.requirement.findFirst({
        where: eq(requirement.code, input.code),
        with: {
          category: {
            columns: {
              id: true,
              code: true,
              slug: true,
              // Curated source links for the citation block. Without these the
              // UI has to guess a URL from the citation text, which lands the
              // reader in the wrong law.
              referenceUrl: true,
              nationalUrl: true,
            },
            with: {
              framework: { columns: { code: true, isActive: true } },
            },
          },
        },
      });
      // These are publicProcedures keyed on a bare code / slug, so a bookmark,
      // a digest-email link or a hand-typed URL reaches them directly. Without
      // this gate /compliance/gdpr-toms/DSGVO-3.1 renders a complete, fully
      // translated GDPR requirement page for a product that only sells NIS 2.
      // Gating on isActive rather than on code === "nis2" keeps one switch:
      // the same flag the sidebar and /compliance already read.
      if (!req || !req.category.framework.isActive) return null;
      return req;
    }),

  listByCategorySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.requirementCategory.findFirst({
        where: eq(requirementCategory.slug, input.slug),
        with: {
          framework: {
            columns: { code: true, codePrefix: true, sidebarLabel: true, isActive: true },
          },
        },
      });
      if (!category || !category.framework.isActive) {
        return { category: null, requirements: [] };
      }

      const requirements = await ctx.db.query.requirement.findMany({
        where: eq(requirement.categoryId, category.id),
        orderBy: asc(requirement.sortOrder),
      });

      return { category, requirements };
    }),
});
