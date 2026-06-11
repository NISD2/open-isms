import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { asset } from "./asset";
import { supplier } from "./supplier";
import { assetServiceTypeEnum } from "../enums";

/**
 * Per-asset-per-customer technical declarations. The architecturally-correct
 * home for service-type-conditional fields (saasHostingRegion, on-prem SBOM,
 * managed PAM, etc.).
 *
 * Note: the `company` table currently stores company-level defaults for the
 * same fields (supplier-portal MVP) — see organization.ts. The duplication is
 * intentional for the MVP and resolves when the per-asset UI lets suppliers
 * vary answers per customer. Until then, both tables can hold values; the
 * supplier-portal save endpoint writes only to `company`.
 */
export const assetSupplierOffering = pgTable(
  "asset_supplier_offering",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .references(() => asset.id, { onDelete: "cascade" })
      .notNull(),
    customerRelationshipId: uuid("customer_relationship_id")
      .references(() => supplier.id, { onDelete: "cascade" })
      .notNull(),

    serviceType: assetServiceTypeEnum("service_type").notNull(),
    serviceDescription: text("service_description"),
    dataProcessingLocations: text("data_processing_locations"),

    saasHostingRegion: varchar("saas_hosting_region", { length: 20 }),

    onPremSbomProvided: boolean("on_prem_sbom_provided"),
    onPremSignedReleases: boolean("on_prem_signed_releases"),
    onPremVulnerabilityDisclosurePolicy: boolean("on_prem_vulnerability_disclosure_policy"),
    onPremPatchSlaCriticalHours: integer("on_prem_patch_sla_critical_hours"),

    proServicesBackgroundCheckScope: varchar("pro_services_background_check_scope", { length: 20 }),
    proServicesNdaInPlace: boolean("pro_services_nda_in_place"),
    proServicesCustomerPremisesPolicy: boolean("pro_services_customer_premises_policy"),

    managedPrivilegedAccessMgmt: boolean("managed_privileged_access_mgmt"),
    managedSessionRecording: boolean("managed_session_recording"),
    managedOnCall24x7: boolean("managed_on_call_24x7"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_asset_supplier_offering_asset").on(table.assetId),
    index("idx_asset_supplier_offering_relationship").on(table.customerRelationshipId),
    index("idx_asset_supplier_offering_service_type").on(table.serviceType),
  ],
);
