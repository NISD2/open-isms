/**
 * The address the help offer is reachable at, defined once.
 *
 * It was previously written twice with two different values: the in-product
 * HelpDialog copied cory@nisd2.eu to the clipboard while /hilfe, which that
 * same dialog links to two rows below, mailed contact@nisd2.eu. One request,
 * two inboxes, depending on which affordance the user took.
 *
 * The public page won the tie because its value is the one already repeated
 * across the translated copy. Changing it is a one-line edit here; the copies
 * still inlined inside messages/help/*.json (contact.p1, referral.s8) are the
 * remaining duplicates and want folding into a placeholder next.
 */
export const SUPPORT_EMAIL = "contact@nisd2.eu";
