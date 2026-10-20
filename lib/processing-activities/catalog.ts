import type { ActivityGroup, LegalBasis } from "@/lib/durchgang/gdpr-records";

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
  /**
   * The lawful bases (Art. 6(1)) such an activity usually rests on, marked as usual on the walk's
   * basis screen and never ticked for the person: the company decides what holds for it.
   */
  readonly bases: readonly LegalBasis[];
}

export const ACTIVITY_CATALOG = [
  {
    id: "payroll",
    group: "staff",
    fromAssets: ["hr-payroll", "bp-hr-payroll"],
    bases: ["contract", "legal_obligation"],
  },
  {
    id: "personnel_records",
    group: "staff",
    fromAssets: ["hr-personnel-files", "hr-hris", "bp-hr-payroll"],
    bases: ["contract", "legal_obligation"],
  },
  {
    id: "applicants",
    group: "staff",
    fromAssets: ["hr-recruiting"],
    bases: ["contract", "legitimate_interests"],
  },
  {
    // A legal duty from 50 employees in Germany (§ 12 HinSchG); nothing on an asset list shows it.
    id: "whistleblowing",
    group: "staff",
    fromAssets: [],
    bases: ["legal_obligation"],
  },
  {
    id: "working_time",
    group: "staff",
    fromAssets: ["hr-time-tracking", "hr-scheduling"],
    bases: ["legal_obligation", "contract"],
  },
  {
    id: "customers",
    group: "customers",
    fromAssets: ["sales-crm", "cf-customer-portal", "cf-webshop", "bp-sales-cs"],
    bases: ["contract", "legitimate_interests"],
  },
  {
    id: "accounting",
    group: "customers",
    fromAssets: ["fin-accounting", "fin-invoicing", "fin-erp", "bp-finance-accounting"],
    bases: ["legal_obligation", "contract"],
  },
  {
    id: "suppliers",
    group: "customers",
    fromAssets: ["fin-procurement-system", "bp-procurement"],
    bases: ["contract", "legitimate_interests"],
  },
  {
    id: "enquiries",
    group: "customers",
    fromAssets: ["cs-helpdesk", "cs-shared-mailbox", "cf-contact-form", "cs-live-chat"],
    bases: ["contract", "legitimate_interests"],
  },
  {
    id: "website",
    group: "online",
    fromAssets: ["cf-website", "cf-webshop"],
    bases: ["legitimate_interests"],
  },
  {
    // Not ticked from the website: whether a site runs analytics or marketing tools is not on the
    // asset list, and guessing it would put a consent duty on a company that has none.
    id: "website_analytics",
    group: "online",
    fromAssets: [],
    bases: ["consent"],
  },
  {
    id: "newsletter",
    group: "online",
    fromAssets: ["cf-newsletter"],
    bases: ["consent"],
  },
  {
    id: "social_media",
    group: "online",
    fromAssets: ["cf-social-media"],
    bases: ["legitimate_interests"],
  },
  {
    id: "video_meetings",
    group: "online",
    fromAssets: ["it-video-conferencing"],
    bases: ["contract", "legitimate_interests"],
  },
  {
    id: "email",
    group: "operations",
    fromAssets: ["it-email", "it-office-suite"],
    bases: ["contract", "legitimate_interests"],
  },
  {
    id: "it_logging",
    group: "operations",
    fromAssets: ["it-monitoring", "it-endpoint-protection", "it-identity-provider"],
    bases: ["legitimate_interests"],
  },
  {
    id: "phishing_tests",
    group: "operations",
    fromAssets: [],
    bases: ["legitimate_interests"],
  },
  {
    id: "access_control",
    group: "operations",
    fromAssets: ["ep-access-control"],
    bases: ["legitimate_interests"],
  },
  {
    id: "video_surveillance",
    group: "operations",
    fromAssets: ["ep-cameras"],
    bases: ["legitimate_interests"],
  },
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
