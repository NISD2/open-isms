/**
 * The two addresses the help offer is reachable at, defined once each.
 *
 * They are different on purpose, and e2e/l1/guide.spec.ts:199 pins the
 * in-product one, so this is a routing decision rather than the drift it
 * looks like from the code alone:
 *
 *   PUBLIC   /hilfe, reachable by anyone including people who have never
 *            signed up, goes to the shared inbox.
 *   IN-APP   the HelpDialog a signed-in user sees on their second login is
 *            a direct line, not a queue.
 *
 * They were previously written as two unrelated literals in two files, which
 * is why the split read as an accident. Naming both here keeps the decision
 * visible and makes changing either a one-line edit.
 *
 * Still duplicated: the public address is also inlined inside the translated
 * copy (messages/help/*.json, contact.p1 and referral.s8) in three locales,
 * so changing PUBLIC_SUPPORT_EMAIL alone will not catch those.
 */
export const PUBLIC_SUPPORT_EMAIL = "contact@nisd2.eu";
export const IN_PRODUCT_SUPPORT_EMAIL = "cory@nisd2.eu";
