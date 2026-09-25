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
import type { Database } from "@/lib/db";
import { accountSetupEmail, sendMail } from "@/lib/mail";
import { billingAccount, company, user } from "@/schema";
import { createDraftCompany } from "@/server/trpc/helpers/setup-helpers";
import { alertOperators } from "./alert";
import type { OrderInput } from "./order";
import { type OrderOutcome, type PlaceOrderInput, placeOrder } from "./place-order";
import { splitVatNumber } from "./vies";

export interface CloseDealInput {
  readonly db: Database;
  readonly mode: PlaceOrderInput["mode"];
  readonly customerEmail: string;
  readonly customerName: string;
  readonly order: OrderInput;
  readonly netCentsOverride: number | null;
  readonly adminUserId: string;
  readonly invoicePrefix: string;
  readonly vies: PlaceOrderInput["vies"];
  readonly appUrl: string;
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
      companyId: user.companyId,
      passwordHash: user.passwordHash,
      loginCount: user.loginCount,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (!row) throw new Error(`customer ${email} neither inserted nor found`);
  // Idempotent: a user who already has a company gets no second one.
  await createDraftCompany(db, row.id);
  return { ...row, created: inserted.length > 0 };
};

/** The account the customer holds: the one behind their open company, else any they own. */
const heldAccount = async (db: Database, userId: string) => {
  const [open] = await db
    .select({ id: billingAccount.id })
    .from(user)
    .innerJoin(company, eq(company.id, user.companyId))
    .innerJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(and(eq(user.id, userId), eq(billingAccount.ownerUserId, userId)))
    .limit(1);
  if (open) return open.id;
  const [any] = await db
    .select({ id: billingAccount.id })
    .from(billingAccount)
    .where(eq(billingAccount.ownerUserId, userId))
    .limit(1);
  return any?.id ?? null;
};

const sendSetupLink = async (
  input: CloseDealInput,
  email: string,
  locale: "de" | "en",
) => {
  const token = await createSetupToken(input.db, email);
  const setupUrl = `${input.appUrl}/auth/setup?token=${encodeURIComponent(token)}`;
  const sent = await sendMail({
    emailType: "account.setup",
    to: email,
    ...accountSetupEmail({ setupUrl, locale }),
  });
  if (!sent.success) {
    await alertOperators(`Zugangslink an ${email} nicht gesendet`, [
      "Die Bestellung steht, aber der Link zum Einrichten des Zugangs ging nicht raus.",
      "Die Person kann sich mit Google unter dieser Adresse anmelden oder das Passwort zurücksetzen.",
    ]);
  }
  return sent.success;
};

export async function closeDeal(input: CloseDealInput): Promise<CloseOutcome> {
  const email = input.customerEmail.toLowerCase().trim();
  const locale =
    splitVatNumber(input.order.vatNumber)?.countryCode === "DE" ? "de" : "en";

  const customer = await customerFor(input.db, email, input.customerName.trim(), locale);
  const accountId = await heldAccount(input.db, customer.id);
  if (!accountId) {
    return {
      ok: false,
      reason: "no_owned_account",
      message: `${email} belongs to someone else's account; the account holder orders for it.`,
    };
  }

  const outcome = await placeOrder({
    db: input.db,
    mode: input.mode,
    billingAccountId: accountId,
    order: input.order,
    source: "admin",
    createdByUserId: input.adminUserId,
    invoicePrefix: input.invoicePrefix,
    vies: input.vies,
    expectedGrossCents: null,
    netCentsOverride: input.netCentsOverride,
  });
  if (!outcome.ok) return outcome;

  // Someone who has signed in already has a way in; only a customer who never has gets the link.
  const needsSetup = !customer.passwordHash && customer.loginCount === 0;
  const setupSent = needsSetup ? await sendSetupLink(input, email, locale) : false;
  return { ...outcome, createdUser: customer.created, setupSent };
}
