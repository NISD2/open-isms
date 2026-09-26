import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { journeyIndex } from "@/lib/compliance/journey-position";
import { requirement, requirementCategory } from "@/schema";
import { publicProcedure, router } from "../init";

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

  /**
   * The requirement immediately before and after this one, across the whole
   * framework rather than within its category.
   *
   * The detail page used to derive prev/next from the current category's
   * status rows alone, so the last requirement of every category (9.3, for
   * one) had no Next button and the reader had to go back to the journey
   * board to find 10.1. Neighbours span categories here for that reason, and
   * each carries its slug so the caller can build the link without a second
   * lookup.
   *
   * Ordering is the journey order from `journeyIndex`: prerequisites first,
   * then urgency, then process. The same order the journey board, the digest
   * and the activation nudge use, so all of them move together.
   */
  getAdjacent: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const current = await ctx.db.query.requirement.findFirst({
        where: eq(requirement.code, input.code),
        columns: { id: true, sortOrder: true },
        with: {
          category: {
            columns: { frameworkId: true, sortOrder: true },
            with: { framework: { columns: { isActive: true } } },
          },
        },
      });
      // Same gate as getByCode: an inactive framework is not navigable.
      if (!current || !current.category.framework.isActive) {
        return { prev: null, next: null };
      }

      const siblings = await ctx.db
        .select({
          code: requirement.code,
          categorySlug: requirementCategory.slug,
          categoryCode: requirementCategory.code,
        })
        .from(requirement)
        .innerJoin(
          requirementCategory,
          eq(requirement.categoryId, requirementCategory.id),
        )
        .where(eq(requirementCategory.frameworkId, current.category.frameworkId))
        .orderBy(asc(requirementCategory.sortOrder), asc(requirement.sortOrder));

      // Journey order, not process order. This is the prev/next a person walks, and it used to
      // run 1.1, 1.2, 1.3 while the map beside it showed urgency first and the prerequisites were
      // ignored by both. One sort key for every surface, so they cannot disagree again. The sort is
      // stable, so codes the journey does not know (every other framework) keep process order.
      siblings.sort((a, b) => journeyIndex(a.code) - journeyIndex(b.code) || 0);

      const idx = siblings.findIndex((r) => r.code === input.code);
      if (idx === -1) return { prev: null, next: null };

      return {
        prev: siblings[idx - 1] ?? null,
        next: siblings[idx + 1] ?? null,
      };
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
