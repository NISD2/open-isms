import type { AssetType } from "@/lib/compliance/asset-types";
import type { AssetLayer, Exposure } from "./types";

// The catalog, organised by FUNCTIONAL group (how the user thinks about
// them) and tagged with the BSI-200-2 §8.1 layer (how the auditor reads
// them). Each group lists every common TYPE a company of 50 to 150 people
// runs, so most of a list is clicked rather than typed; brands appear only
// as examples in a label. Niche tools stay out; users add anything missing
// via the per-layer "Add custom" input.

export const FUNCTIONAL_GROUPS = [
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
] as const;

export type FunctionalGroup = (typeof FUNCTIONAL_GROUPS)[number];

export interface CatalogItem {
  id: string;
  group: FunctionalGroup;
  layer: AssetLayer;
  category: AssetType;
  defaultChecked: boolean;
  defaultExposure: Exposure;
  /** Optional sector gate: hidden unless user picked one of these sectors. */
  appliesToSectors?: string[];
  /**
   * False for a line nobody signs in to with an account (the internet line, the LAN, a phone
   * line), which the second-factor screen leaves out although its type is a network.
   */
  signIn?: false;
  /** A system that makes the company's backups, which 4.4 records per system. */
  backup?: true;
}

// biome-ignore format: one row per catalogue item keeps the catalogue readable as a table
export const CATALOG: CatalogItem[] = [
  // ─── Business processes (Geschäftsprozesse) ──────────────────────
  { id: "bp-sales-cs", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-production-service", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-procurement", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "partner" },
  { id: "bp-hr-payroll", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-finance-accounting", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internal" },
  { id: "bp-marketing", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: true, defaultExposure: "internet" },
  { id: "bp-logistics", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "partner" },
  { id: "bp-warehousing", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "internal" },
  { id: "bp-maintenance", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "internal" },
  { id: "bp-quality", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "internal" },
  { id: "bp-rnd", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "internal" },
  { id: "bp-it-operations", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "internal" },
  { id: "bp-facility-management", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "internal" },
  { id: "bp-legal-compliance", group: "business-processes", layer: "geschaeftsprozess", category: "process", defaultChecked: false, defaultExposure: "internal" },

  // ─── Customer-facing (Anwendungen) ───────────────────────────────
  { id: "cf-website", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internet" },
  { id: "cf-webshop", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cf-customer-portal", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cf-mobile-app", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cf-contact-form", group: "customer-facing", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cf-newsletter", group: "customer-facing", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "cf-social-media", group: "customer-facing", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },

  // ─── Sales tools ─────────────────────────────────────────────────
  { id: "sales-crm", group: "sales", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "sales-e-signature", group: "sales", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "sales-demo-meeting", group: "sales", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "sales-quote-proposal", group: "sales", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "sales-contract-mgmt", group: "sales", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "sales-marketplace", group: "sales", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "sales-lead-gen", group: "sales", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "sales-analytics", group: "sales", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },

  // ─── Customer service ────────────────────────────────────────────
  { id: "cs-helpdesk", group: "customer-service", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cs-voip", group: "customer-service", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "cs-knowledge-base", group: "customer-service", layer: "anwendung", category: "data_store", defaultChecked: false, defaultExposure: "internal" },
  { id: "cs-shared-mailbox", group: "customer-service", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cs-live-chat", group: "customer-service", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "cs-messenger", group: "customer-service", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "cs-appointment-booking", group: "customer-service", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "cs-field-service", group: "customer-service", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internet" },
  { id: "cs-feedback", group: "customer-service", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },

  // ─── HR & Payroll ────────────────────────────────────────────────
  { id: "hr-hris", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "hr-payroll", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "hr-time-tracking", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "hr-personnel-files", group: "hr-payroll", layer: "anwendung", category: "data_store", defaultChecked: true, defaultExposure: "internal" },
  { id: "hr-recruiting", group: "hr-payroll", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "hr-scheduling", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "hr-lms", group: "hr-payroll", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "hr-performance", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "hr-safety", group: "hr-payroll", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },

  // ─── Finance & Accounting ────────────────────────────────────────
  { id: "fin-accounting", group: "finance", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "fin-erp", group: "finance", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "fin-online-banking", group: "finance", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "fin-expense", group: "finance", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "fin-invoicing", group: "finance", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "fin-payment-processing", group: "finance", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "fin-procurement-system", group: "finance", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "fin-tax-advisor", group: "finance", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "partner" },
  { id: "fin-tax-portal", group: "finance", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "fin-receipt-archive", group: "finance", layer: "anwendung", category: "data_store", defaultChecked: false, defaultExposure: "internal" },
  { id: "fin-budgeting", group: "finance", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },

  // ─── IT applications (cross-functional tools) ────────────────────
  { id: "it-email", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-file-storage", group: "it-applications", layer: "anwendung", category: "data_store", defaultChecked: true, defaultExposure: "internal" },
  { id: "it-video-conferencing", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-internal-chat", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-identity-provider", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internet" },
  { id: "it-endpoint-protection", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: true, defaultExposure: "internal" },
  { id: "it-password-manager", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-code-repos", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-office-suite", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "it-document-mgmt", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "it-wiki-kb", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "it-project-management", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-ai-assistants", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-email-security", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-remote-support", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-mdm", group: "it-applications", layer: "anwendung", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "it-patch-rmm", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "it-monitoring", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },
  { id: "it-ticketing", group: "it-applications", layer: "anwendung", category: "application", defaultChecked: false, defaultExposure: "internal" },

  // ─── IT infrastructure (servers, cloud) ──────────────────────────
  { id: "infra-onprem-servers", group: "it-infrastructure", layer: "it-system", category: "server", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-cloud-platform", group: "it-infrastructure", layer: "it-system", category: "cloud_service", defaultChecked: true, defaultExposure: "internet" },
  { id: "infra-network-equipment", group: "it-infrastructure", layer: "it-system", category: "network", defaultChecked: true, defaultExposure: "internal" },
  { id: "infra-backup-system", group: "it-infrastructure", layer: "it-system", category: "data_store", defaultChecked: true, defaultExposure: "internal", backup: true },
  { id: "infra-backup-media", group: "it-infrastructure", layer: "it-system", category: "data_store", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "infra-virtualisation", group: "it-infrastructure", layer: "it-system", category: "server", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-terminal-server", group: "it-infrastructure", layer: "it-system", category: "server", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-directory", group: "it-infrastructure", layer: "it-system", category: "server", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-database", group: "it-infrastructure", layer: "it-system", category: "database", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-storage", group: "it-infrastructure", layer: "it-system", category: "server", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-dns-domains", group: "it-infrastructure", layer: "it-system", category: "cloud_service", defaultChecked: false, defaultExposure: "internet" },
  { id: "infra-printer-fleet", group: "it-infrastructure", layer: "it-system", category: "endpoint", defaultChecked: false, defaultExposure: "internal" },
  { id: "infra-ups", group: "it-infrastructure", layer: "it-system", category: "physical", defaultChecked: false, defaultExposure: "physical-only" },

  // ─── Endpoints ───────────────────────────────────────────────────
  { id: "ep-laptops", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: true, defaultExposure: "internal" },
  { id: "ep-mobile", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: true, defaultExposure: "internet" },
  { id: "ep-removable-media", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "ep-byod", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: false, defaultExposure: "internet" },
  { id: "ep-shared-pcs", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: false, defaultExposure: "internal" },
  { id: "ep-thin-clients", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: false, defaultExposure: "internal" },
  { id: "ep-handheld-scanners", group: "endpoints", layer: "it-system", category: "endpoint", defaultChecked: false, defaultExposure: "internal" },
  { id: "ep-meeting-rooms", group: "endpoints", layer: "it-system", category: "iot", defaultChecked: false, defaultExposure: "internal" },
  { id: "ep-cameras", group: "endpoints", layer: "it-system", category: "iot", defaultChecked: false, defaultExposure: "internal" },
  { id: "ep-access-control", group: "endpoints", layer: "it-system", category: "iot", defaultChecked: false, defaultExposure: "internal" },
  { id: "ep-building-tech", group: "endpoints", layer: "it-system", category: "iot", defaultChecked: false, defaultExposure: "internal" },

  // ─── Locations (Räume) ───────────────────────────────────────────
  { id: "loc-main-office", group: "locations", layer: "raum", category: "room", defaultChecked: true, defaultExposure: "physical-only" },
  { id: "loc-server-room", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "loc-employee-homes", group: "locations", layer: "raum", category: "room", defaultChecked: true, defaultExposure: "physical-only" },
  { id: "loc-branch-offices", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "loc-production", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "loc-warehouse", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "loc-technical-rooms", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "loc-datacenter", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },
  { id: "loc-archive", group: "locations", layer: "raum", category: "room", defaultChecked: false, defaultExposure: "physical-only" },

  // ─── Network connections (Kommunikationsverbindungen) ───────────
  { id: "net-internet", group: "network", layer: "kommunikation", category: "network", defaultChecked: true, defaultExposure: "internet", signIn: false },
  { id: "net-vpn", group: "network", layer: "kommunikation", category: "network", defaultChecked: true, defaultExposure: "internet" },
  { id: "net-lan", group: "network", layer: "kommunikation", category: "network", defaultChecked: false, defaultExposure: "internal", signIn: false },
  { id: "net-wifi", group: "network", layer: "kommunikation", category: "network", defaultChecked: false, defaultExposure: "internal", signIn: false },
  { id: "net-mobile", group: "network", layer: "kommunikation", category: "network", defaultChecked: false, defaultExposure: "internet", signIn: false },
  { id: "net-site-to-site", group: "network", layer: "kommunikation", category: "network", defaultChecked: false, defaultExposure: "partner", signIn: false },
  { id: "net-remote-maintenance", group: "network", layer: "kommunikation", category: "network", defaultChecked: false, defaultExposure: "partner" },
  { id: "net-third-party-api", group: "network", layer: "kommunikation", category: "network", defaultChecked: false, defaultExposure: "partner", signIn: false },
  { id: "net-phone-line", group: "network", layer: "kommunikation", category: "network", defaultChecked: false, defaultExposure: "internet", signIn: false },

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
