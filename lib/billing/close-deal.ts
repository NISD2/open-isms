/**
 * Door two: closing a sale on the call, from platform admin.
 *
 * One step for the person on the call: the customer's email and the billing details from their
 * Impressum, optionally a different amount, and:
 *
 *   1. the customer's user is found by email, or created without a password, with a draft company
 *      and its own billing account (the same createDraftCompany a signup gets);
 *   2. the order goes through placeOrder on the account they hold, like door one, with
 *      source "admin";
 *   3. a customer who has never signed in gets an account setup link (lib/auth/setup-link.ts) next
 *      to the invoice.
 *
 * A retry after a failed order finds the user and the account created the first time, so it does
 * not create a second of either.
 */
import "@/lib/server-guard";
import { and, eq } from "drizzle-orm";
import { createSetupToken } from "@/lib/auth/setup-link";
import type { Database, DbOrTx } from "@/lib/db";
import { accountSetupEmail, sendMail } from "@/lib/mail";
import { billingAccount, company, user } from "@/schema";
import { createDraftCompany } from "@/server/trpc/helpers/setup-helpers";
import { hasGotIn } from "./access";
import { alertOperators } from "./alert";
import { holderNetCents } from "./holder-price";
import type { OrderInput } from "./order";
import { type OrderOutcome, type PlaceOrderInput, placeOrder } from "./place-order";
import { TERMS_VERSION } from "./terms";
import { splitVatNumber } from "./vies";

export interface CloseDealInput {
  readonly db: Database;
  readonly mode: PlaceOrderInput["mode"];
  readonly customerEmail: string;
  readonly customerName: string;
  readonly order: OrderInput;
  readonly netCentsOverride: number | null;
  /** The gross the admin confirmed; the order is refused if the price moved (door one's guard). */
  readonly expectedGrossCents: number;
  readonly adminUserId: string;
  readonly invoicePrefix: string;
  readonly vies: PlaceOrderInput["vies"];
  readonly appUrl: string;
  /**
   * The admin records that the customer accepted the AGB and AVV (./terms) on the call. Stored on
   * the invoice as the customer's acceptance; not required, because the call is the contract.
   */
  readonly termsAcceptedOnCall: boolean;
}

export type CloseOutcome =
  | (Extract<OrderOutcome, { ok: true }> & {
      readonly createdUser: boolean;
      readonly setupSent: boolean;
    })
  | Extract<OrderOutcome, { ok: false }>
  | { readonly ok: false; readonly reason: "no_owned_account"; readonly message: string };

/** The customer's user, created without a password (and with a draft company) when new. */
const customerFor = async (
  db: Database,
  email: string,
  name: string,
  locale: "de" | "en",
) => {
  const inserted = await db
    .insert(user)
    .values({ email, name, locale })
    .onConflictDoNothing({ target: user.email })
    .returning({ id: user.id });
  const [row] = await db
    .select({
      id: user.id,
      emailVerifiedAt: user.emailVerifiedAt,
      loginCount: user.loginCount,
      lastLoginAt: user.lastLoginAt,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (!row) throw new Error(`customer ${email} neither inserted nor found`);
  // Idempotent: a user who already has a company gets no second one.
  const draft = await createDraftCompany(db, row.id);
  // A customer sold to on a call never got in before the paywall, so their fresh account is free,
  // not the grandfathered level a signup gets before the launch. The order makes it full; if the
  // order fails, it stays free rather than holding the free journey nobody promised them.
  if (inserted.length > 0 && draft) {
    await db
      .update(billingAccount)
      .set({ accessLevel: "free" })
      .where(
        eq(
          billingAccount.id,
          db
            .select({ id: company.billingAccountId })
            .from(company)
            .where(eq(company.id, draft.companyId)),
        ),
      );
  }
  return { ...row, created: inserted.length > 0 };
};

/** The account the customer holds: the one behind their open company, else any they own. */
const heldAccount = async (db: DbOrTx, userId: string) => {
  const columns = { id: billingAccount.id };
  const [open] = await db
    .select(columns)
    .from(user)
    .innerJoin(company, eq(company.id, user.companyId))
    .innerJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(and(eq(user.id, userId), eq(billingAccount.ownerUserId, userId)))
    .limit(1);
  if (open) return open;
  const [any] = await db
    .select(columns)
    .from(billingAccount)
    .where(eq(billingAccount.ownerUserId, userId))
    .limit(1);
  return any ?? null;
};

/**
 * The net a close invoices, decided once for the quote and the order. An agreed amount wins.
 * Otherwise the customer is priced as the holder they will be (./holder-price): a grandfathered
 * person pays 2.400, and anyone else (someone new, or someone a failed earlier close created and
 * who never got in) pays the list price. Deciding by the person rather than by the account keeps a
 * retry at the same price as the first attempt.
 */
export const closeNetCents = async (
  db: DbOrTx,
  customerEmail: string,
  override: number | null,
): Promise<number> => {
  if (override !== null) return override;
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, customerEmail.toLowerCase().trim()))
    .limit(1);
  return holderNetCents(db, existing?.id ?? null);
};

const sendSetupLink = async (
  input: CloseDealInput,
  email: string,
  locale: "de" | "en",
) => {
  // The invoice exists by now, so nothing here may fail the close: a failure is told to the
  // operators and the close still reports its invoice.
  const sent = await createSetupToken(input.db, email)
    .then((token) =>
      sendMail({
        emailType: "account.setup",
        to: email,
        ...accountSetupEmail({
          setupUrl: `${input.appUrl}/auth/setup?token=${encodeURIComponent(token)}`,
          locale,
        }),
      }),
    )
    .then((r) => r.success)
    .catch((err: unknown) => {
      console.error(`[billing] setup link for ${email} failed`, err);
      return false;
    });
  if (!sent) {
    await alertOperators(`Zugangslink an ${email} nicht gesendet`, [
      "Die Bestellung steht, aber der Link zum Einrichten des Zugangs ging nicht raus.",
      "Die Person kann sich mit Google unter dieser Adresse anmelden oder das Passwort zurücksetzen.",
    ]);
  }
  return sent;
};

export async function closeDeal(input: CloseDealInput): Promise<CloseOutcome> {
  const email = input.customerEmail.toLowerCase().trim();
  const locale =
    splitVatNumber(input.order.vatNumber)?.countryCode === "DE" ? "de" : "en";

  // Priced before the customer is created, so a new customer is priced as new.
  const netCents = await closeNetCents(input.db, email, input.netCentsOverride);
  const customer = await customerFor(input.db, email, input.customerName.trim(), locale);
  const account = await heldAccount(input.db, customer.id);
  if (!account) {
    return {
      ok: false,
      reason: "no_owned_account",
      message: `${email} belongs to someone else's account; the account holder orders for it.`,
    };
  }

  const outcome = await placeOrder({
    db: input.db,
    mode: input.mode,
    billingAccountId: account.id,
    order: input.order,
    source: "admin",
    createdByUserId: input.adminUserId,
    invoicePrefix: input.invoicePrefix,
    vies: input.vies,
    expectedGrossCents: input.expectedGrossCents,
    netCentsOverride: netCents,
    terms: input.termsAcceptedOnCall
      ? { version: TERMS_VERSION, acceptedByUserId: customer.id }
      : null,
  });
  if (!outcome.ok) return outcome;

  // Someone who has got in already has a way in (lib/billing/access.ts hasGotIn). Everyone else
  // gets the link, including a person who registered but never verified their email.
  const setupSent = hasGotIn(customer)
    ? false
    : await sendSetupLink(input, email, locale);
  return { ...outcome, createdUser: customer.created, setupSent };
}
