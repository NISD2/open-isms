/**
 * Managed-asset router.
 *
 * Supplier-managed assets live in the same `asset` table as entity-side ones.
 * Supplier-portal-specific service profile (serviceType + branch fields) lives
 * in `asset_supplier_offering` (1:1 with asset, present iff the asset is
 * exposed via the supplier portal).
 *
 * Permission model: every procedure verifies the parent supplier row belongs
 * to the caller's tenant before reading or writing the asset/offering.
 */
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../../init";
import { insertRow, updateRow } from "../../typed";
import { asset, supplier, assetSupplierOffering } from "@/schema";
import { assetServiceUpdateSchema } from "@/schema/validators";

async function verifyRelationshipOwnership(
  db: typeof import("@/lib/db").db,
  relationshipId: string,
  supplierCompanyId: string,
): Promise<void> {
  const rel = await db.query.supplier.findFirst({
    where: and(
      eq(supplier.id, relationshipId),
      eq(supplier.supplierCompanyId, supplierCompanyId),
    ),
    columns: { id: true },
  });
  if (!rel) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Relationship not owned by you",
    });
  }
}

const managedAssetCreateSchema = assetServiceUpdateSchema.extend({
  relationshipId: z.string().uuid(),
  name: z.string().min(1).max(255),
});

const managedAssetUpdateSchema = assetServiceUpdateSchema.extend({
  id: z.string().uuid(),
});

export const supplierManagedAssetRouter = router({
  listByRelationship: companyProcedure
    .input(z.object({ relationshipId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyRelationshipOwnership(ctx.db, input.relationshipId, ctx.companyId);
      const rows = await ctx.db
        .select({
          asset: asset,
          offering: assetSupplierOffering,
        })
        .from(asset)
        .innerJoin(assetSupplierOffering, eq(assetSupplierOffering.assetId, asset.id))
        .where(
          and(
            eq(asset.companyId, ctx.companyId),
            eq(assetSupplierOffering.customerRelationshipId, input.relationshipId),
          ),
        )
        .orderBy(asc(asset.name));
      return rows.map((r) => ({ ...r.asset, ...r.offering }));
    }),

  get: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({ asset: asset, offering: assetSupplierOffering })
        .from(asset)
        .innerJoin(assetSupplierOffering, eq(assetSupplierOffering.assetId, asset.id))
        .where(and(eq(asset.id, input.id), eq(asset.companyId, ctx.companyId)))
        .limit(1);
      if (row.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      const r = row[0];
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });
      await verifyRelationshipOwnership(ctx.db, r.offering.customerRelationshipId, ctx.companyId);
      return { ...r.asset, ...r.offering };
    }),

  create: companyProcedure
    .input(managedAssetCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        relationshipId,
        name,
        description,
        hasMfa,
        encryptionAtRest,
        encryptionInTransit,
        rto,
        serviceType,
        serviceDescription,
        dataProcessingLocations,
        saasHostingRegion,
        onPremSbomProvided,
        onPremSignedReleases,
        onPremVulnerabilityDisclosurePolicy,
        onPremPatchSlaCriticalHours,
        proServicesBackgroundCheckScope,
        proServicesNdaInPlace,
        proServicesCustomerPremisesPolicy,
        managedPrivilegedAccessMgmt,
        managedSessionRecording,
        managedOnCall24x7,
      } = input;

      await verifyRelationshipOwnership(ctx.db, relationshipId, ctx.companyId);

      const [assetRow] = await ctx.db
        .insert(asset)
        .values(
          insertRow(asset, {
            companyId: ctx.companyId,
            name,
            description,
            hasMfa,
            encryptionAtRest,
            encryptionInTransit,
            rto,
            type: serviceType ?? "managed_service",
          }),
        )
        .returning();
      if (!assetRow) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create asset" });
      }

      if (!serviceType) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "serviceType is required for supplier-portal asset offerings",
        });
      }

      await ctx.db.insert(assetSupplierOffering).values({
        assetId: assetRow.id,
        customerRelationshipId: relationshipId,
        serviceType,
        serviceDescription,
        dataProcessingLocations,
        saasHostingRegion,
        onPremSbomProvided,
        onPremSignedReleases,
        onPremVulnerabilityDisclosurePolicy,
        onPremPatchSlaCriticalHours,
        proServicesBackgroundCheckScope,
        proServicesNdaInPlace,
        proServicesCustomerPremisesPolicy,
        managedPrivilegedAccessMgmt,
        managedSessionRecording,
        managedOnCall24x7,
      });

      return assetRow;
    }),

  update: companyProcedure
    .input(managedAssetUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db
        .select({ offering: assetSupplierOffering })
        .from(asset)
        .innerJoin(assetSupplierOffering, eq(assetSupplierOffering.assetId, asset.id))
        .where(and(eq(asset.id, id), eq(asset.companyId, ctx.companyId)))
        .limit(1);
      if (existing.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      const offering = existing[0]?.offering;
      if (!offering) throw new TRPCError({ code: "NOT_FOUND" });

      await verifyRelationshipOwnership(
        ctx.db,
        offering.customerRelationshipId,
        ctx.companyId,
      );

      const {
        serviceType,
        serviceDescription,
        dataProcessingLocations,
        saasHostingRegion,
        onPremSbomProvided,
        onPremSignedReleases,
        onPremVulnerabilityDisclosurePolicy,
        onPremPatchSlaCriticalHours,
        proServicesBackgroundCheckScope,
        proServicesNdaInPlace,
        proServicesCustomerPremisesPolicy,
        managedPrivilegedAccessMgmt,
        managedSessionRecording,
        managedOnCall24x7,
        ...assetCols
      } = data;

      const [row] = await ctx.db
        .update(asset)
        .set(updateRow(asset, { ...assetCols, updatedAt: new Date() }))
        .where(eq(asset.id, id))
        .returning();

      await ctx.db
        .update(assetSupplierOffering)
        .set({
          ...(serviceType !== undefined && { serviceType }),
          ...(serviceDescription !== undefined && { serviceDescription }),
          ...(dataProcessingLocations !== undefined && { dataProcessingLocations }),
          ...(saasHostingRegion !== undefined && { saasHostingRegion }),
          ...(onPremSbomProvided !== undefined && { onPremSbomProvided }),
          ...(onPremSignedReleases !== undefined && { onPremSignedReleases }),
          ...(onPremVulnerabilityDisclosurePolicy !== undefined && {
            onPremVulnerabilityDisclosurePolicy,
          }),
          ...(onPremPatchSlaCriticalHours !== undefined && { onPremPatchSlaCriticalHours }),
          ...(proServicesBackgroundCheckScope !== undefined && {
            proServicesBackgroundCheckScope,
          }),
          ...(proServicesNdaInPlace !== undefined && { proServicesNdaInPlace }),
          ...(proServicesCustomerPremisesPolicy !== undefined && {
            proServicesCustomerPremisesPolicy,
          }),
          ...(managedPrivilegedAccessMgmt !== undefined && { managedPrivilegedAccessMgmt }),
          ...(managedSessionRecording !== undefined && { managedSessionRecording }),
          ...(managedOnCall24x7 !== undefined && { managedOnCall24x7 }),
          updatedAt: new Date(),
        })
        .where(eq(assetSupplierOffering.assetId, id));

      return row;
    }),

  delete: companyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ offering: assetSupplierOffering })
        .from(asset)
        .innerJoin(assetSupplierOffering, eq(assetSupplierOffering.assetId, asset.id))
        .where(and(eq(asset.id, input.id), eq(asset.companyId, ctx.companyId)))
        .limit(1);
      if (existing.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      const offering = existing[0]?.offering;
      if (!offering) throw new TRPCError({ code: "NOT_FOUND" });

      await verifyRelationshipOwnership(
        ctx.db,
        offering.customerRelationshipId,
        ctx.companyId,
      );

      await ctx.db.delete(asset).where(eq(asset.id, input.id));
      return { deleted: true };
    }),
});
