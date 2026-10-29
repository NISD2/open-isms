/**
 * The asset's validators, split from validators.ts (which may not grow): the form's shape, its
 * update, and the supplier portal's per-service declaration derived from it.
 */

import { asset, assetSupplierOffering } from "@nisd2/grc-data-model/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { isoDateColumns, omitTenantMeta } from "./validators";

// The providing supplier is set only by code that checks the supplier is the company's own, so
// neither the asset form nor a client can name another company's row. The second factor's kind is
// answered per program in the walk (11.1), from a fixed list the form has no labels for, and so
// is where it runs (2.2). The catalogue item is set by the walk from its own catalogue, never by a
// client. How long a process may be down (4.2) and how long a system takes back, or that nobody
// knows (4.4), are answered only in the walk, whose saves keep the last two apart as the column's
// CHECK does; a form field could not, so the form's shape leaves all three out.
export const assetInsertSchema = createInsertSchema(asset, {
  ...isoDateColumns(asset),
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
}).omit({
  supplierId: true,
  mfaMethod: true,
  catalogId: true,
  hosting: true,
  maxOutage: true,
  restoreTime: true,
  restoreTimeUnknown: true,
});
export const assetSelectSchema = createSelectSchema(asset);
export const assetUpdateSchema = assetInsertSchema.partial().omit(omitTenantMeta);

/**
 * Per-asset-per-customer service-type-conditional declarations (SaaS hosting,
 * on-prem SBOM, managed PAM, etc). Enum + range constraints tightened beyond
 * the raw `varchar` / `integer` columns — drizzle-zod can't infer enums from
 * length-limited varchars.
 */
export const assetSupplierOfferingInsertSchema = createInsertSchema(
  assetSupplierOffering,
  {
    // .nullable() preserves the DB column nullability — drizzle-zod can't
    // infer enums / max constraints from `varchar(20)`, so we tighten here,
    // but we must restate `.nullable()` because the override loses the
    // column's nullable flag otherwise.
    serviceDescription: z.string().max(2000).nullable(),
    dataProcessingLocations: z.string().max(1000).nullable(),
    saasHostingRegion: z.enum(["eu", "de_only", "global"]).nullable(),
    proServicesBackgroundCheckScope: z
      .enum(["criminal", "employment", "both"])
      .nullable(),
    onPremPatchSlaCriticalHours: z.number().int().positive().max(720).nullable(),
  },
);

/**
 * Per-asset service declaration (supplier portal) — what the supplier-portal
 * inline asset-create form sends up. Spans both `asset` (generic IT-asset
 * shape: name, hasMfa, encryption, RTO) and `asset_supplier_offering`
 * (per-customer service-type-conditional fields). The tRPC handler in
 * `managed-asset.ts` writes the matching columns to each table.
 *
 * companyId / customerRelationshipId / assetId / id are stripped — the
 * handler binds them from session / route params, the client never sets them.
 *
 * Derived from the two table schemas so renames or column drops are caught at
 * typecheck instead of silently breaking the form.
 */
export const assetServiceUpdateSchema = assetInsertSchema
  .partial()
  .pick({
    name: true,
    description: true,
    hasMfa: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    rto: true,
  })
  .merge(
    assetSupplierOfferingInsertSchema.partial().pick({
      serviceType: true,
      serviceDescription: true,
      dataProcessingLocations: true,
      saasHostingRegion: true,
      onPremSbomProvided: true,
      onPremSignedReleases: true,
      onPremVulnerabilityDisclosurePolicy: true,
      onPremPatchSlaCriticalHours: true,
      proServicesBackgroundCheckScope: true,
      proServicesNdaInPlace: true,
      proServicesCustomerPremisesPolicy: true,
      managedPrivilegedAccessMgmt: true,
      managedSessionRecording: true,
      managedOnCall24x7: true,
    }),
  );
