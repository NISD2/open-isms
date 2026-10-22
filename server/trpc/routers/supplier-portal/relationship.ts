/**
 * Supplier-side customer relationship router (post-C3 merge).
 *
 * The bilateral `supplier` table is the source of truth. The supplier portal
 * "list my customers" is the same table as the entity portal "list my
 * suppliers" — just queried from the OTHER side (supplierCompanyId vs
 * customerCompanyId).
 *
 * Rows owned by THIS supplier are identified by supplierCompanyId = ctx.companyId.
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { company, supplier, user } from "@/schema";
import {
  supplierInviteCustomerSchema,
  supplierSetContactSchema,
} from "@/schema/supplier-contact-validators";
import {
  relationshipClausesUpdateSchema,
  supplierFacingRelationshipSchema,
} from "@/schema/validators";
import {
  requireInboxBudget,
  requireSupplierMailBudget,
} from "../../helpers/supplier-mail-budget";
import { accountProcedure, router } from "../../init";
import { insertRow, pickColumns, updateRow } from "../../typed";
import { notifyCustomerAdded } from "./broadcast";
import { withCustomerAddress } from "./customer-contact";
import { generateOpaqueToken } from "./helpers";
import { bindInvites, pendingInvitesTo } from "./invite-binding";

/**
 * The only shape a supplier row leaves this router in. The same row is the
 * customer's register entry, carrying their assessment of this supplier and
 * the customer's access token, neither of which is the supplier's to read.
 */
const supplierFacingColumns = pickColumns(
  supplier,
  supplierFacingRelationshipSchema.shape,
);

/**
 * Guard: only companies that have opted into the supplier portal
 * (actsAsSupplier=true) may invite customers.
 */
async function requireSupplierRole(
  db: typeof import("@/lib/db").db,
  companyId: string,
): Promise<void> {
  const row = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { actsAsSupplier: true },
  });
  if (!row?.actsAsSupplier) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Create a supplier profile before inviting customers.",
    });
  }
}

/** The address the caller signed in with, lowercased; null if the account has none. */
async function signedInEmail(
  db: typeof import("@/lib/db").db,
  userId: string,
): Promise<string | null> {
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { email: true },
  });
  return row?.email?.toLowerCase() ?? null;
}

async function findRelationshipId(
  db: typeof import("@/lib/db").db,
  supplierCompanyId: string,
  customerEmail: string,
): Promise<{ id: string } | undefined> {
  return db.query.supplier.findFirst({
    where: and(
      eq(supplier.supplierCompanyId, supplierCompanyId),
      eq(supplier.customerEmail, customerEmail),
    ),
    columns: { id: true },
  });
}

/** A customer added without an email, found again by the company name it was added under. */
async function findUnaddressedRelationshipId(
  db: typeof import("@/lib/db").db,
  supplierCompanyId: string,
  orgName: string | null,
): Promise<{ id: string } | undefined> {
  if (!orgName) return undefined;
  return db.query.supplier.findFirst({
    where: and(
      eq(supplier.supplierCompanyId, supplierCompanyId),
      isNull(supplier.customerEmail),
      isNull(supplier.customerCompanyId),
      eq(supplier.customerOrgName, orgName),
    ),
    columns: { id: true },
  });
}

/**
 * A customer linked to an account of its own is reached at the address it keeps there and cannot
 * be given another by its supplier.
 */
function requireUnlinked(rel: { readonly customerCompanyId: string | null }): void {
  if (rel.customerCompanyId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "This customer has its own account and is reached at the address it keeps there.",
    });
  }
}

/** The mail with the link to the security profile; best effort, the row is what counts. */
function mailAccessLink(supplierCompanyId: string, email: string): void {
  notifyCustomerAdded(supplierCompanyId, email).catch((err) => {
    console.error("[supplier-portal] customer added email failed:", err);
  });
}

export const supplierRelationshipRouter = router({
  /** List all customers (supplier rows) where I'm the supplier-side party. */
  listMyCustomers: accountProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ ...supplierFacingColumns, customerCompanyId: supplier.customerCompanyId })
      .from(supplier)
      .where(eq(supplier.supplierCompanyId, ctx.companyId))
      .orderBy(desc(supplier.createdAt));
    return withCustomerAddress(ctx.db, rows);
  }),

  /**
   * How many customers have invited the signed-in address and are not bound to this company yet.
   * A query, so the portal layout can ask on every page without writing an audit row; it only
   * calls `bindInvitedCustomers` when this is above zero.
   */
  pendingInvitedCount: accountProcedure.query(async ({ ctx }) => {
    const email = await signedInEmail(ctx.db, ctx.userId);
    if (!email) return 0;
    return (await pendingInvitesTo(ctx.db, email, ctx.companyId)).length;
  }),

  /**
   * Bind the customers that invited the signed-in address to this company, so they appear in
   * "Customers" without the supplier having to invite them back. A customer's invite exists from the
   * moment it sends it; before this, only a brand-new account could claim one (onboarding.acceptInvite),
   * so a company that already existed under the invited address never saw its customer.
   *
   * The credential is the signed-in address, as in acceptInvite. Safe to call repeatedly.
   */
  bindInvitedCustomers: accountProcedure.mutation(async ({ ctx }) => {
    const [email, me] = await Promise.all([
      signedInEmail(ctx.db, ctx.userId),
      ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { name: true },
      }),
    ]);
    if (!email) return { bound: 0, left: 0 };
    const invites = await pendingInvitesTo(ctx.db, email, ctx.companyId);
    if (invites.length === 0) return { bound: 0, left: 0 };
    const outcomes = await ctx.db.transaction((tx) =>
      bindInvites(tx, {
        invites,
        supplierCompanyId: ctx.companyId,
        supplierName: me?.name ?? "Supplier",
      }),
    );
    const bound = outcomes.filter((o) => o.bound).length;
    return { bound, left: outcomes.length - bound };
  }),

  /**
   * Add a customer. Idempotent on (supplier, email), or on (supplier, company name) when no email
   * is given: then nothing is mailed and the supplier adds the email later (`setContact`).
   */
  invite: accountProcedure
    .input(supplierInviteCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSupplierRole(ctx.db, ctx.companyId);
      await requireSupplierMailBudget("customerInvites", ctx.companyId);
      const email = input.customerEmail?.toLowerCase() ?? null;
      const orgName = input.customerOrgName?.trim() || null;
      if (!email && !orgName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Give the customer's company name or an email address.",
        });
      }

      const existing = email
        ? await findRelationshipId(ctx.db, ctx.companyId, email)
        : await findUnaddressedRelationshipId(ctx.db, ctx.companyId, orgName);
      if (existing) return existing;
      if (email) {
        // Checked before the row exists: a row added past the cap would still
        // receive every incident notice this supplier publishes.
        await requireInboxBudget(ctx.companyId, email);
        await requireSupplierMailBudget("newRecipients", ctx.companyId);
      }

      // Look up the supplier's own company name to use as the row's display name
      const me = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { name: true },
      });

      // The row is never linked to a customer organization from the email alone: that would let
      // any supplier place itself in any tenant's supplier inventory, and learn which tenant an
      // address belongs to. The customer reaches it through the emailed token link; a link into
      // their inventory is made only by the token flow they start (onboarding.acceptInvite).
      const [inserted] = await ctx.db
        .insert(supplier)
        .values(
          insertRow(supplier, {
            supplierCompanyId: ctx.companyId,
            customerCompanyId: null,
            customerEmail: email,
            name: me?.name ?? "Supplier",
            customerOrgName: orgName,
            status: "active" as const,
            unsubscribeToken: generateOpaqueToken(),
            // A supplier's own invite, always: the other sources are set by their own flows.
            source: "manual",
            confirmedAt: new Date(),
          }),
        )
        .onConflictDoNothing({
          target: [supplier.supplierCompanyId, supplier.customerEmail],
        })
        .returning();

      if (!inserted) {
        // A concurrent call added the same address first: return its row, do NOT re-notify.
        const raced = email
          ? await findRelationshipId(ctx.db, ctx.companyId, email)
          : undefined;
        if (!raced) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Relationship lookup failed after conflict",
          });
        }
        return raced;
      }

      // Fire-and-forget "you've been added" notification — only on first insert
      if (email) mailAccessLink(ctx.companyId, email);
      // Only the id: the row carries the customer's access token, which is their credential and
      // never the supplier's to see (as in `get`).
      return { id: inserted.id };
    }),

  /**
   * Set the address a customer's security contact is reached at: add it to a customer that has
   * none, or replace the one it has. The access link goes to the new address and the old link
   * stops working, so the previous person loses access. The same address again sends the link once
   * more. A customer with an account of its own is reached at the address it keeps there, so its
   * row is not edited here.
   */
  setContact: accountProcedure
    .input(supplierSetContactSchema)
    .mutation(async ({ ctx, input }) => {
      const email = input.customerEmail.toLowerCase();
      const rel = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.id),
          eq(supplier.supplierCompanyId, ctx.companyId),
        ),
        columns: { id: true, customerCompanyId: true, customerEmail: true, status: true },
      });
      if (!rel || rel.status === "revoked") throw new TRPCError({ code: "NOT_FOUND" });
      requireUnlinked(rel);

      const resend = rel.customerEmail === email;
      if (!resend && (await findRelationshipId(ctx.db, ctx.companyId, email))) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a customer with this email address.",
        });
      }
      await requireSupplierMailBudget("customerInvites", ctx.companyId);
      await requireInboxBudget(ctx.companyId, email);
      if (!resend) await requireSupplierMailBudget("newRecipients", ctx.companyId);

      if (!resend) {
        const [row] = await ctx.db
          .update(supplier)
          .set(
            updateRow(supplier, {
              customerEmail: email,
              // A new token: the link the previous contact holds stops working.
              unsubscribeToken: generateOpaqueToken(),
              status: "active" as const,
              unsubscribedAt: null,
              confirmedAt: new Date(),
              updatedAt: new Date(),
            }),
          )
          .where(
            and(
              eq(supplier.id, rel.id),
              eq(supplier.supplierCompanyId, ctx.companyId),
              isNull(supplier.customerCompanyId),
            ),
          )
          .returning({ id: supplier.id });
        if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      }
      mailAccessLink(ctx.companyId, email);
      return { id: rel.id };
    }),

  /**
   * Take the contact's access away but keep the customer: the address is cleared and the link
   * stops working, so nothing is mailed to it any more. Needs a company name on the row, or the
   * customer would be left with no name at all.
   */
  removeContact: accountProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const rel = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.id),
          eq(supplier.supplierCompanyId, ctx.companyId),
        ),
        columns: {
          id: true,
          customerCompanyId: true,
          customerOrgName: true,
          status: true,
        },
      });
      if (!rel || rel.status === "revoked") throw new TRPCError({ code: "NOT_FOUND" });
      requireUnlinked(rel);
      if (!rel.customerOrgName?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Give this customer a company name before removing its email, or remove the customer.",
        });
      }
      const [row] = await ctx.db
        .update(supplier)
        .set(
          updateRow(supplier, {
            customerEmail: null,
            unsubscribeToken: generateOpaqueToken(),
            updatedAt: new Date(),
          }),
        )
        .where(
          and(
            eq(supplier.id, rel.id),
            eq(supplier.supplierCompanyId, ctx.companyId),
            isNull(supplier.customerCompanyId),
          ),
        )
        .returning({ id: supplier.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /** Get a single relationship, with the per-customer contract clauses. */
  get: accountProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          ...supplierFacingColumns,
          customerCompanyId: supplier.customerCompanyId,
        })
        .from(supplier)
        .where(
          and(eq(supplier.id, input.id), eq(supplier.supplierCompanyId, ctx.companyId)),
        )
        .limit(1);
      const [row] = await withCustomerAddress(ctx.db, rows);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /**
   * Update the per-customer contract clauses on a relationship row.
   *
   * Strict pick from supplierInsertSchema (relationshipClausesUpdateSchema)
   * so the supplier portal can never mass-assign supplierCompanyId,
   * customerCompanyId, customerEmail, status, unsubscribeToken, or any of
   * the entity-side classification columns from this endpoint.
   */
  updateClauses: accountProcedure
    .input(relationshipClausesUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...clauses } = input;
      const [row] = await ctx.db
        .update(supplier)
        .set(updateRow(supplier, { ...clauses, updatedAt: new Date() }))
        .where(and(eq(supplier.id, id), eq(supplier.supplierCompanyId, ctx.companyId)))
        .returning(supplierFacingColumns);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /** Remove (soft-revoke) a customer relationship. */
  remove: accountProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(supplier)
        .set(
          updateRow(supplier, {
            status: "revoked" as const,
            unsubscribedAt: new Date(),
          }),
        )
        .where(
          and(eq(supplier.id, input.id), eq(supplier.supplierCompanyId, ctx.companyId)),
        )
        .returning({ id: supplier.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});
