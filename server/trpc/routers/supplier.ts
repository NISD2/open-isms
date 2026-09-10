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

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  invalidateModuleSignOffs,
  recheckModuleRequirements,
} from "@/lib/compliance/module-recheck";
import { supplier } from "@/schema";
import { supplierInsertSchema, supplierUpdateSchema } from "@/schema/validators";
import { companyProcedure, router } from "../init";
import { insertRow, updateRow } from "../typed";

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
    return ctx.db.query.supplier.findMany({
      where: eq(supplier.customerCompanyId, ctx.companyId),
      columns: { unsubscribeToken: false },
      orderBy: [desc(supplier.updatedAt)],
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
      const updates = { ...data, updatedAt: new Date() };
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
      await ctx.db
        .delete(supplier)
        .where(
          and(eq(supplier.id, input.id), eq(supplier.customerCompanyId, ctx.companyId)),
        );
      recheckModuleRequirements(ctx.db, ctx.companyId, "supplier", ctx.userId).catch(
        (err) => console.error("[background] supplier:", err),
      );
      return { deleted: true };
    }),
});
