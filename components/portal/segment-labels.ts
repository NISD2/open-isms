/**
 * The portal message that names the page at each first path segment, the same one the sidebar
 * uses, so the breadcrumb reads in the visitor's language. A segment without an entry (an admin
 * page, or the order page, whose slug is already translated) is named after the segment itself.
 */
export const SEGMENT_LABELS = {
  assets: "assets",
  audit: "auditTrail",
  "audit-readiness": "auditReadiness",
  billing: "billing",
  changes: "changes",
  dashboard: "dashboard",
  durchgang: "durchgang",
  exercises: "exercises",
  export: "export",
  "gap-assessment": "gapAssessment",
  improvements: "improvements",
  incidents: "incidents",
  "internal-audits": "internalAudits",
  journey: "journey",
  kpis: "kpis",
  "management-reviews": "managementReviews",
  notifications: "notifications",
  organization: "organization",
  patches: "patches",
  policies: "policies",
  review: "review",
  risks: "riskRegister",
  settings: "settings",
  suppliers: "suppliers",
  team: "team",
  training: "training",
  vulnerabilities: "vulnerabilities",
  walkthrough: "durchgang",
} as const;

export const isLabelledSegment = (
  segment: string,
): segment is keyof typeof SEGMENT_LABELS => Object.hasOwn(SEGMENT_LABELS, segment);
