/**
 * What a partner gets on accepting: the NIS 2 Durchgang for their own company, so they know what
 * they recommend. Their user is found by the email they accepted with, or created without a
 * password with its own company and billing account, the way a sale on a call does
 * (lib/billing/close-deal.ts), and the account they hold is set to full. No invoice: the Subscriptions
 * tab lists it with none, and its revoke takes the access back when the agreement ends.
 *
 * The setup link goes only into the email to that address, never onto the page: the address is
 * typed, not verified, and the link is what proves it belongs to the person. Never throws, because
 * the acceptance is recorded by the time this runs.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { createSetupToken } from "@/lib/auth/setup-link";
import { hasGotIn } from "@/lib/billing/access";
import { customerFor, heldAccount } from "@/lib/billing/close-deal";
import type { Database } from "@/lib/db";
import { maskAddress } from "@/lib/mail/mask-address";
import { getAppUrl } from "@/lib/utils";
import { billingAccount } from "@/schema";
import type { PartnerContractLocale } from "./date";

export const PARTNER_ACCESS_ACTION = "billing.partner_access_granted";

export type PartnerAccess =
  /** A new account, or one never signed into: the email carries the link to set a password. */
  | { readonly kind: "setup"; readonly setupUrl: string }
  /** Someone who has signed in before: their account now has the Durchgang. */
  | { readonly kind: "existing" }
  /** Nothing granted: the address belongs to an account someone else holds, or a write failed. */
  | { readonly kind: "none"; readonly reason: "not_holder" | "failed" };

export type PartnerAccessKind = PartnerAccess["kind"];

const grant = async (
  db: Database,
  signer: { readonly email: string; readonly name: string },
  locale: PartnerContractLocale,
  contractId: string,
): Promise<PartnerAccess> => {
  const email = signer.email.toLowerCase().trim();
  const person = await customerFor(db, email, signer.name, locale);
  const account = await heldAccount(db, person.id);
  if (!account) return { kind: "none", reason: "not_holder" };

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
    description: `Full access with partner agreement ${contractId}`,
  });

  if (hasGotIn(person)) return { kind: "existing" };
  const token = await createSetupToken(db, email);
  return {
    kind: "setup",
    setupUrl: `${getAppUrl()}/auth/setup?token=${encodeURIComponent(token)}`,
  };
};

export const grantPartnerAccess = (
  db: Database,
  signer: { readonly email: string; readonly name: string },
  locale: PartnerContractLocale,
  contractId: string,
): Promise<PartnerAccess> =>
  grant(db, signer, locale, contractId).catch((err: unknown) => {
    console.error(
      `[partner-contract] access for ${maskAddress(signer.email)} failed`,
      err,
    );
    return { kind: "none", reason: "failed" };
  });
