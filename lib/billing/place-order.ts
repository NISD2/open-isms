/**
 * Placing an order: the one function both doors call, the order page and the admin demo close.
 *
 *   1. The price comes from the billing account's access level, on the server. No amount is ever
 *      taken from a browser.
 *   2. The customer is found in Qonto by VAT number, or created, and remembered on the account.
 *   3. The invoice number is taken and committed on its own, before Qonto is called (see
 *      document_number_counter): a failed call then leaves a gap, never a duplicate.
 *   4. Qonto issues the invoice; our row is written and the account gets full access, because
 *      access starts at order, not at payment.
 *   5. The PDF, the email and the archive copy follow in the background (./deliver-invoice), since
 *      the PDF takes about ten seconds to exist.
 *
 * The whole order runs under a lock on the account row, so a double click, or two people ordering
 * for the same account, produces one invoice: the second waits, then finds the first.
 */
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import type { Database, DbOrTx } from "@/lib/db";
import { billingAccount, creditNote, documentNumberCounter, invoice } from "@/schema";
import { alertOperators } from "./alert";
import { deliverInvoice } from "./deliver-invoice";
import { pickPayableAccount } from "./iban";
import { invoiceNumber, sandboxInvoiceNumber } from "./invoice-number";
import {
  INVOICE_TIME_ZONE,
  invoiceDates,
  invoiceWording,
  netCentsFor,
  type OrderInput,
  priceFor,
} from "./order";
import type { OrderingMode } from "./ordering";
import {
  createClient,
  createInvoice,
  findClientsByVatNumber,
  listBankAccounts,
  type QontoConfig,
} from "./qonto";
import { checkVatNumber, splitVatNumber, type ViesConfig } from "./vies";

export type OrderOutcome =
  | {
      readonly ok: true;
      readonly number: string;
      readonly netCents: number;
      readonly vatCents: number;
      readonly grossCents: number;
      readonly dueDate: string;
      readonly periodEnd: string;
    }
  | {
      readonly ok: false;
      readonly reason:
        | "already_ordered"
        | "invalid_vat"
        | "no_account"
        | "price_changed"
        /** Qonto refused: nothing was issued. */
        | "qonto"
        /** Qonto did not answer clearly: an invoice may exist, and the operators are told. */
        | "qonto_unknown";
      readonly message: string;
    };

export interface PlaceOrderInput {
  readonly db: Database;
  readonly mode: Exclude<OrderingMode, { readonly kind: "off" }>;
  readonly billingAccountId: string;
  readonly order: OrderInput;
  readonly source: "self_serve" | "admin";
  readonly createdByUserId: string;
  readonly invoicePrefix: string;
  readonly vies: ViesConfig;
  /**
   * The gross the customer was shown, when they were shown one. The register is asked again here
   * and may answer differently, so an order whose price moved is refused rather than invoiced at a
   * price nobody agreed to.
   */
  readonly expectedGrossCents: number | null;
  readonly now?: Date;
}

const failure = (
  reason: Extract<OrderOutcome, { ok: false }>["reason"],
  message: string,
) => ({ ok: false, reason, message }) as const;

/** Today as a calendar day where invoices are dated, to compare against a paid year. */
const today = (now: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: INVOICE_TIME_ZONE }).format(now);

/**
 * The invoice that pays for the account right now: its year has not ended and it was not credited.
 * One definition for the order's refusal and the billing page, so they cannot disagree.
 */
export const findActiveInvoice = async (
  db: DbOrTx,
  billingAccountId: string,
  now: Date,
) => {
  const [active] = await db
    .select({ id: invoice.id, number: invoice.number, periodEnd: invoice.periodEnd })
    .from(invoice)
    .leftJoin(creditNote, eq(creditNote.invoiceId, invoice.id))
    .where(
      and(
        eq(invoice.billingAccountId, billingAccountId),
        gte(invoice.periodEnd, today(now)),
        isNull(creditNote.id),
      ),
    )
    .orderBy(desc(invoice.periodEnd))
    .limit(1);
  return active ?? null;
};

/**
 * The next real invoice number, committed on its own (the pool, not the order's transaction), so a
 * Qonto failure afterwards cannot return a number that another order then takes as well.
 */
const takeInvoiceNumber = async (db: Database, prefix: string, year: number) => {
  const [row] = await db
    .insert(documentNumberCounter)
    .values({ series: "invoice", year, lastValue: 1 })
    .onConflictDoUpdate({
      target: [documentNumberCounter.series, documentNumberCounter.year],
      set: { lastValue: sql`${documentNumberCounter.lastValue} + 1` },
    })
    .returning({ lastValue: documentNumberCounter.lastValue });
  if (!row) throw new Error("invoice number counter returned no row");
  return invoiceNumber(prefix, year, row.lastValue);
};

/**
 * A Qonto client with this VAT number that no other billing account holds. A client belongs to one
 * account (`billing_account.qonto_client_id` is unique), so a second account for the same company
 * gets a client of its own. Reusing the first one would fail on that constraint only after Qonto
 * had issued the invoice, leaving an invoice we never recorded.
 */
const unclaimedClient = async (
  tx: DbOrTx,
  qonto: QontoConfig,
  canonicalVatNumber: string,
): Promise<string | undefined> => {
  const found = await findClientsByVatNumber(qonto, canonicalVatNumber);
  const ids = found.ok
    ? (found.data.clients ?? []).flatMap((c) => (c.id ? [c.id] : []))
    : [];
  if (ids.length === 0) return undefined;
  const claimed = await tx
    .select({ id: billingAccount.qontoClientId })
    .from(billingAccount)
    .where(inArray(billingAccount.qontoClientId, ids));
  return ids.find((id) => !claimed.some((c) => c.id === id));
};

/** The customer's Qonto client: remembered, found by VAT number, or created. */
const qontoClientFor = async (
  tx: DbOrTx,
  qonto: QontoConfig,
  known: string | null,
  order: OrderInput,
  canonicalVatNumber: string,
  locale: "de" | "en",
): Promise<{ ok: true; id: string } | { ok: false; message: string }> => {
  if (known) return { ok: true, id: known };
  const existing = await unclaimedClient(tx, qonto, canonicalVatNumber);
  if (existing) return { ok: true, id: existing };
  const created = await createClient(qonto, {
    name: order.companyName,
    email: order.invoiceEmail,
    vatNumber: canonicalVatNumber,
    taxIdentificationNumber: canonicalVatNumber,
    address: {
      street_address: order.street,
      city: order.city,
      zip_code: order.zip,
      country_code: order.countryCode,
    },
    locale: locale === "de" ? "DE" : "EN",
    currency: "EUR",
  });
  const id = created.ok ? created.data.client?.id : undefined;
  return id
    ? { ok: true, id }
    : { ok: false, message: created.ok ? "no client id" : created.error };
};

export async function placeOrder(input: PlaceOrderInput): Promise<OrderOutcome> {
  const { db, mode, order } = input;
  const now = input.now ?? new Date();

  const vat = splitVatNumber(order.vatNumber);
  if (!vat) return failure("invalid_vat", "The VAT number does not name a member state.");
  const canonicalVatNumber = `${vat.countryCode}${vat.vatNumber}`;
  const locale = vat.countryCode === "DE" ? "de" : "en";

  // Network calls that decide nothing about the account run before the lock is taken.
  const registry = await checkVatNumber(order.vatNumber, input.vies);
  const accounts = await listBankAccounts(mode.qonto);
  const iban = accounts.ok
    ? pickPayableAccount(accounts.data.bank_accounts ?? [])?.iban
    : undefined;
  if (!iban) return failure("qonto", "No Qonto account with a payable IBAN.");

  const outcome = await db.transaction(async (tx) => {
    const [account] = await tx
      .select({
        id: billingAccount.id,
        accessLevel: billingAccount.accessLevel,
        qontoClientId: billingAccount.qontoClientId,
      })
      .from(billingAccount)
      .where(eq(billingAccount.id, input.billingAccountId))
      .for("update");
    if (!account)
      return failure("no_account", "This organization has no billing account.");

    const active = await findActiveInvoice(tx, account.id, now);
    if (active) {
      return failure(
        "already_ordered",
        `This account is already paid for, invoice ${active.number}.`,
      );
    }

    const money = priceFor(vat.countryCode, registry, netCentsFor(account.accessLevel));
    if (
      input.expectedGrossCents !== null &&
      money.grossCents !== input.expectedGrossCents
    ) {
      return failure("price_changed", "The price changed since it was shown.");
    }

    // Two accounts ordering for one VAT number at once would otherwise both pick the same unclaimed
    // Qonto client, and the second would fail on it after Qonto had issued its invoice.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${canonicalVatNumber}))`);
    const client = await qontoClientFor(
      tx,
      mode.qonto,
      account.qontoClientId,
      order,
      canonicalVatNumber,
      locale,
    );
    if (!client.ok) return failure("qonto", `Qonto client: ${client.message}`);

    const dates = invoiceDates(now);
    const year = Number(dates.issueDate.slice(0, 4));
    // The sandbox never touches the real counter: its invoices are not real ones.
    const number =
      mode.kind === "live"
        ? await takeInvoiceNumber(db, input.invoicePrefix, year)
        : sandboxInvoiceNumber(input.invoicePrefix, year, now);
    const wording = invoiceWording(dates, money, locale);

    const issued = await createInvoice(mode.qonto, {
      clientId: client.id,
      number,
      iban,
      issueDate: dates.issueDate,
      dueDate: dates.dueDate,
      performanceStartDate: dates.performanceStartDate,
      performanceEndDate: dates.performanceEndDate,
      ...(order.purchaseOrder ? { purchaseOrder: order.purchaseOrder } : {}),
      termsAndConditions: wording.footer,
      items: [
        {
          title: wording.title,
          description: wording.description,
          quantity: "1",
          unit: "unit",
          unitPrice: { value: (money.netCents / 100).toFixed(2), currency: "EUR" },
          vatRate: money.vatRate.toFixed(2),
        },
      ],
    });
    const qontoInvoiceId = issued.ok ? issued.data.client_invoice?.id : undefined;
    if (!qontoInvoiceId) {
      // A 4xx is Qonto refusing, so nothing exists. A timeout, a 5xx or a 2xx without an id can
      // mean the invoice was created and the answer lost; a retry would then issue a second one.
      const refused = !issued.ok && issued.status !== null && issued.status < 500;
      if (refused) {
        console.error(
          `[billing] invoice ${number} refused; the number stays unused`,
          issued,
        );
        return failure("qonto", "Qonto did not issue the invoice.");
      }
      void alertOperators(`Unklar, ob ${number} ausgestellt wurde`, [
        `Qonto hat auf die Rechnung ${number} nicht eindeutig geantwortet: ${issued.ok ? "kein id" : issued.error}.`,
        `Billing account ${account.id}, Qonto client ${client.id}.`,
        "In Qonto nachsehen. Gibt es die Rechnung, die Zeile von Hand anlegen und den Zugang freischalten, oder gutschreiben.",
      ]);
      return failure("qonto_unknown", "Qonto did not answer clearly.");
    }

    try {
      const [row] = await tx
        .insert(invoice)
        .values({
          billingAccountId: account.id,
          qontoInvoiceId,
          number,
          netCents: money.netCents,
          vatCents: money.vatCents,
          vatTreatment: money.treatment.kind,
          viesRequestIdentifier:
            registry.status === "valid" ? registry.consultationNumber : null,
          issueDate: dates.issueDate,
          periodStart: dates.performanceStartDate,
          periodEnd: dates.performanceEndDate,
          source: input.source,
          createdByUserId: input.createdByUserId,
        })
        .returning({ id: invoice.id });
      if (!row) throw new Error("invoice insert returned no row");
      await tx
        .update(billingAccount)
        .set({ accessLevel: "full", qontoClientId: client.id, updatedAt: now })
        .where(eq(billingAccount.id, account.id));
      return {
        ok: true,
        number,
        invoiceRowId: row.id,
        qontoInvoiceId,
        money,
        dates,
      } as const;
    } catch (err) {
      // Qonto has issued an invoice we could not record. It needs a person: credit it in Qonto or
      // insert the row by hand. Sent with everything needed to do either.
      void alertOperators(`${number} ausgestellt, aber nicht erfasst`, [
        `Qonto hat ${number} (${qontoInvoiceId}) ausgestellt, der Eintrag bei uns ist fehlgeschlagen.`,
        `Billing account ${account.id}, Qonto client ${client.id}.`,
        `Fehler: ${err instanceof Error ? err.message : String(err)}`,
        "Die Zeile von Hand anlegen und den Zugang freischalten, oder in Qonto gutschreiben.",
      ]);
      throw err;
    }
  });

  if (!outcome.ok) return outcome;

  deliverInvoice({
    db,
    qonto: mode.qonto,
    invoiceRowId: outcome.invoiceRowId,
    qontoInvoiceId: outcome.qontoInvoiceId,
    number: outcome.number,
    billingAccountId: input.billingAccountId,
    recipients: [order.invoiceEmail, ...(order.copyToEmail ? [order.copyToEmail] : [])],
    locale,
  }).catch((err) =>
    alertOperators(`${outcome.number} nicht zugestellt`, [
      `Die Zustellung der Rechnung ${outcome.number} ist abgebrochen: ${err instanceof Error ? err.message : String(err)}.`,
      "Aus Qonto von Hand senden.",
    ]),
  );

  return {
    ok: true,
    number: outcome.number,
    netCents: outcome.money.netCents,
    vatCents: outcome.money.vatCents,
    grossCents: outcome.money.grossCents,
    dueDate: outcome.dates.dueDate,
    periodEnd: outcome.dates.performanceEndDate,
  };
}
