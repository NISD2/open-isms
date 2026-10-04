/**
 * Supplier portal profile router — supplier-side security profile.
 *
 * The supplier portal data lives directly on the `company` table, behind the
 * `actsAsSupplier=true` flag. There is no parallel supplier_profile table —
 * a company can be both a NIS2 entity and a supplier without being two rows.
 * Same row, two perspectives, role flags decide which UI surfaces what.
 *
 * The router exposes a single `save` mutation that takes any subset of the
 * questionnaire's answers (`securityProfileUpdateSchema`); each questionnaire
 * page of /portal/supplier saves its own questions through it.
 *
 * Security: only the .pick()-ed fields may be patched here. The strict input
 * shape prevents mass-assignment to NIS2/billing/role-flag columns.
 * logoStorageKey is set via the dedicated `setLogo` mutation which validates
 * the S3 key prefix.
 */

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { QUESTIONNAIRE_COLUMNS } from "@/lib/forms/supplier-portal-sections";
import { rateLimit } from "@/lib/rate-limit";
import { companyUploadPrefixes, sanitizeFilename } from "@/lib/storage/object-key";
import { createPresignedPut } from "@/lib/storage/presign";
import { company } from "@/schema";
import { securityProfileUpdateSchema } from "@/schema/validators";
import { assertOwnObjectKey } from "../../guards";
import { accountProcedure, router } from "../../init";
import { updateRow } from "../../typed";

/** Where the logo upload URL puts a company's logos; the only keys setLogo accepts. */
const logoPrefix = companyUploadPrefixes.logos;

/**
 * Logo PUT URLs per company per hour. Same exposure as the certificate upload
 * (free tier, production bucket, no cleanup of unattached objects) at 5 MB each,
 * and a company has one logo.
 */
export const LOGO_UPLOADS_PER_HOUR = 10;

/**
 * The supplier portal's part of the company row, projected by `get`: the questionnaire's columns
 * (the same list the save schema picks) plus what the UI needs and the save endpoint must not
 * write: the row id, the role flag, the logo key (set through `setLogo`) and when it last saved.
 * The entity side of the row (billing, NIS 2 facts, contacts) never reaches the supplier portal.
 */
const SUPPLIER_PORTAL_COLUMNS = {
  ...QUESTIONNAIRE_COLUMNS,
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
   * itself is missing — which shouldn't happen for a `accountProcedure`.
   *
   * Profile and questionnaire are independently fillable: this query never
   * blocks on actsAsSupplier so the user can land on either tab first and
   * see an editable form. The role flag flips on the first save, and the
   * layout uses `actsAsSupplier` to drive the "Active / Not yet created"
   * badge.
   */
  get: accountProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.query.company.findFirst({
      where: eq(company.id, ctx.companyId),
      columns: SUPPLIER_PORTAL_COLUMNS,
    });
    return row ?? null;
  }),

  /**
   * Save any subset of the questionnaire's answers. A question left out stays as it is; one sent
   * as null is cleared. Per-customer contract clauses and per-asset technical declarations have
   * their own routers.
   *
   * Always flips actsAsSupplier=true (idempotent, the predicate for "has set anything up in the
   * supplier portal") and stamps practicesLastSavedAt for the "saved at" line. The input schema
   * picks only the questionnaire's columns, so no other column of the row can be written here,
   * and the result carries only what a caller needs back.
   */
  save: accountProcedure
    .input(securityProfileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(company)
        .set(
          updateRow(company, {
            ...input,
            actsAsSupplier: true,
            practicesLastSavedAt: new Date(),
            updatedAt: new Date(),
          }),
        )
        .where(eq(company.id, ctx.companyId))
        .returning({
          id: company.id,
          actsAsSupplier: company.actsAsSupplier,
          practicesLastSavedAt: company.practicesLastSavedAt,
        });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /** Get a presigned PUT URL for the logo upload. */
  logoUploadUrl: accountProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(500),
        // Raster only. SVG is a document: it carries <script>, and the store
        // serves it back with whatever type it was uploaded under, on an
        // origin the self-host Caddyfile makes a sibling of the app domain.
        // Audit F-4 pinned the content type on the other three upload paths
        // and this one was missed, because its regex looked like a guard
        // while admitting the one executable format in the list. Nothing
        // renders logoStorageKey today, so this closed a latent hole rather
        // than a live one.
        contentType: z
          .string()
          .min(1)
          .max(100)
          .regex(/^image\/(png|jpeg|jpg|webp)$/),
        fileSize: z
          .number()
          .int()
          .positive()
          .max(5 * 1024 * 1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !(await rateLimit(
          `upload:logo:${ctx.companyId}`,
          LOGO_UPLOADS_PER_HOUR,
          60 * 60_000,
        ))
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many uploads from your organization. Please try again later.",
        });
      }
      const safeName = sanitizeFilename(input.fileName);
      const key = `${logoPrefix(ctx.companyId)}logo-${Date.now()}-${safeName}`;
      const url = await createPresignedPut(key, input.contentType, input.fileSize);
      return { url, key };
    }),

  /**
   * Set the logo storage key after a successful upload.
   * Validates that the key belongs to the caller's S3 namespace — prevents a
   * supplier from cloning another supplier's logo by guessing keys.
   */
  setLogo: accountProcedure
    .input(z.object({ storageKey: z.string().min(1).max(500).nullable() }))
    .mutation(async ({ ctx, input }) => {
      assertOwnObjectKey(logoPrefix(ctx.companyId), input.storageKey);
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
