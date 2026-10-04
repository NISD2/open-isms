/**
 * Entity-side supplier inventory router (post-C3 merge).
 *
 * The `supplier` table is now bilateral (see schema/tables/suppliers.ts), but
 * this router only exposes the entity-inventory subset of operations:
 * "what suppliers does THIS entity manage". Lists where customerCompanyId =
 * the caller's company. Writes set customerCompanyId = ctx.companyId.
 *
 * The supplier-portal-side operations (relationship.invite, public.getByToken,
 * etc.) live under server/trpc/routers/supplier-portal/ and write to the same
 * table from the supplier perspective via supplierCompanyId.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { PLATFORM_SOURCE } from "@/lib/supplier-portal/platform-source";
import { riskSupplier, supplier } from "@/schema";
import {
  customerSupplierAssessmentSchema,
  supplierInsertSchema,
  supplierLinkedUpdateSchema,
  supplierUpdateSchema,
} from "@/schema/validators";
import { companyProcedure, router } from "../init";
import { insertRow, updateRow } from "../typed";

const clearedAssessment = Object.fromEntries(
  Object.keys(customerSupplierAssessmentSchema.shape).map((column) => [column, null]),
);

export const supplierRouter = router({
  list: companyProcedure.query(async ({ ctx }) => {
    // Return all rows where the caller is the customer-side party. This
    // includes BOTH legacy free-text inventory rows (no token) AND
    // Direction-B rows where a supplier accepted our magic-link invite
    // (token set, supplierCompanyId set). Both are legitimate "my suppliers"
    // entries from the entity's perspective.
    //
    // Audit F-9 (2026-09-10): `unsubscribeToken` is excluded. Despite the
    // legacy column name it is the supplier portal's bearer credential —
    // 64 hex chars, and holding it grants the full customer view at
    // /supplier-access/{token} with no account. It is the caller's own
    // credential so this was never a cross-tenant leak, but a list payload
    // that renders name, risk level and status has no use for it, and every
    // other surface in the codebase already projects around this column
    // (schema/validators.ts omits it, mass-assignment.test.ts asserts it,
    // SuppliersPage hides it, export-demo-ordner projects it out).
    // The instance's own operator first (lib/supplier-portal/platform-supplier.ts), then newest.
    // `source` is mostly null, and a plain `=` would sort those nulls ahead of the operator.
    return ctx.db.query.supplier.findMany({
      where: eq(supplier.customerCompanyId, ctx.companyId),
      columns: { unsubscribeToken: false },
      orderBy: [
        desc(sql`${supplier.source} is not distinct from ${PLATFORM_SOURCE}`),
        desc(supplier.updatedAt),
      ],
    });
  }),

  create: companyProcedure
    .input(
      supplierInsertSchema.omit({
        id: true,
        customerCompanyId: true,
        supplierCompanyId: true,
        unsubscribeToken: true,
        status: true,
        confirmedAt: true,
        unsubscribedAt: true,
        createdAt: true,
        updatedAt: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const values = { ...input, customerCompanyId: ctx.companyId };
      const [row] = await ctx.db
        .insert(supplier)
        .values(insertRow(supplier, values))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "supplier", ctx.userId).catch(
        (err) => console.error("[background] supplier recheck:", err),
      );
      return row;
    }),

  update: companyProcedure
    .input(supplierUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const current = await ctx.db.query.supplier.findFirst({
        where: and(eq(supplier.id, id), eq(supplier.customerCompanyId, ctx.companyId)),
        columns: { supplierCompanyId: true },
      });
      // On a linked row the clause answers are the supplier's own statements,
      // shown to the customer as such. A link is never added to an existing
      // row, only removed, so reading it first cannot let a clause write slip
      // through.
      const writable = current?.supplierCompanyId
        ? supplierLinkedUpdateSchema.parse(data)
        : data;
      const updates = { ...writable, updatedAt: new Date() };
      const [row] = await ctx.db
        .update(supplier)
        .set(updateRow(supplier, updates))
        .where(and(eq(supplier.id, id), eq(supplier.customerCompanyId, ctx.companyId)))
        .returning();
      invalidateModuleSignOffs(ctx.db, ctx.companyId, "supplier", ctx.userId).catch(
        (err) => console.error("[background] supplier recheck:", err),
      );
      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const mine = and(
        eq(supplier.id, input.id),
        eq(supplier.customerCompanyId, ctx.companyId),
      );
      await ctx.db.transaction(async (tx) => {
        // Locked, so the branch taken below matches the row it writes.
        const [row] = await tx
          .select({ id: supplier.id, supplierCompanyId: supplier.supplierCompanyId })
          .from(supplier)
          .where(mine)
          .for("update");
        if (!row) return;

        // Our risks stay; only their links to this supplier go (risk_supplier
        // has no ON DELETE, so a linked risk used to fail the delete).
        // risk.linkSupplier only links a tenant's risk to that tenant's own
        // supplier row, so the row found above scopes these to us.
        await tx.delete(riskSupplier).where(eq(riskSupplier.supplierId, row.id));

        if (!row.supplierCompanyId) {
          await tx.delete(supplier).where(mine);
          return;
        }
        // A linked row is also the supplier's side of the relationship, and a
        // hard delete cascades into their asset offerings and the incident
        // broadcasts that prove they notified us. End it the way the supplier
        // does (revoked), drop it from our register by severing our side, as
        // erase-user does for the other party, and clear what we recorded.
        await tx
          .update(supplier)
          .set(
            updateRow(supplier, {
              ...clearedAssessment,
              customerCompanyId: null,
              status: "revoked" as const,
              unsubscribedAt: new Date(),
              updatedAt: new Date(),
            }),
          )
          .where(mine);
      });
      recheckModuleRequirements(ctx.db, ctx.companyId, "supplier", ctx.userId).catch(
        (err) => console.error("[background] supplier:", err),
      );
      return { deleted: true };
    }),
});
