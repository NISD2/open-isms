/**
 * Supplier portal profile router — supplier-side security profile.
 *
 * The supplier portal data lives directly on the `company` table, behind the
 * `actsAsSupplier=true` flag. There is no parallel supplier_profile table —
 * a company can be both a NIS2 entity and a supplier without being two rows.
 * Same row, two perspectives, role flags decide which UI surfaces what.
 *
 * The router exposes a single `save` mutation that takes any subset of the
 * unified `securityProfileUpdateSchema` (profile metadata + questionnaire +
 * branch technicals + ENISA TIG §5 TIPS). The form on /portal/supplier is
 * one big SchemaForm that calls `save` whenever the user clicks Save.
 *
 * Security: only the .pick()-ed fields may be patched here. The strict input
 * shape prevents mass-assignment to NIS2/billing/role-flag columns.
 * logoStorageKey is set via the dedicated `setLogo` mutation which validates
 * the S3 key prefix.
 */
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, companyProcedure } from "../../init";
import { updateRow } from "../../typed";
import { company } from "@/schema";
import { securityProfileUpdateSchema } from "@/schema/validators";
import { normalizeDomain } from "./helpers";
import { createPresignedPut } from "@/lib/storage/presign";

/** Strip any path-traversal characters from a filename before using it in an S3 key. */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

/**
 * Shape of the supplier-portal subset of the company row, projected by `get`.
 * Kept narrow on purpose — the entity-side columns (cisoName, billing,
 * stripeCustomerId, etc.) never reach the supplier portal UI even though
 * they live on the same row.
 *
 * Per-asset technicals (SaaS hosting, on-prem SBOM, managed PAM, etc.) live
 * on the `asset` table now, scoped per-customer-relationship. Per-customer
 * contract clauses (right-to-audit, exit plan, etc.) live on the `supplier`
 * table. Both have their own routers — this query is purely company-level.
 */
/**
 * Single source of truth for "which company columns belong to the supplier
 * portal": the Zod `securityProfileUpdateSchema` shape, which is itself a
 * `.pick({...})` of the drizzle-zod-derived `companyInsertSchema`.
 *
 * Anything outside that pick (NIS 2 entity-side fields, billing, FKs) cannot
 * leak through this query, and any supplier-portal column added to the pick
 * is automatically projected here — no second list to keep in sync.
 *
 * Plus a small set of columns the UI needs that are intentionally NOT in the
 * update schema (cannot be mass-assigned via the save endpoint): row id,
 * actsAsSupplier role flag, logoStorageKey (set via dedicated mutation),
 * practicesLastSavedAt timestamp.
 */
const SUPPLIER_PORTAL_COLUMNS = {
  ...(Object.fromEntries(
    Object.keys(securityProfileUpdateSchema.shape).map((k) => [k, true]),
  ) as { [K in keyof typeof securityProfileUpdateSchema.shape]: true }),
  id: true,
  actsAsSupplier: true,
  logoStorageKey: true,
  practicesLastSavedAt: true,
} as const;

export const supplierProfileRouter = router({
  /**
   * Get my supplier portal data. Always returns the supplier-portal subset
   * of the company row (with `actsAsSupplier` so the UI knows whether the
   * company has saved anything yet). Returns null only if the company row
   * itself is missing — which shouldn't happen for a `companyProcedure`.
   *
   * Profile and questionnaire are independently fillable: this query never
   * blocks on actsAsSupplier so the user can land on either tab first and
   * see an editable form. The role flag flips on the first save, and the
   * layout uses `actsAsSupplier` to drive the "Active / Not yet created"
   * badge.
   */
  get: companyProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.query.company.findFirst({
      where: eq(company.id, ctx.companyId),
      columns: SUPPLIER_PORTAL_COLUMNS,
    });
    return row ?? null;
  }),

  /**
   * Save any subset of the company-level security profile.
   *
   * Covers profile metadata (identity, contacts) AND universal company
   * practices (ISMS, ISO27001, baseline NIS2 Art 21(2) — i.e. the renamed
   * "Security practices" page). Per-customer contract clauses and per-asset
   * technical declarations have their own dedicated routers.
   *
   * Always:
   *   - flips actsAsSupplier=true (idempotent — the predicate for "has set
   *     anything up at all in the supplier portal")
   *   - normalizes primaryDomain if provided
   *   - stamps practicesLastSavedAt to drive the "saved at" indicator
   *
   * The strict .pick() input schema prevents mass-assignment to actsAsSupplier
   * (overridden server-side anyway), actsAsNis2Entity, plan, stripeCustomerId,
   * cisoName, etc.
   */
  save: companyProcedure
    .input(securityProfileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const normalizedDomain =
        input.primaryDomain != null
          ? normalizeDomain(input.primaryDomain)
          : undefined;

      const [row] = await ctx.db
        .update(company)
        .set(
          updateRow(company, {
            ...input,
            primaryDomain: normalizedDomain,
            actsAsSupplier: true,
            practicesLastSavedAt: new Date(),
            updatedAt: new Date(),
          }),
        )
        .where(eq(company.id, ctx.companyId))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /** Get a presigned PUT URL for the logo upload. */
  logoUploadUrl: companyProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(500),
        contentType: z
          .string()
          .min(1)
          .max(100)
          .regex(/^image\/(png|jpeg|jpg|webp|svg\+xml)$/),
        fileSize: z.number().int().positive().max(5 * 1024 * 1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const safeName = sanitizeFilename(input.fileName);
      const key = `supplier-profile/${ctx.companyId}/logo-${Date.now()}-${safeName}`;
      const url = await createPresignedPut(key, input.contentType, input.fileSize);
      return { url, key };
    }),

  /**
   * Set the logo storage key after a successful upload.
   * Validates that the key belongs to the caller's S3 namespace — prevents a
   * supplier from cloning another supplier's logo by guessing keys.
   */
  setLogo: companyProcedure
    .input(z.object({ storageKey: z.string().min(1).max(500).nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (input.storageKey !== null) {
        const expectedPrefix = `supplier-profile/${ctx.companyId}/`;
        if (!input.storageKey.startsWith(expectedPrefix)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Storage key does not belong to this company",
          });
        }
      }
      const [row] = await ctx.db
        .update(company)
        .set({
          logoStorageKey: input.storageKey,
          updatedAt: new Date(),
        })
        .where(eq(company.id, ctx.companyId))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});
