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
  supplierInviteCustomerSchema,
} from "@/schema/validators";
import { companyProcedure, router } from "../../init";
import { insertRow, updateRow } from "../../typed";
import { notifyCustomerAdded } from "./broadcast";
import { generateOpaqueToken } from "./helpers";

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

export const supplierRelationshipRouter = router({
  /** List all customers (supplier rows) where I'm the supplier-side party. */
  listMyCustomers: companyProcedure.query(async ({ ctx }) => {
    // Audit F-9 (2026-09-10): no `unsubscribeToken`. It is the bearer
    // credential for /supplier-access/{token}, one per customer, and this
    // list renders customer name and status. `invite` and `resend` build the
    // link from a targeted read, which is where the token belongs.
    return ctx.db.query.supplier.findMany({
      where: eq(supplier.supplierCompanyId, ctx.companyId),
      columns: { unsubscribeToken: false },
      orderBy: [desc(supplier.createdAt)],
    });
  }),

  /** Add a single customer subscription. Idempotent on (supplier, email). */
  invite: companyProcedure
    .input(supplierInviteCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSupplierRole(ctx.db, ctx.companyId);
      const email = input.customerEmail.toLowerCase();

      // Look up the supplier's own company name to use as the row's display name
      const me = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { name: true },
      });

      // Try to resolve customer email to a Sorzel tenant
      const matchingUser = await ctx.db.query.user.findFirst({
        where: (u, { eq, sql }) => eq(sql`lower(${u.email})`, email),
        columns: { companyId: true },
      });

      // Atomic upsert keyed on (supplierCompanyId, customerEmail)
      const [inserted] = await ctx.db
        .insert(supplier)
        .values(
          insertRow(supplier, {
            supplierCompanyId: ctx.companyId,
            customerCompanyId: matchingUser?.companyId ?? null,
            customerEmail: email,
            name: me?.name ?? "Supplier",
            customerOrgName: input.customerOrgName ?? null,
            status: "active" as const,
            unsubscribeToken: generateOpaqueToken(),
            source: input.source,
            confirmedAt: new Date(),
          }),
        )
        .onConflictDoNothing({
          target: [supplier.supplierCompanyId, supplier.customerEmail],
        })
        .returning();

      if (!inserted) {
        // Already existed — return the existing row, do NOT re-notify.
        const existing = await ctx.db.query.supplier.findFirst({
          where: and(
            eq(supplier.supplierCompanyId, ctx.companyId),
            eq(supplier.customerEmail, email),
          ),
        });
        if (!existing) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Relationship lookup failed after conflict",
          });
        }
        return existing;
      }

      // Fire-and-forget "you've been added" notification — only on first insert
      notifyCustomerAdded(ctx.companyId, email).catch((err) => {
        console.error("[supplier-portal] customer added email failed:", err);
      });
      return inserted;
    }),

  /**
   * Get a single relationship — returns the supplier row INCLUDING
   * per-customer contract clauses, but not the access token (audit F-9): the
   * detail view renders clauses and SLA, and the token is a credential.
   */
  get: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.id),
          eq(supplier.supplierCompanyId, ctx.companyId),
        ),
        columns: { unsubscribeToken: false },
      });
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
  updateClauses: companyProcedure
    .input(relationshipClausesUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...clauses } = input;
      const [row] = await ctx.db
        .update(supplier)
        .set(updateRow(supplier, { ...clauses, updatedAt: new Date() }))
        .where(and(eq(supplier.id, id), eq(supplier.supplierCompanyId, ctx.companyId)))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /** Remove (soft-revoke) a customer relationship. */
  remove: companyProcedure
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
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});
