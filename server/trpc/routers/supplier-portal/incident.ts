/**
 * Supplier-published incident router.
 *
 * Supplier broadcasts and entity-side incidents share the same `incident` table.
 * Supplier-portal-specific delivery state lives in `incident_broadcast` (one
 * row per incident-customer pair). Affected-asset linkage uses
 * `asset_supplier_offering` to scope assets to a relationship.
 */
import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, companyProcedure } from "../../init";
import { insertRow } from "../../typed";
import {
  incident,
  supplier,
  asset,
  company,
  incidentBroadcast,
  assetSupplierOffering,
} from "@/schema";
import { broadcastIncidentBroadcast } from "./broadcast";

const severityEnum = z.enum(["info", "warning", "critical"]);

export const supplierIncidentRouter = router({
  /** List all supplier-broadcast incidents I have published. */
  list: companyProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ incident: incident, broadcast: incidentBroadcast })
      .from(incident)
      .innerJoin(incidentBroadcast, eq(incidentBroadcast.incidentId, incident.id))
      .where(eq(incident.companyId, ctx.companyId))
      .orderBy(desc(incident.createdAt));

    return rows.map((r) => ({
      ...r.incident,
      customerRelationshipId: r.broadcast.customerRelationshipId,
      broadcastStatus: r.broadcast.status,
      broadcastCount: r.broadcast.deliveryCount,
      broadcastSentAt: r.broadcast.sentAt,
    }));
  }),

  publish: companyProcedure
    .input(
      z.object({
        relationshipId: z.string().uuid(),
        title: z.string().min(1).max(500),
        body: z.string().min(1).max(2000),
        severity: severityEnum.default("warning"),
        affectedAssetIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { actsAsSupplier: true },
      });
      if (!row?.actsAsSupplier) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Create your supplier profile before broadcasting incidents.",
        });
      }

      const rel = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.relationshipId),
          eq(supplier.supplierCompanyId, ctx.companyId),
        ),
        columns: { id: true },
      });
      if (!rel) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Relationship not owned by you",
        });
      }

      // Affected assets must be the supplier's own AND offered to THIS customer.
      if (input.affectedAssetIds && input.affectedAssetIds.length > 0) {
        const offeringRows = await ctx.db
          .select({ assetId: assetSupplierOffering.assetId })
          .from(assetSupplierOffering)
          .innerJoin(asset, eq(asset.id, assetSupplierOffering.assetId))
          .where(
            and(
              inArray(asset.id, input.affectedAssetIds),
              eq(asset.companyId, ctx.companyId),
              eq(assetSupplierOffering.customerRelationshipId, input.relationshipId),
            ),
          );
        if (offeringRows.length !== input.affectedAssetIds.length) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "One or more affected assets do not belong to this customer relationship.",
          });
        }
      }

      const severityMap = {
        info: "near_miss",
        warning: "incident",
        critical: "significant",
      } as const;

      const [event] = await ctx.db
        .insert(incident)
        .values(
          insertRow(incident, {
            companyId: ctx.companyId,
            severity: severityMap[input.severity],
            title: input.title,
            description: input.body,
            discoveredAt: new Date(),
            createdBy: ctx.userId,
          }),
        )
        .returning();

      if (!event) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create incident",
        });
      }

      const [broadcastRow] = await ctx.db
        .insert(incidentBroadcast)
        .values({
          incidentId: event.id,
          customerRelationshipId: input.relationshipId,
          status: "queued",
        })
        .returning({ id: incidentBroadcast.id });

      if (broadcastRow) {
        broadcastIncidentBroadcast(broadcastRow.id).catch((err) => {
          console.error("[supplier-portal] sync broadcast failed:", err);
        });
      }

      return event;
    }),
});
