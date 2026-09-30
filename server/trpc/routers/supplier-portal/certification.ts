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
import { rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES } from "@/lib/storage/limits";
import { companyUploadPrefixes, sanitizeFilename } from "@/lib/storage/object-key";
import { createPresignedPut, deleteObject } from "@/lib/storage/presign";
import { removeReleasedObject } from "@/lib/storage/released-object";
import { companyCertification } from "@/schema";
import { companyCertificationCreateSchema } from "@/schema/validators";
import { assertOwnObjectKey } from "../../guards";
import { accountProcedure, router } from "../../init";
import { insertRow } from "../../typed";

/**
 * Presigned PUTs per company per hour. Each one lets the holder write up to
 * MAX_UPLOAD_BYTES into the production bucket, any company can ask (the
 * supplier portal sits on the free tier), and an object never attached to a
 * certification is neither recorded nor cleaned up. So the count of URLs is the
 * only brake on what lands in the bucket. A supplier uploads a handful of
 * certificates, retries included.
 */
export const CERT_UPLOADS_PER_HOUR = 10;

/** Where uploadUrl puts a company's certificates; the only keys a certification may hold. */
const certificationPrefix = companyUploadPrefixes.certifications;

export const companyCertificationRouter = router({
  /** List all certifications I own. */
  list: accountProcedure.query(async ({ ctx }) => {
    return ctx.db.query.companyCertification.findMany({
      where: eq(companyCertification.companyId, ctx.companyId),
      orderBy: [desc(companyCertification.validUntil)],
    });
  }),

  /** Create a new cert (file already uploaded via uploadUrl). */
  create: accountProcedure
    .input(companyCertificationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Defense-in-depth: prevent a supplier from referencing another
      // supplier's S3 object by guessing/leaking storage keys.
      assertOwnObjectKey(certificationPrefix(ctx.companyId), input.storageKey);
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

  /** Delete a cert, and its PDF once no other certification points at it. */
  delete: accountProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [removed] = await ctx.db
        .delete(companyCertification)
        .where(
          and(
            eq(companyCertification.id, input.id),
            eq(companyCertification.companyId, ctx.companyId),
          ),
        )
        .returning({ storageKey: companyCertification.storageKey });
      if (!removed) throw new TRPCError({ code: "NOT_FOUND" });
      await removeReleasedObject({
        key: removed.storageKey,
        prefix: certificationPrefix(ctx.companyId),
        stillReferenced: async (key) =>
          (await ctx.db.query.companyCertification.findFirst({
            where: and(
              eq(companyCertification.companyId, ctx.companyId),
              eq(companyCertification.storageKey, key),
            ),
            columns: { id: true },
          })) !== undefined,
        remove: deleteObject,
        record: `company_certification ${input.id}`,
      });
      return { deleted: true };
    }),

  /** Presigned PUT URL for uploading a new cert PDF. */
  uploadUrl: accountProcedure
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
      if (
        !rateLimit(
          `upload:certification:${ctx.companyId}`,
          CERT_UPLOADS_PER_HOUR,
          60 * 60_000,
        )
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many uploads from your organization. Please try again later.",
        });
      }
      const safeName = sanitizeFilename(input.fileName);
      const key = `${certificationPrefix(ctx.companyId)}${Date.now()}-${safeName}`;
      const url = await createPresignedPut(key, input.contentType, input.fileSize);
      return { url, key };
    }),
});
