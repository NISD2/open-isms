/**
 * Supplier portal onboarding — supplier-only signup path.
 *
 * The supplier portal is a coequal entry point to the entity portal. A supplier
 * who is NOT a NIS2 entity (e.g. a 30-person consulting firm whose customer is
 * regulated) should be able to sign up and reach the security profile without
 * ever passing through the entity-side onboarding (which assumes NIS2 sectors,
 * CISO, BSI contact, etc.).
 *
 * This endpoint is the supplier-side mirror of assessment.createCompanyAndAssessment:
 *   - creates a company with actsAsSupplier=true, actsAsNis2Entity=false
 *   - binds the calling user as admin
 *   - DOES NOT create a NIS2 assessment, sectors, CISO, BSI registration
 *
 * The supplier can later flip actsAsNis2Entity=true if they ALSO want to use the
 * entity portal — that's a separate explicit action.
 */
import { eq, and, isNull, gt } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../init";
import { company, user, supplierInvite, supplier } from "@/schema";
import {
  supplierOnboardingBootstrapSchema,
  supplierAcceptInviteSchema,
} from "@/schema/validators";
import { generateOpaqueToken } from "./helpers";

export const supplierOnboardingRouter = router({
  /**
   * Bootstrap a supplier-only company and bind the calling user as admin.
   * Reject if the user already belongs to a company — same guard as the
   * entity-side createCompanyAndAssessment to prevent silent re-creation.
   */
  bootstrap: protectedProcedure
    .input(supplierOnboardingBootstrapSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { companyId: true },
      });
      if (current?.companyId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of a company",
        });
      }

      // Insert the company. Sector is required by the schema (notNull) but the
      // supplier portal is sector-agnostic — set a placeholder. The supplier
      // can edit it later via the security profile if they ever flip into the
      // entity portal too. entityType is also required; default to "important"
      // since it's the most common NIS2 classification and only matters if the
      // company later opts into the entity portal.
      const result = await ctx.db.transaction(async (tx) => {
        const [newCompany] = await tx
          .insert(company)
          .values({
            name: input.name,
            sector: "n/a",
            entityType: "important",
            country: input.country ?? null,
            actsAsNis2Entity: false,
            actsAsSupplier: true,
          })
          .returning();

        await tx
          .update(user)
          .set({
            companyId: newCompany.id,
            role: "admin",
            updatedAt: new Date(),
          })
          .where(eq(user.id, ctx.userId));

        return newCompany;
      });

      return { companyId: result.id };
    }),

  /**
   * Look up a pending invite by token. Public endpoint — used by the
   * /supplier-invite/[token] landing page to display the inviting entity's
   * name and pre-fill the supplier email before signup. The token is the
   * credential; if it's wrong/expired/accepted we return null and the page
   * shows a 404.
   */
  getInviteByToken: protectedProcedure
    .input(z.object({ token: z.string().length(64) }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.query.supplierInvite.findFirst({
        where: and(
          eq(supplierInvite.token, input.token),
          isNull(supplierInvite.acceptedAt),
          gt(supplierInvite.expiresAt, new Date()),
        ),
        columns: { id: true, fromCompanyId: true, toEmail: true, message: true },
      });
      if (!invite) return null;

      const fromCompany = await ctx.db.query.company.findFirst({
        where: eq(company.id, invite.fromCompanyId),
        columns: { name: true },
      });

      return {
        toEmail: invite.toEmail,
        fromCompanyName: fromCompany?.name ?? "A NIS2 entity",
        message: invite.message,
      };
    }),

  /**
   * Accept a magic-link invite from a NIS2 entity. Bootstraps a supplier-only
   * company AND auto-binds it to the inviting entity via supplier_relationship.
   *
   * Same guard as bootstrap: caller must not already belong to a company.
   * Token must be valid, unexpired, and not yet accepted. The signed-in user's
   * email MUST match the invite's `toEmail` — defense against an attacker
   * stealing a token and accepting it under a different identity.
   */
  acceptInvite: protectedProcedure
    .input(supplierAcceptInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { companyId: true, email: true },
      });
      if (current?.companyId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of a company",
        });
      }

      const invite = await ctx.db.query.supplierInvite.findFirst({
        where: and(
          eq(supplierInvite.token, input.token),
          isNull(supplierInvite.acceptedAt),
          gt(supplierInvite.expiresAt, new Date()),
        ),
      });
      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite is invalid, expired, or already accepted",
        });
      }

      // Identity binding: the signed-in user must match the invited email.
      // Without this, an attacker who somehow obtains the token (forwarded
      // email, log leak) could accept it under their own account.
      const callerEmail = current?.email?.toLowerCase();
      if (!callerEmail || callerEmail !== invite.toEmail.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This invite was sent to a different email address. Sign in with the invited email and try again.",
        });
      }

      const result = await ctx.db.transaction(async (tx) => {
        const [newCompany] = await tx
          .insert(company)
          .values({
            name: input.name,
            sector: "n/a",
            entityType: "important",
            country: input.country ?? null,
            actsAsNis2Entity: false,
            actsAsSupplier: true,
          })
          .returning();

        await tx
          .update(user)
          .set({
            companyId: newCompany.id,
            role: "admin",
            updatedAt: new Date(),
          })
          .where(eq(user.id, ctx.userId));

        // Mark the invite accepted (audit trail).
        await tx
          .update(supplierInvite)
          .set({
            acceptedAt: new Date(),
            acceptedByCompanyId: newCompany.id,
          })
          .where(eq(supplierInvite.id, invite.id));

        // Auto-bind the new supplier to the inviting entity by creating an
        // active row in the bilateral `supplier` table. This closes the
        // loop: the entity invited the supplier; once the supplier accepts,
        // the entity sees the relationship in their inventory immediately.
        await tx.insert(supplier).values({
          name: input.name,
          supplierCompanyId: newCompany.id,
          customerCompanyId: invite.fromCompanyId,
          customerEmail: callerEmail,
          status: "active" as const,
          unsubscribeToken: generateOpaqueToken(),
          source: "claim_token",
          confirmedAt: new Date(),
        });

        // Also accept any OTHER pending invites for the same email — if the
        // supplier was invited by multiple entities, they all auto-bind in
        // one signup. This is the killer feature.
        const otherInvites = await tx.query.supplierInvite.findMany({
          where: and(
            eq(supplierInvite.toEmail, invite.toEmail),
            isNull(supplierInvite.acceptedAt),
            gt(supplierInvite.expiresAt, new Date()),
          ),
        });

        for (const other of otherInvites) {
          await tx
            .update(supplierInvite)
            .set({
              acceptedAt: new Date(),
              acceptedByCompanyId: newCompany.id,
            })
            .where(eq(supplierInvite.id, other.id));

          await tx
            .insert(supplier)
            .values({
              name: input.name,
              supplierCompanyId: newCompany.id,
              customerCompanyId: other.fromCompanyId,
              customerEmail: callerEmail,
              status: "active" as const,
              unsubscribeToken: generateOpaqueToken(),
              source: "claim_token",
              confirmedAt: new Date(),
            })
            .onConflictDoNothing({
              target: [supplier.supplierCompanyId, supplier.customerEmail],
            });
        }

        return { companyId: newCompany.id, boundEntities: 1 + otherInvites.length };
      });

      return result;
    }),
});
