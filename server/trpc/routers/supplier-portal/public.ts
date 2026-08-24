/**
 * Token-gated access router — used by invited customers (no Sorzel account).
 *
 * Replaces the old "public profile + double opt-in subscribe" model. The new
 * flow is bilateral and explicit:
 *
 *   1. Supplier invites a customer (relationship.invite) — generates accessToken
 *   2. Customer receives an email with /supplier-access/{accessToken}
 *   3. Customer clicks the link, sees the supplier's data WITHOUT signing in
 *   4. Customer can revoke their own access via the same page (button → revoke)
 *
 * The access token IS the auth. Knowledge of the token grants read access to
 * one specific supplier_relationship row. The token is per-relationship, long
 * (64 hex chars), and lives in supplier_relationship.accessToken.
 *
 * No public profile, no slugs, no anonymous subscribe form.
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../../init";
import {
  supplier,
  asset,
  incident,
  companyCertification,
  company,
  assetSupplierOffering,
  incidentBroadcast,
} from "@/schema";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export const supplierPublicRouter = router({
  /**
   * Resolve an access token to the customer's full view of the supplier.
   *
   * The token is the auth — knowing it grants read access to ONE relationship
   * row's supplier data. Returns null on revoked / unknown tokens (the page
   * handles 404). Returns a structured payload with supplier identity, full
   * questionnaire answers, the assets the supplier manages for THIS customer,
   * the recent incidents affecting those assets, and the active certifications.
   *
   * SECURITY: this is the ONE place where supplier data flows out of the
   * platform without an authenticated tenant context. The token is the only
   * gate. We deliberately scope every query by the relationship's supplier
   * + relationshipId so an attacker who somehow guesses one token cannot
   * see other customers' data.
   */
  getByToken: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .query(async ({ ctx, input }) => {
      // Per-IP rate limit on the bearer-token endpoint. The token is 256 bits
      // of entropy so brute-force is computationally infeasible, but rate
      // limiting still prevents the public endpoint from being a free
      // enumeration / scraping channel and protects the DB from cheap reads.
      if (!rateLimit(`supplier-access:read:${ctx.ip}`, 60, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please wait a minute and try again.",
        });
      }

      const rel = await ctx.db.query.supplier.findFirst({
        where: eq(supplier.unsubscribeToken, input.token),
      });
      if (!rel) return null;
      if (rel.status === "revoked") return null;
      if (!rel.supplierCompanyId) return null;

      // Explicit column whitelist — defensive against future drift. The
      // company row contains BOTH NIS2-entity-only data (cisoName, billing,
      // stripeCustomerId) and the universal company facts surfaced by the
      // supplier portal. Only the supplier-portal subset is allowed on the
      // wire.
      //
      // Per-customer contract clauses live on `rel` (the supplier row) —
      // they're returned in the `relationship` payload below. Per-asset
      // technical declarations live on the asset rows queried separately.
      const supplierCompany = await ctx.db.query.company.findFirst({
        where: eq(company.id, rel.supplierCompanyId),
        columns: {
          id: true,
          name: true,
          sector: true,
          actsAsSupplier: true,
          // Public identity
          legalName: true,
          registeredAddress: true,
          country: true,
          primaryDomain: true,
          tagline: true,
          description: true,
          logoStorageKey: true,
          // Customer-facing incident contact (default — per-customer SLA on rel)
          securityContactName: true,
          incidentContactEmail: true,
          incidentContactPhone: true,
          // CIR §5.1.4 universal facts about how the company runs
          hasIsms: true,
          hasIso27001OrEquivalent: true,
          staffSecurityTraining: true,
          backgroundChecks: true,
          vulnerabilityHandling: true,
          // NIS2 Art 21(2) / CIR §5.1 universal baseline practices
          securityPolicyReviewedAnnually: true,
          hasIncidentResponsePlan: true,
          hasBusinessContinuityPlan: true,
          hasCryptographyPolicy: true,
          hasPrivilegedAccessMgmt: true,
          mfaEnforcedInternal: true,
          hasAssetInventory: true,
          hasPenetrationTestingProgram: true,
          // ENISA TIG §5 — universal company-wide declarations
          cooperateWithAuthorities: true,
          pastBreachesDisclosed: true,
          // ENISA TIG §5.1.2 — supplier's own NIS2-regulated status
          bsiRegistrationId: true,
          practicesLastSavedAt: true,
        },
      });
      // Defense-in-depth: if a token survives a relationship cascade-delete
      // race or the supplier opted out of the supplier role, refuse to leak.
      if (!supplierCompany || !supplierCompany.actsAsSupplier) return null;

      // Assets the supplier offers to THIS customer — service profile lives
      // in asset_supplier_offering, joined to the generic asset row.
      //
      // Columns are listed, not spread. This endpoint is reached with a 64-hex
      // token and no account, and the generic asset row carries the supplier's
      // own internal estate: ipAddress, hostname, operatingSystem,
      // softwareVersion, lastPatchDate, lastVulnScanDate, privilegedAccountCount.
      // Handing a customer a live inventory of their supplier's unpatched hosts
      // is a gift to whoever phishes that customer next. What belongs here is
      // what the supplier is declaring ABOUT the service, which is the point of
      // the portal — the same reasoning the `company` select above already
      // applies to itself.
      const offeringRows = await ctx.db
        .select({
          asset: {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            description: asset.description,
            isCritical: asset.isCritical,
            hasMfa: asset.hasMfa,
            encryptionAtRest: asset.encryptionAtRest,
            encryptionInTransit: asset.encryptionInTransit,
            hasBackup: asset.hasBackup,
            rto: asset.rto,
            rpo: asset.rpo,
            processesPersonalData: asset.processesPersonalData,
          },
          offering: assetSupplierOffering,
        })
        .from(asset)
        .innerJoin(assetSupplierOffering, eq(assetSupplierOffering.assetId, asset.id))
        .where(
          and(
            eq(asset.companyId, rel.supplierCompanyId),
            eq(assetSupplierOffering.customerRelationshipId, rel.id),
          ),
        )
        .orderBy(desc(asset.createdAt));
      const managedAssets = offeringRows.map((r) => ({ ...r.asset, ...r.offering }));

      // Recent incidents addressed to THIS relationship — broadcast metadata
      // lives in incident_broadcast.
      //
      // Same treatment, and this one matters more. The incident row is the
      // supplier's internal post-mortem: rootCause, countermeasures,
      // estimatedFinancialDamage, affectedUsersCount, affectedSystemsCount,
      // gdprNotifiedAt, internalRef. A supply-chain broadcast is a notification
      // that something happened and what the customer should do about it, not
      // a copy of the supplier's breach file. Anyone holding the token was
      // receiving all 33 columns.
      const broadcastRows = await ctx.db
        .select({
          incident: {
            id: incident.id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
            situationColor: incident.situationColor,
            discoveredAt: incident.discoveredAt,
            resolvedAt: incident.resolvedAt,
            createdAt: incident.createdAt,
          },
          broadcast: incidentBroadcast,
        })
        .from(incident)
        .innerJoin(incidentBroadcast, eq(incidentBroadcast.incidentId, incident.id))
        .where(
          and(
            eq(incident.companyId, rel.supplierCompanyId),
            eq(incidentBroadcast.customerRelationshipId, rel.id),
          ),
        )
        .orderBy(desc(incident.createdAt))
        .limit(50);
      const recentEvents = broadcastRows.map((r) => ({ ...r.incident, broadcast: r.broadcast }));

      // Active certifications (cert metadata only — no S3 storage keys)
      const certifications = await ctx.db.query.companyCertification.findMany({
        where: and(
          eq(companyCertification.companyId, rel.supplierCompanyId),
          eq(companyCertification.status, "active"),
        ),
        columns: {
          id: true,
          type: true,
          typeOther: true,
          scope: true,
          auditor: true,
          validFrom: true,
          validUntil: true,
          status: true,
        },
      });

      return {
        relationship: {
          id: rel.id,
          customerEmail: rel.customerEmail,
          customerOrgName: rel.customerOrgName,
          status: rel.status,
          createdAt: rel.createdAt,
          // Per-customer contract clauses — negotiated separately for each
          // customer, so they live on the relationship row, not on company.
          acceptRightToAudit: rel.acceptRightToAudit,
          hasSubprocessors: rel.hasSubprocessors,
          subprocessorList: rel.subprocessorList,
          dataReturnOnTermination: rel.dataReturnOnTermination,
          dpaAvailable: rel.dpaAvailable,
          notifyOnLocationChange: rel.notifyOnLocationChange,
          incidentAssistanceCommitment: rel.incidentAssistanceCommitment,
          notifyMaterialChanges: rel.notifyMaterialChanges,
          hasExitPlan: rel.hasExitPlan,
          incidentSlaHours: rel.incidentSlaHours,
        },
        // Universal company-level facts. Identity (legal name, sector,
        // address) plus ISMS / NIS2 Art 21(2) baseline practices that apply
        // to every customer.
        supplierCompany,
        // Per-service technical declarations (SaaS hosting, on-prem SBOM,
        // managed PAM, etc.) live on each asset row.
        managedAssets,
        recentEvents,
        certifications,
      };
    }),

  /**
   * Revoke access via opaque token. No auth required (the token is the auth).
   * Idempotent: re-running on an already-revoked token is a no-op.
   */
  revoke: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .mutation(async ({ ctx, input }) => {
      // Per-IP rate limit. Same rationale as getByToken — defense in depth
      // against brute force + spam.
      if (!rateLimit(`supplier-access:revoke:${ctx.ip}`, 10, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please wait a minute and try again.",
        });
      }

      const rel = await ctx.db.query.supplier.findFirst({
        where: eq(supplier.unsubscribeToken, input.token),
      });
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });
      // Defense-in-depth: a row with a token but no supplier company is
      // malformed and should not be revokable via this path.
      if (!rel.supplierCompanyId) throw new TRPCError({ code: "NOT_FOUND" });

      if (rel.status !== "revoked") {
        await ctx.db
          .update(supplier)
          .set({
            status: "revoked",
            unsubscribedAt: new Date(),
          })
          .where(eq(supplier.id, rel.id));

        // Manual audit log — publicProcedure doesn't carry the auto-audit
        // middleware, so we log explicitly here. The companyId is the
        // SUPPLIER's company (the row's tenant); userId is null because
        // the caller is unauthenticated. The IP from ctx is the only
        // forensic anchor we have for the actor.
        logAudit({
          companyId: rel.supplierCompanyId,
          userId: null,
          action: "supplierPortal.public.revoke",
          entityType: "supplier",
          entityId: rel.id,
          description: `customer ${rel.customerEmail} revoked access via token from ${ctx.ip}`,
          newValue: { status: "revoked", actorIp: ctx.ip },
        }).catch((err) => console.error("[audit] revoke log failed:", err));
      }
      return { ok: true };
    }),
});
