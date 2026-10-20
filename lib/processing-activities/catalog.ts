import type { ActivityGroup } from "@/lib/durchgang/gdpr-records";

/**
 * The processing activities a company of this size usually carries out, offered as ticks so a
 * record of processing activities (Art. 30(1) GDPR) does not start from a blank page. Each names
 * the asset-catalogue items (lib/asset-inventory/catalog.ts) whose presence on the company's list
 * suggests it, so a company that listed its assets in the NIS 2 walk starts with these ticked.
 * Names and suggested answers are copy: `durchgang.activities.<id>` in messages/durchgang.
 */
export interface ActivityItem {
  readonly id: string;
  readonly group: ActivityGroup;
  /** Asset-catalogue items any of which, listed by the company, ticks this activity. */
  readonly fromAssets: readonly string[];
}

export const ACTIVITY_CATALOG = [
  { id: "payroll", group: "staff", fromAssets: ["hr-payroll", "bp-hr-payroll"] },
  {
    id: "personnel_records",
    group: "staff",
    fromAssets: ["hr-personnel-files", "hr-hris", "bp-hr-payroll"],
  },
  { id: "applicants", group: "staff", fromAssets: ["hr-recruiting"] },
  {
    id: "working_time",
    group: "staff",
    fromAssets: ["hr-time-tracking", "hr-scheduling"],
  },
  {
    id: "customers",
    group: "customers",
    fromAssets: ["sales-crm", "cf-customer-portal", "cf-webshop", "bp-sales-cs"],
  },
  {
    id: "accounting",
    group: "customers",
    fromAssets: ["fin-accounting", "fin-invoicing", "fin-erp", "bp-finance-accounting"],
  },
  {
    id: "suppliers",
    group: "customers",
    fromAssets: ["fin-procurement-system", "bp-procurement"],
  },
  {
    id: "enquiries",
    group: "customers",
    fromAssets: ["cs-helpdesk", "cs-shared-mailbox", "cf-contact-form", "cs-live-chat"],
  },
  { id: "website", group: "online", fromAssets: ["cf-website", "cf-webshop"] },
  { id: "newsletter", group: "online", fromAssets: ["cf-newsletter"] },
  { id: "social_media", group: "online", fromAssets: ["cf-social-media"] },
  { id: "video_meetings", group: "online", fromAssets: ["it-video-conferencing"] },
  { id: "email", group: "operations", fromAssets: ["it-email", "it-office-suite"] },
  {
    id: "it_logging",
    group: "operations",
    fromAssets: ["it-monitoring", "it-endpoint-protection", "it-identity-provider"],
  },
  { id: "access_control", group: "operations", fromAssets: ["ep-access-control"] },
  { id: "video_surveillance", group: "operations", fromAssets: ["ep-cameras"] },
] as const satisfies readonly ActivityItem[];

export type ActivityId = (typeof ACTIVITY_CATALOG)[number]["id"];

export const ACTIVITY_BY_ID: ReadonlyMap<string, ActivityItem> = new Map(
  ACTIVITY_CATALOG.map((a) => [a.id, a]),
);

/** The catalogue items a company's listed assets suggest, by the assets' catalogue ids. */
export const suggestedActivities = (
  listedAssets: readonly string[],
): readonly ActivityId[] => {
  const listed = new Set(listedAssets);
  return ACTIVITY_CATALOG.filter((a) => a.fromAssets.some((id) => listed.has(id))).map(
    (a) => a.id,
  );
};
