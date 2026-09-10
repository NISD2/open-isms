/**
 * Company certification router — file-first attestation uploads.
 *
 * Cert PDFs live in S3 (presigned PUT for upload, presigned GET with 1h TTL
 * for public profile downloads). Metadata (validUntil, type, scope) lives
 * in the company_certification table for indexing. Used by the supplier portal
 * today; reusable by the entity portal in the future.
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "@/lib/storage/limits";
import { sanitizeFilename } from "@/lib/storage/object-key";
import { createPresignedPut } from "@/lib/storage/presign";
import { companyCertification } from "@/schema";
import { companyCertificationCreateSchema } from "@/schema/validators";
import { companyProcedure, router } from "../../init";
import { insertRow } from "../../typed";

export const companyCertificationRouter = router({
  /** List all certifications I own. */
  list: companyProcedure.query(async ({ ctx }) => {
    return ctx.db.query.companyCertification.findMany({
      where: eq(companyCertification.companyId, ctx.companyId),
      orderBy: [desc(companyCertification.validUntil)],
    });
  }),

  /** Create a new cert (file already uploaded via uploadUrl). */
  create: companyProcedure
    .input(companyCertificationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Defense-in-depth: prevent a supplier from referencing another
      // supplier's S3 object by guessing/leaking storage keys.
      const expectedPrefix = `supplier-certifications/${ctx.companyId}/`;
      if (!input.storageKey.startsWith(expectedPrefix)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Storage key does not belong to this company",
        });
      }
      const [row] = await ctx.db
        .insert(companyCertification)
        .values(
          insertRow(companyCertification, {
            companyId: ctx.companyId,
            ...input,
            validFrom: input.validFrom ?? null,
            scope: input.scope ?? null,
            auditor: input.auditor ?? null,
            typeOther: input.typeOther ?? null,
            fileName: input.fileName ?? null,
            fileSize: input.fileSize ?? null,
            contentHash: input.contentHash ?? null,
            status: "active",
          }),
        )
        .returning();
      return row;
    }),

  /** Delete a cert (does not delete the S3 object — that's a separate cleanup). */
  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(companyCertification)
        .where(
          and(
            eq(companyCertification.id, input.id),
            eq(companyCertification.companyId, ctx.companyId),
          ),
        )
        .returning({ id: companyCertification.id });
      if (result.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { deleted: true };
    }),

  /** Presigned PUT URL for uploading a new cert PDF. */
  uploadUrl: companyProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(500),
        contentType: z
          .string()
          .min(1)
          .max(100)
          .regex(/^application\/pdf$/, "PDF only"),
        fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const safeName = sanitizeFilename(input.fileName);
      const key = `supplier-certifications/${ctx.companyId}/${Date.now()}-${safeName}`;
      const url = await createPresignedPut(key, input.contentType, input.fileSize);
      return { url, key };
    }),
});
