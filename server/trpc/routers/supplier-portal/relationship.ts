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
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { company, supplier } from "@/schema";
import {
  relationshipClausesUpdateSchema,
  supplierFacingRelationshipSchema,
  supplierInviteCustomerSchema,
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

  /** Add a single customer subscription. Idempotent on (supplier, email). */
  invite: accountProcedure
    .input(supplierInviteCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSupplierRole(ctx.db, ctx.companyId);
      await requireSupplierMailBudget("customerInvites", ctx.companyId);
      const email = input.customerEmail.toLowerCase();

      const existing = await findRelationshipId(ctx.db, ctx.companyId, email);
      if (existing) return existing;
      // Checked before the row exists: a row added past the cap would still
      // receive every incident notice this supplier publishes.
      await requireInboxBudget(ctx.companyId, email);
      await requireSupplierMailBudget("newRecipients", ctx.companyId);

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
            customerOrgName: input.customerOrgName ?? null,
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
        const raced = await findRelationshipId(ctx.db, ctx.companyId, email);
        if (!raced) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Relationship lookup failed after conflict",
          });
        }
        return raced;
      }

      // Fire-and-forget "you've been added" notification — only on first insert
      notifyCustomerAdded(ctx.companyId, email).catch((err) => {
        console.error("[supplier-portal] customer added email failed:", err);
      });
      // Only the id: the row carries the customer's access token, which is their credential and
      // never the supplier's to see (as in `get`).
      return { id: inserted.id };
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
