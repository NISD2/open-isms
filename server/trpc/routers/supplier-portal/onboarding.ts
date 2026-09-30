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

import { TRPCError } from "@trpc/server";
import { and, eq, gt, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { createBillingAccount } from "@/lib/billing/accounts";
import type { DbOrTx } from "@/lib/db";
import {
  joinCompany,
  listUserCompanies,
  signupDraftOf,
} from "@/lib/organization/membership";
import { company, supplier, supplierInvite, user } from "@/schema";
import {
  supplierAcceptInviteSchema,
  supplierOnboardingBootstrapSchema,
} from "@/schema/validators";
import { discardDraftCompany } from "../../helpers/setup-helpers";
import { protectedProcedure, router } from "../../init";
import { generateOpaqueToken } from "./helpers";

/**
 * Create a supplier company owned by the user and make them its admin.
 *
 * It takes over the billing account of the draft it replaces, when there is one, so that account
 * survives the draft being discarded afterwards. Sector is required by the schema but the supplier
 * portal is sector-agnostic, so it gets a placeholder; entityType likewise only matters if the
 * company later opts into the entity portal.
 */
const createSupplierCompany = async (
  tx: DbOrTx,
  input: {
    readonly userId: string;
    readonly name: string;
    readonly country: string | null;
    readonly replacesBillingAccountId: string | null;
  },
) => {
  const billingAccountId =
    input.replacesBillingAccountId ?? (await createBillingAccount(tx, input.userId));
  const [newCompany] = await tx
    .insert(company)
    .values({
      name: input.name,
      sector: "n/a",
      entityType: "important",
      country: input.country,
      actsAsNis2Entity: false,
      actsAsSupplier: true,
      // A supplier company is a real, activated org (no NIS2 assessment).
      activatedAt: new Date(),
      // The creator owns the org. Deleting the owner tears the org down.
      ownerId: input.userId,
      billingAccountId,
    })
    .returning();
  if (!newCompany) throw new Error("supplier company insert returned no row");
  await joinCompany(tx, {
    userId: input.userId,
    companyId: newCompany.id,
    role: "admin",
  });
  return newCompany;
};

/**
 * A supplier signup is for someone with no set-up organization yet, whichever one they have open.
 * Returns their signup draft, which the supplier company replaces, if they still have one.
 */
const draftReplacedBySupplierSignup = async (db: DbOrTx, userId: string) => {
  const mine = await listUserCompanies(db, userId);
  if (mine.some((c) => c.activatedAt !== null)) {
    throw new TRPCError({ code: "CONFLICT", message: "Already a member of a company" });
  }
  return signupDraftOf(mine, userId);
};

/**
 * Where each inviting customer is reached. Incident broadcasts and their access links are mailed to
 * `supplier.customerEmail`, and the supplier sees it as its customer. An invite records the inviting
 * company but not who at it sent the invite, so this is the company's contact address, or its
 * owner's when it has none.
 */
const customerContactEmails = async (
  tx: DbOrTx,
  customerCompanyIds: readonly string[],
): Promise<ReadonlyMap<string, string>> => {
  const rows = await tx
    .select({
      id: company.id,
      contactEmail: company.contactEmail,
      ownerEmail: user.email,
    })
    .from(company)
    .leftJoin(user, eq(user.id, company.ownerId))
    .where(inArray(company.id, [...customerCompanyIds]));
  return new Map(
    rows.flatMap((row) => {
      const email = row.contactEmail ?? row.ownerEmail;
      return email ? [[row.id, email.toLowerCase()] as const] : [];
    }),
  );
};

/**
 * Create the relationship one invite describes, then mark the invite accepted, so an accepted invite
 * always has its row. uq_supplier_portal_share allows one row per (supplier company, customer email):
 * a second inviting company reached at an address already bound collides, and its invite stays
 * pending rather than being accepted with no relationship. Returns whether the invite was bound.
 */
const bindInvite = async (
  tx: DbOrTx,
  input: {
    readonly inviteId: string;
    readonly supplierCompanyId: string;
    readonly supplierName: string;
    readonly customerCompanyId: string;
    readonly customerEmail: string | null;
  },
): Promise<boolean> => {
  const [row] = await tx
    .insert(supplier)
    .values({
      name: input.supplierName,
      supplierCompanyId: input.supplierCompanyId,
      customerCompanyId: input.customerCompanyId,
      customerEmail: input.customerEmail,
      status: "active" as const,
      unsubscribeToken: generateOpaqueToken(),
      source: "claim_token",
      confirmedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [supplier.supplierCompanyId, supplier.customerEmail],
    })
    .returning({ id: supplier.id });
  if (!row) return false;
  await tx
    .update(supplierInvite)
    .set({ acceptedAt: new Date(), acceptedByCompanyId: input.supplierCompanyId })
    .where(eq(supplierInvite.id, input.inviteId));
  return true;
};

export const supplierOnboardingRouter = router({
  /**
   * Bootstrap a supplier-only company and bind the calling user as admin.
   * Reject if the user already belongs to a company — same guard as the
   * entity-side createCompanyAndAssessment to prevent silent re-creation.
   */
  bootstrap: protectedProcedure
    .input(supplierOnboardingBootstrapSchema)
    .mutation(async ({ ctx, input }) => {
      const signupDraft = await draftReplacedBySupplierSignup(ctx.db, ctx.userId);

      // Insert the company. Sector is required by the schema (notNull) but the
      // supplier portal is sector-agnostic — set a placeholder. The supplier
      // can edit it later via the security profile if they ever flip into the
      // entity portal too. entityType is also required; default to "important"
      // since it's the most common NIS2 classification and only matters if the
      // company later opts into the entity portal.
      const result = await ctx.db.transaction((tx) =>
        createSupplierCompany(tx, {
          userId: ctx.userId,
          name: input.name,
          country: input.country ?? null,
          replacesBillingAccountId: signupDraft?.billingAccountId ?? null,
        }),
      );

      // Discard the abandoned entity-draft shell (+ its seeded NIS2 rows),
      // best-effort after the user points at the supplier company.
      if (signupDraft) {
        try {
          await discardDraftCompany(ctx.db, signupDraft.id);
        } catch (err) {
          console.error("[supplier.bootstrap] draft discard skipped:", err);
        }
      }

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
        columns: { email: true },
      });
      const signupDraft = await draftReplacedBySupplierSignup(ctx.db, ctx.userId);

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
        const newCompany = await createSupplierCompany(tx, {
          userId: ctx.userId,
          name: input.name,
          country: input.country ?? null,
          replacesBillingAccountId: signupDraft?.billingAccountId ?? null,
        });

        // Every customer that invited this address is bound in the same signup,
        // the clicked invite first so it is the one kept if two customers share
        // a contact address. uq_supplier_invite_pair allows one invite per
        // (customer, address), so no two of these describe the same relationship.
        const otherInvites = await tx.query.supplierInvite.findMany({
          where: and(
            eq(supplierInvite.toEmail, invite.toEmail),
            ne(supplierInvite.id, invite.id),
            isNull(supplierInvite.acceptedAt),
            gt(supplierInvite.expiresAt, new Date()),
          ),
        });
        const invites = [invite, ...otherInvites];
        const contacts = await customerContactEmails(
          tx,
          invites.map((pending) => pending.fromCompanyId),
        );

        const outcomes: { readonly inviteId: string; readonly bound: boolean }[] = [];
        for (const pending of invites) {
          const bound = await bindInvite(tx, {
            inviteId: pending.id,
            supplierCompanyId: newCompany.id,
            supplierName: input.name,
            customerCompanyId: pending.fromCompanyId,
            customerEmail: contacts.get(pending.fromCompanyId) ?? null,
          });
          outcomes.push({ inviteId: pending.id, bound });
        }

        return { companyId: newCompany.id, outcomes };
      });

      const unbound = result.outcomes.filter((o) => !o.bound).map((o) => o.inviteId);
      if (unbound.length > 0) {
        console.error(
          "[supplier.acceptInvite] invites left pending, their customer's contact address is already bound to this supplier:",
          unbound,
        );
      }

      // Discard the abandoned entity-draft shell (best-effort, post-commit).
      if (signupDraft) {
        try {
          await discardDraftCompany(ctx.db, signupDraft.id);
        } catch (err) {
          console.error("[supplier.acceptInvite] draft discard skipped:", err);
        }
      }

      return {
        companyId: result.companyId,
        boundEntities: result.outcomes.length - unbound.length,
        unboundInvites: unbound.length,
      };
    }),
});
