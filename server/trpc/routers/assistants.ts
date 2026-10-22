import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { bumpMcpKeyVersion } from "@/lib/mcp/key-version";
import { company, companyMembership } from "@/schema";
import { accountAdminProcedure, router } from "../init";

const SwitchInput = z.object({ allowed: z.boolean() });

/**
 * The company's two decisions about its people's AI assistants (lib/mcp), an admin's each, set in
 * Settings. Neither is on the key's list (lib/mcp/procedures.ts), so no assistant sets them.
 */
export const assistantsRouter = router({
  /**
   * Whether the company's people may connect their own AI assistants. Every assistant call reads
   * it; turning it off also ends every member's key and assistant sign-in and their reading of the
   * records, so turning it on again later revives neither.
   */
  setAllowed: accountAdminProcedure
    .input(SwitchInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(company)
        .set({
          assistantsAllowed: input.allowed,
          ...(input.allowed ? {} : { assistantsReadRecords: false }),
          updatedAt: new Date(),
        })
        .where(eq(company.id, ctx.companyId));
      if (!input.allowed) {
        const members = await ctx.db
          .select({ userId: companyMembership.userId })
          .from(companyMembership)
          .where(eq(companyMembership.companyId, ctx.companyId));
        await Promise.all(members.map((m) => bumpMcpKeyVersion(ctx.db, m.userId)));
      }
      logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "company.updated",
        entityType: "company",
        entityId: ctx.companyId,
        description: input.allowed
          ? "AI assistants allowed to connect"
          : "AI assistants turned off, every connection ended",
        newValue: { assistantsAllowed: input.allowed },
      });
      return { allowed: input.allowed };
    }),

  /**
   * Whether the assistants of people who may export may also read the company's records
   * (read_records, through assistantExportProcedure). A wider scope than the walkthrough, so the
   * admin's own instruction, given only while assistants are allowed: the update matches no row
   * otherwise. Every read checks it, so turning it off stops the next one.
   */
  setReadRecords: accountAdminProcedure
    .input(SwitchInput)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(company)
        .set({ assistantsReadRecords: input.allowed, updatedAt: new Date() })
        .where(
          input.allowed
            ? and(eq(company.id, ctx.companyId), eq(company.assistantsAllowed, true))
            : eq(company.id, ctx.companyId),
        )
        .returning({ id: company.id });
      if (updated.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Allow AI assistants for this company first.",
        });
      }
      logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "company.updated",
        entityType: "company",
        entityId: ctx.companyId,
        description: input.allowed
          ? "AI assistants may read the records"
          : "AI assistants may no longer read the records",
        newValue: { assistantsReadRecords: input.allowed },
      });
      return { allowed: input.allowed };
    }),
});
