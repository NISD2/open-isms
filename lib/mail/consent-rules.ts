/**
 * The consent rules, as pure functions over data.
 *
 * Separated from the database and URL work in ./consent so the decision that
 * governs whether a real person hears from us can be read, reasoned about and
 * tested on its own — no db, no env, no network. Everything here is total:
 * same inputs, same answer, every time.
 */
import {
  EMAIL_CATEGORIES,
  EMAIL_TYPES,
  type EmailCategory,
  type EmailTypeId,
  emailTypeCategory,
  isUserConsentEmailType,
} from "./email-types";

export const SCOPE_ALL = "all";

export function categoryScope(category: EmailCategory): string {
  return `category:${category}`;
}

export function typeScope(id: EmailTypeId): string {
  return `type:${id}`;
}

/**
 * Validate a scope arriving from a URL against the registry. Returns the
 * canonical scope string, or null when it names nothing we send — an unknown
 * scope must not be stored, or the table fills with rows that suppress
 * nothing and mislead whoever reads it later.
 *
 * A missing scope means "all", which is what links in already-delivered mail
 * carry and what they have always meant.
 */
export function parseScope(raw: string | null | undefined): string | null {
  if (!raw || raw === SCOPE_ALL) return SCOPE_ALL;
  const [kind, ...rest] = raw.split(":");
  const value = rest.join(":");
  if (kind === "category") {
    return (EMAIL_CATEGORIES as readonly string[]).includes(value)
      ? categoryScope(value as EmailCategory)
      : null;
  }
  if (kind === "type") {
    if (!(value in EMAIL_TYPES)) return null;
    // Offering to switch off mail that is never gated would be a broken
    // promise: the gate ignores such a row.
    return isUserConsentEmailType(value as EmailTypeId)
      ? typeScope(value as EmailTypeId)
      : null;
  }
  return null;
}

/**
 * A recipient's stored choices, resolved once and cheap to query repeatedly —
 * a send loop can load this per recipient and ask about several messages.
 */
export interface EmailConsent {
  allows(id: EmailTypeId): boolean;
  /** Scope keys this person has switched off, for the preference centre. */
  optedOutScopes: ReadonlySet<string>;
  /** True when the coarse legacy switch is on (all optional mail off). */
  allOptionalDisabled: boolean;
}

/** Used when the recipient cannot be found: no proof of permission, no send. */
export const DENY_OPTIONAL: EmailConsent = {
  allows: (id) => !isUserConsentEmailType(id),
  optedOutScopes: new Set([SCOPE_ALL]),
  allOptionalDisabled: true,
};

export function buildEmailConsent(opts: {
  followupsDisabled: boolean;
  scopes: readonly string[];
}): EmailConsent {
  const optedOutScopes = new Set(opts.scopes);
  const allOptionalDisabled = opts.followupsDisabled || optedOutScopes.has(SCOPE_ALL);
  return {
    optedOutScopes,
    allOptionalDisabled,
    allows(id: EmailTypeId): boolean {
      // Essential / external / operator mail is not preference-gated.
      if (!isUserConsentEmailType(id)) return true;
      if (allOptionalDisabled) return false;
      if (optedOutScopes.has(categoryScope(emailTypeCategory(id)))) return false;
      return !optedOutScopes.has(typeScope(id));
    },
  };
}
