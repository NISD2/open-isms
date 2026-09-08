/**
 * The catalogue of every email this product sends.
 *
 * One entry per distinct message. The entry is the message's identity: it
 * names the message in preference settings, in the send log, and in the
 * consent check that runs before delivery. Nothing may be sent that is not
 * in here — `sendMail` takes an id from this table, so adding a new email
 * means adding a row here first, and that row is where someone decides
 * whether a recipient is allowed to switch the message off.
 *
 * Consent modes
 * -------------
 * "essential"  Sent regardless of preferences. Reserved for messages a
 *              person cannot reasonably be asked to opt out of: proof of
 *              identity (sign-in codes), security notices about their own
 *              account, and the confirmation of an action they just took.
 *              Under GDPR/UWG these ride on contract performance, not
 *              consent, which is exactly why the list is short and closed.
 * "user"       Optional mail to someone who has an account. Requires a
 *              recipientUserId at the call site so the gate can look their
 *              preferences up. Every one of these carries an unsubscribe
 *              footer and RFC 8058 headers.
 * "external"   Optional mail to an address with no account (supplier-portal
 *              customers). Consent lives with that subsystem's own token
 *              (supplier.unsubscribedAt); the caller asserts it has checked.
 * "operator"   Mail to the platform operators themselves (PLATFORM_ADMIN_
 *              EMAILS). Not subject to recipient preferences.
 *
 * Categories group types in the preference centre so a person can switch off
 * "reminders" without hunting through individual messages. Both granularities
 * are honoured: an opt-out may name a category or a single type.
 */

export const EMAIL_CATEGORIES = [
  "security",
  "account",
  "work",
  "reminders",
  "product",
  "newsletter",
  "supplier",
  "internal",
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export type ConsentMode = "essential" | "user" | "external" | "operator";

interface EmailTypeDefinition {
  category: EmailCategory;
  consent: ConsentMode;
}

/**
 * Ids are permanent: they are written into opt-out rows, so renaming one
 * silently resubscribes everyone who had switched it off. Retire an email by
 * deleting its entry (the opt-out rows become inert), never by reusing an id
 * for a different message.
 */
export const EMAIL_TYPES = {
  // --- Essential: identity, security, and account state ---------------------
  "auth.verification_code": { category: "security", consent: "essential" },
  "auth.password_reset_code": { category: "security", consent: "essential" },
  "auth.welcome": { category: "account", consent: "essential" },
  "account.contact_email_changed": { category: "security", consent: "essential" },
  "account.invite": { category: "account", consent: "essential" },
  "account.member_removed": { category: "account", consent: "essential" },

  // --- Optional, to account holders ----------------------------------------
  "work.category_assigned": { category: "work", consent: "user" },
  "work.category_unassigned": { category: "work", consent: "user" },
  "work.review_decision": { category: "work", consent: "user" },
  "reminders.daily_digest": { category: "reminders", consent: "user" },
  "reminders.weekly_management_digest": { category: "reminders", consent: "user" },
  "product.course_followup": { category: "product", consent: "user" },
  "product.lifecycle_nudge": { category: "product", consent: "user" },
  "newsletter.issue": { category: "newsletter", consent: "user" },

  // --- Optional, to addresses with no account ------------------------------
  "supplier.invite": { category: "supplier", consent: "external" },
  "supplier.added_you": { category: "supplier", consent: "external" },
  "supplier.incident_broadcast": { category: "supplier", consent: "external" },

  // --- To the platform operators -------------------------------------------
  "internal.new_signup_alert": { category: "internal", consent: "operator" },
  "internal.test_send": { category: "internal", consent: "operator" },
} as const satisfies Record<string, EmailTypeDefinition>;

export type EmailTypeId = keyof typeof EMAIL_TYPES;

/** Ids whose delivery depends on the recipient's stored preferences. */
export type UserConsentEmailTypeId = {
  [K in EmailTypeId]: (typeof EMAIL_TYPES)[K]["consent"] extends "user" ? K : never;
}[EmailTypeId];

/** Ids that bypass the preference gate, for one of the three reasons above. */
export type UngatedEmailTypeId = Exclude<EmailTypeId, UserConsentEmailTypeId>;

export function emailTypeCategory(id: EmailTypeId): EmailCategory {
  return EMAIL_TYPES[id].category;
}

export function emailTypeConsent(id: EmailTypeId): ConsentMode {
  return EMAIL_TYPES[id].consent;
}

export function isUserConsentEmailType(id: EmailTypeId): id is UserConsentEmailTypeId {
  return EMAIL_TYPES[id].consent === "user";
}

/** Every optional type, grouped by category — the preference centre's model. */
export function optionalEmailTypesByCategory(): Array<{
  category: EmailCategory;
  types: UserConsentEmailTypeId[];
}> {
  const grouped = new Map<EmailCategory, UserConsentEmailTypeId[]>();
  for (const id of Object.keys(EMAIL_TYPES) as EmailTypeId[]) {
    if (!isUserConsentEmailType(id)) continue;
    const category = emailTypeCategory(id);
    const list = grouped.get(category) ?? [];
    list.push(id);
    grouped.set(category, list);
  }
  // Registry order, so the centre lists categories the way this file reads.
  return EMAIL_CATEGORIES.filter((c) => grouped.has(c)).map((category) => ({
    category,
    types: grouped.get(category) ?? [],
  }));
}
