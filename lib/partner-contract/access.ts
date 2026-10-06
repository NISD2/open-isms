/**
 * The partner's access to the NIS 2 Durchgang, set up when an agreement is offered, so the partner
 * can look at what their clients would get before signing anything. The contact email's user is
 * found, or created without a password with its own company and billing account the way a sale on
 * a call does (lib/billing/close-deal.ts), and the account they hold is set to full. No invoice: the
 * Subscriptions tab lists it with none, and its revoke takes the access back.
 *
 * A first password can be set from the agreement page only for a user this offer created and that
 * nobody has signed into since: the link to that page is the invitation. An address that already
 * had an account signs in the usual way, so a forwarded link never opens someone else's account.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { createSetupToken } from "@/lib/auth/setup-link";
import { hasGotIn } from "@/lib/billing/access";
import { customerFor, heldAccount } from "@/lib/billing/close-deal";
import { revokeAccess } from "@/lib/billing/subscriptions";
import type { Database } from "@/lib/db";
import { maskAddress } from "@/lib/mail/mask-address";
import { billingAccount, type partnerAccessOutcomeEnum, user } from "@/schema";
import type { PartnerContractLocale } from "./date";

export const PARTNER_ACCESS_ACTION = "billing.partner_access_granted";

export type PartnerAccessOutcome = (typeof partnerAccessOutcomeEnum.enumValues)[number];

export interface ProvisionedAccess {
  readonly outcome: PartnerAccessOutcome;
  /** Set when access was granted: the user it belongs to. */
  readonly userId: string | null;
}

const provision = async (
  db: Database,
  contact: { readonly email: string; readonly name: string },
  locale: PartnerContractLocale,
): Promise<ProvisionedAccess> => {
  const email = contact.email.toLowerCase().trim();
  const person = await customerFor(db, email, contact.name, locale);
  const account = await heldAccount(db, person.id);
  if (!account) return { outcome: "not_holder", userId: null };

  await db
    .update(billingAccount)
    .set({ accessLevel: "full", updatedAt: new Date() })
    .where(eq(billingAccount.id, account.id));
  logAudit({
    companyId: null,
    userId: person.id,
    action: PARTNER_ACCESS_ACTION,
    entityType: "billing_account",
    entityId: account.id,
    description: "Full access with a partner agreement offer",
  });
  return {
    outcome: person.created ? "new_account" : "existing_account",
    userId: person.id,
  };
};

/** Never throws: the offer is saved either way, and the outcome says what happened. */
export const provisionPartnerAccess = (
  db: Database,
  contact: { readonly email: string; readonly name: string },
  locale: PartnerContractLocale,
): Promise<ProvisionedAccess> =>
  provision(db, contact, locale).catch((err: unknown) => {
    console.error(
      `[partner-contract] access for ${maskAddress(contact.email)} failed`,
      err,
    );
    return { outcome: "failed", userId: null };
  });

interface OfferAccess {
  readonly accessOutcome: PartnerAccessOutcome | null;
  readonly accessUserId: string | null;
}

/** The address of the account this offer created, while nobody has signed into it yet. */
const firstPasswordEmail = async (
  db: Database,
  offer: OfferAccess,
): Promise<string | null> => {
  if (offer.accessOutcome !== "new_account" || !offer.accessUserId) return null;
  const [person] = await db
    .select({
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      loginCount: user.loginCount,
      lastLoginAt: user.lastLoginAt,
    })
    .from(user)
    .where(eq(user.id, offer.accessUserId))
    .limit(1);
  return person && !hasGotIn(person) ? person.email : null;
};

/** What the agreement page shows about access: whose it is and which way in. Null: none. */
export const partnerAccessShown = async (
  db: Database,
  offer: OfferAccess & { readonly partnerEmail: string | null },
): Promise<{ readonly email: string; readonly entry: "setup" | "signin" } | null> => {
  const granted =
    offer.accessOutcome === "new_account" || offer.accessOutcome === "existing_account";
  if (!granted || !offer.partnerEmail) return null;
  const setup = await firstPasswordEmail(db, offer);
  return { email: offer.partnerEmail, entry: setup ? "setup" : "signin" };
};

/** Where the access button leads: a first password where allowed, otherwise the sign-in. */
export const partnerAccessEntry = async (
  db: Database,
  offer: OfferAccess,
): Promise<
  { readonly kind: "setup"; readonly path: string } | { readonly kind: "signin" }
> => {
  const email = await firstPasswordEmail(db, offer);
  if (!email) return { kind: "signin" };
  const token = await createSetupToken(db, email);
  return { kind: "setup", path: `/auth/setup?token=${encodeURIComponent(token)}` };
};

/**
 * Taking an offer back also takes back the access it created. An account that existed before the
 * offer keeps its level: it may be paid for.
 */
export const revokePartnerAccess = async (
  db: Database,
  offer: OfferAccess,
): Promise<void> => {
  if (offer.accessOutcome !== "new_account" || !offer.accessUserId) return;
  const account = await heldAccount(db, offer.accessUserId);
  if (account) await revokeAccess(db, account.id);
};
