/**
 * The platform admin page's tabs and the address of each: /platform-admin/<slug>, so a tab can be
 * linked, bookmarked and reached with the back button. /platform-admin alone opens the first one.
 */
export const ADMIN_TAB_SLUGS = {
  users: "users",
  graphs: "graphs",
  active: "active-users",
  invites: "invited-users",
  companies: "companies",
  compliance: "compliance",
  training: "training",
  suppliers: "suppliers",
  emails: "emails",
  erasures: "erasures",
  pricing: "pricing",
  subscriptions: "subscriptions",
  partners: "partner-agreements",
  close: "close",
  flags: "feature-flags",
  dev: "dev",
  updates: "updates",
} as const;

export type Tab = keyof typeof ADMIN_TAB_SLUGS;

/** The tab /platform-admin opens on. */
export const DEFAULT_TAB: Tab = "users";

/** The tab an address names, or null for a slug that is no tab. */
export const tabOfSlug = (slug: string): Tab | null =>
  (Object.keys(ADMIN_TAB_SLUGS) as Tab[]).find((tab) => ADMIN_TAB_SLUGS[tab] === slug) ??
  null;
