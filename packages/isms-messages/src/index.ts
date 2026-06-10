export const SUPPORTED_LOCALES = ["de", "en", "nl"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Namespaces tracked by this package. Today the package is a *registry*
 * only — it does not ship JSON catalogs. Each consumer holds its own
 * messages directory (NIS2 root: `messages/<ns>/<locale>.json`; OSS:
 * `apps/reference/messages/<ns>/<locale>.json`) and uses this list to
 * stay aligned on which namespaces the ISMS-core surface expects.
 *
 * Why not ship JSON here: maintaining a third copy alongside two consumers'
 * copies guarantees drift the first time anyone edits one. When a namespace
 * stabilises across both apps, *move* (not copy) it into this package and
 * update each consumer's request.ts to load that namespace from
 * `@nisd2/isms-messages/messages/<ns>/<locale>.json`.
 */
export const SUPPORTED_NAMESPACES = ["common"] as const;
export type Namespace = (typeof SUPPORTED_NAMESPACES)[number];
