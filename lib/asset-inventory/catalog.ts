import type { AssetLayer, Exposure } from "./types";

// The trimmed catalog. ~57 items organised by FUNCTIONAL group (how the
// user thinks about them) and tagged with the BSI-200-2 §8.1 layer (how
// the auditor reads them). Niche tools removed to keep the list scannable;
// users can add anything missing via the per-layer "Add custom" input.

export type FunctionalGroup =
  | "business-processes"
  | "customer-facing"
  | "sales"
  | "customer-service"
  | "hr-payroll"
  | "finance"
  | "it-applications"
  | "it-infrastructure"
  | "endpoints"
  | "locations"
  | "network"
  | "sector-specific";

export const FUNCTIONAL_GROUPS: FunctionalGroup[] = [
  "business-processes",
  "customer-facing",
  "sales",
  "customer-service",
  "hr-payroll",
  "finance",
  "it-applications",
  "it-infrastructure",
  "endpoints",
  "locations",
  "network",
  "sector-specific",
];

export interface CatalogItem {
  id: string;
  group: FunctionalGroup;
  layer: AssetLayer;
  category: string;
  defaultChecked: boolean;
  defaultExposure: Exposure;
  /** Optional sector gate: hidden unless user picked one of these sectors. */
  appliesToSectors?: string[];
}

export const CATALOG: CatalogItem[] = [
  // ─── Business processes (Geschäftsprozesse) ──────────────────────
  { id: "bp-sales-cs", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-production-service", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-procurement", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "partner" },
  { id: "bp-hr-payroll", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-finance-accounting", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-marketing", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internet" },

  // ─── Customer-facing (Anwendungen) ───────────────────────────────
  { id: "cf-website", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internet" },
  { id: "cf-webshop", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cf-customer-portal", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cf-mobile-app", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },

  // ─── Sales tools ─────────────────────────────────────────────────
  { id: "sales-crm", group: "sales", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "sales-e-signature", group: "sales", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "sales-demo-meeting", group: "sales", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },

  // ─── Customer service ────────────────────────────────────────────
  { id: "cs-helpdesk", group: "customer-service", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cs-voip", group: "customer-service", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "cs-knowledge-base", group: "customer-service", layer: "anwendung", category: "data_store", defaultChecked: false, defaultExposure: "internal" },

  // ─── HR & Payroll ────────────────────────────────────────────────
  { id: "hr-hris", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "hr-payroll", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "hr-time-tracking", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "hr-personnel-files", group: "hr-payroll", layer: "anwendung", category: "data_store", defaultChecked: true, defaultExposure: "internal" },

  // ─── Finance & Accounting ────────────────────────────────────────
  { id: "fin-accounting", group: "finance", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "fin-erp", group: "finance", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "fin-online-banking", group: "finance", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "fin-expense", group: "finance", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },

  // ─── IT applications (cross-functional tools) ────────────────────
  { id: "it-email", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-file-storage", group: "it-applications", layer: "anwendung", category: "data_store", defaultChecked: true, defaultExposure: "internal" },
  { id: "it-video-conferencing", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-internal-chat", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-identity-provider", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-endpoint-protection", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "it-password-manager", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-code-repos", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },

  // ─── IT infrastructure (servers, cloud) ──────────────────────────
  { id: "infra-onprem-servers", group: "it-infrastructure", layer: "it-system", category: "server", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-cloud-platform", group: "it-infrastructure", layer: "it-system", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "infra-network-equipment", group: "it-infrastructure", layer: "it-system", category: "network", defaultChecked: true, defaultExposure: "internal" },
  { id: "infra-backup-system", group: "it-infrastructure", layer: "it-system", category: "data_store", defaultChecked: true, defaultExposure: "internal" },

  // ─── Endpoints ───────────────────────────────────────────────────
  { id: "ep-laptops", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: true, defaultExposure: "internal" },
  { id: "ep-mobile", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: true, defaultExposure: "internet" },

  // ─── Locations (Räume) ───────────────────────────────────────────
  { id: "loc-main-office", group: "locations", layer: "raum", category: "room", defaultChecked: true, defaultExposure: "physical-only" },
  { id: "loc-server-room", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "loc-employee-homes", group: "locations", layer: "raum", category: "room", defaultChecked: true, defaultExposure: "physical-only" },

  // ─── Network connections (Kommunikationsverbindungen) ───────────
  { id: "net-internet", group: "network", layer: "kommunikation", category: "network", defaultChecked: true, defaultExposure: "internet" },
  { id: "net-vpn", group: "network", layer: "kommunikation", category: "network", defaultChecked: true, defaultExposure: "internet" },

  // ─── Sector-specific add-ons (gated by sector selection) ─────────
  { id: "sec-plc-scada", group: "sector-specific", layer: "it-system", category: "ot_ics", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["manufacturing", "energy", "drinking-water", "waste-water", "waste-management", "chemicals", "food", "transport"] },
  { id: "sec-mes", group: "sector-specific", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["manufacturing", "chemicals", "food"] },
  { id: "sec-cad-plm", group: "sector-specific", layer: "anwendung", category: "data_store", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["manufacturing"] },
  { id: "sec-warehouse-mgmt", group: "sector-specific", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["manufacturing", "postal-courier", "food", "chemicals"] },
  { id: "sec-fleet-vehicles", group: "sector-specific", layer: "it-system", category: "iot", defaultChecked: false, defaultExposure: "internet",
    appliesToSectors: ["transport", "postal-courier", "waste-management", "food"] },
  { id: "sec-medical-devices", group: "sector-specific", layer: "it-system", category: "iot", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["health"] },
  { id: "sec-ehr-his", group: "sector-specific", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["health"] },
  { id: "sec-lab-instruments", group: "sector-specific", layer: "it-system", category: "ot_ics", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["health", "research", "chemicals", "food"] },
  { id: "sec-energy-scada", group: "sector-specific", layer: "it-system", category: "ot_ics", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["energy"] },
  { id: "sec-water-scada", group: "sector-specific", layer: "it-system", category: "ot_ics", defaultChecked: false, defaultExposure: "internal",
    appliesToSectors: ["drinking-water", "waste-water"] },
  { id: "sec-trading-platform", group: "sector-specific", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "partner",
    appliesToSectors: ["banking", "financial-market-infrastructure"] },
  { id: "sec-atm-fleet", group: "sector-specific", layer: "it-system", category: "iot", defaultChecked: false, defaultExposure: "internet",
    appliesToSectors: ["banking"] },
  { id: "sec-dns-tld", group: "sector-specific", layer: "it-system", category: "server", defaultChecked: false, defaultExposure: "internet",
    appliesToSectors: ["digital-infrastructure"] },
];

export const CATALOG_BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

/** Items visible to the user given their sector selection. */
export function visibleCatalog(sectors: string[]): CatalogItem[] {
  return CATALOG.filter((item) => {
    if (!item.appliesToSectors) return true;
    if (item.appliesToSectors.length === 0) return false;
    return item.appliesToSectors.some((s) => sectors.includes(s));
  });
}

/** Default selection given sector — items with defaultChecked=true within visible. */
export function defaultSelectionFor(sectors: string[]): string[] {
  return visibleCatalog(sectors)
    .filter((i) => i.defaultChecked)
    .map((i) => i.id);
}
