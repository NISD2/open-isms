import { z } from "zod";

/**
 * The answer sets for the /hilfe request form.
 *
 * One list per question, defined once here and consumed by the form, the
 * tRPC input schema and the translations. A partner firm decides whether a
 * request is theirs from these five answers, so the values are stored as
 * given rather than normalised away.
 */

export const ADVISORY_TOPICS = [
  "scope",
  "measures",
  "supplyChain",
  "incident",
  "managementTraining",
  "certification",
  "selfHosting",
  "other",
] as const;

export const ADVISORY_TRIGGERS = [
  "customerAsked",
  "registration",
  "audit",
  "tender",
  "internal",
] as const;

export const ADVISORY_TIMEFRAMES = ["thisMonth", "thisQuarter", "noFixedDate"] as const;

export const ADVISORY_SIZES = ["under50", "50to250", "over250"] as const;

/**
 * Partner firms are rows in `advisory_partner`, not a constant here. This file
 * ships in a public repository, and which firms we send leads to is the
 * operator's business rather than part of the distribution. See the table's
 * own comment.
 */
export const PARTNER_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$/;

export type AdvisoryTopic = (typeof ADVISORY_TOPICS)[number];
export type AdvisoryTrigger = (typeof ADVISORY_TRIGGERS)[number];
export type AdvisoryTimeframe = (typeof ADVISORY_TIMEFRAMES)[number];
export type AdvisorySize = (typeof ADVISORY_SIZES)[number];

/**
 * StuckLink and the wiki strip both append ?req=. The value lands in a stored
 * row and in an email a human will read, so it is shape-checked rather than
 * trusted. Mirrors the check the page already ran before the form existed.
 */
export const REQUIREMENT_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;

/**
 * Which requirement code maps to which topic, so a request raised from a
 * requirement page arrives with the right box already ticked. Prefix match,
 * longest first, because NIS2-21-2-D is more specific than NIS2-21.
 */
const TOPIC_BY_CODE_PREFIX: ReadonlyArray<readonly [string, AdvisoryTopic]> = [
  ["NIS2-21-2-D", "supplyChain"],
  ["NIS2-23", "incident"],
  ["NIS2-20", "managementTraining"],
  ["INC", "incident"],
  ["SUP", "supplyChain"],
];

export function topicForRequirementCode(code: string | null): AdvisoryTopic {
  if (!code) return "scope";
  const upper = code.toUpperCase();
  const hit = TOPIC_BY_CODE_PREFIX.find(([prefix]) => upper.startsWith(prefix));
  return hit ? hit[1] : "measures";
}

/**
 * The wiki strip passes its category rather than a requirement code, because
 * that is what next-intl's usePathname makes available on the client without
 * pulling the table of contents into the bundle.
 */
const TOPIC_BY_WIKI_CATEGORY: Record<string, AdvisoryTopic> = {
  anwendungsbereich: "scope",
  sektoren: "scope",
  "zeit-und-status": "scope",
  grundlagen: "scope",
  umsetzung: "measures",
  troubleshooting: "measures",
  "recht-und-folgen": "measures",
  "open-source": "selfHosting",
  vergleich: "measures",
  // Not a wiki category. /docs is the self-hosting manual, so a request from
  // there is about running the thing, never about the law.
  docs: "selfHosting",
};

export function topicForWikiCategory(category: string): AdvisoryTopic {
  return TOPIC_BY_WIKI_CATEGORY[category] ?? "scope";
}

/**
 * The sending page arrives as ?from=, as a full path rather than a category.
 * Shape-checked for the same reason the requirement code is: it reaches a
 * stored row and a human's inbox. Slashes allowed, everything that could turn
 * it into a URL, a protocol or markup is not.
 */
export const SOURCE_PATH_PATTERN = /^[A-Za-z0-9/_-]{1,200}$/;

/**
 * The bucket a source path belongs to, for picking the form's opening topic.
 *
 * `wiki/troubleshooting/bsi-anfrage-erhalten` is a troubleshooting page and
 * anything under `docs/` is the self-hosting manual. Reads the segment after
 * `wiki/` rather than the first one, because the first is always "wiki".
 */
export function categoryFromSourcePath(path: string): string {
  const segments = path.replace(/^\/+/, "").split("/").filter(Boolean);
  if (segments[0] === "wiki") return segments[1] ?? "";
  return segments[0] ?? "";
}

/**
 * First query value that passes `pattern`, or null.
 *
 * Next hands a repeated parameter over as an array. Taking the first value
 * that PASSES rather than the first value present means `?req=&req=ART-21-1`
 * still prefills, where `req[0]` would drop a good code because an empty one
 * preceded it.
 */
export function firstMatchingParam(
  value: string | string[] | undefined,
  pattern: RegExp,
): string | null {
  const values = Array.isArray(value) ? value : [value];
  return values.find((v) => v !== undefined && pattern.test(v)) ?? null;
}

/**
 * Which box the form opens with. A requirement code is the more specific
 * signal and wins; the wiki category is the fallback; a direct visit gets the
 * component's own default.
 */
export function resolveDefaultTopic(
  requirementCode: string | null,
  sourcePath: string | null,
): AdvisoryTopic | undefined {
  if (requirementCode) return topicForRequirementCode(requirementCode);
  if (sourcePath) return topicForWikiCategory(categoryFromSourcePath(sourcePath));
  return undefined;
}

/**
 * The two public inputs, defined here rather than inline in the router so they
 * can be tested without importing a database connection. They are also the
 * only thing standing between a caller-supplied object and a row write, which
 * is worth keeping visible next to the lists they validate against.
 */
export const advisorySubmitInput = z.object({
  topic: z.enum(ADVISORY_TOPICS),
  email: z.email().max(320),
  sourcePath: z.string().max(500).optional(),
  requirementCode: z.string().regex(REQUIREMENT_CODE_PATTERN).optional(),
  /**
   * document.referrer, which is off-site and browser-supplied. Capped and
   * stored as a hint, never trusted and never used to decide anything, so
   * there is nothing to validate beyond a length that cannot fill a column.
   */
  referrer: z.string().max(1000).optional(),
  locale: z.string().max(10).optional(),
  /**
   * Required to be literally true rather than merely present. A request nobody
   * agreed to forward cannot lawfully be forwarded, and storing it would leave
   * a row we are not allowed to act on.
   */
  forwardConsent: z.literal(true),
});

/**
 * Descriptive fields only. `email`, `forwardConsentAt`, `createdAt` and
 * anything to do with referrals are absent by construction, so a caller
 * holding a request id cannot rewrite who it belongs to or claim it was
 * consented to at a different time. Zod strips unknown keys, so absent here
 * means unwritable there.
 */
export const advisoryEnrichInput = z.object({
  id: z.uuid(),
  trigger: z.enum(ADVISORY_TRIGGERS).optional(),
  timeframe: z.enum(ADVISORY_TIMEFRAMES).optional(),
  companySize: z.enum(ADVISORY_SIZES).optional(),
  sector: z.string().max(120).optional(),
  contactName: z.string().max(200).optional(),
  companyName: z.string().max(500).optional(),
  note: z.string().max(2000).optional(),
});
