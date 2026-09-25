/**
 * Create the annual invoice in Qonto.
 *
 * SANDBOX AND PLATFORM ADMINS ONLY, AND ENFORCED HERE. The route answers 404 unless the caller is a
 * platform admin and the configured Qonto host is the sandbox, which is the same rule the page is
 * gated on. Refusing with 404 rather than 403 means that on a real deploy the endpoint is
 * indistinguishable from one that was never written.
 *
 * The tax follows the VAT number, never the address: the country in the VAT number is where the
 * customer is registered for VAT, and it is what decides between German VAT, reverse charge and no
 * German VAT. Reading it from the address would let a German company typed with a foreign address
 * be invoiced without VAT.
 *
 * The order of operations follows the API: a client must exist before an invoice can name it, and
 * the invoice is created directly as unpaid. The PDF is generated asynchronously, so the attachment
 * id is usually absent from the response.
 */
import { type NextRequest, NextResponse } from "next/server";
import { mayUseBillingHarness } from "@/lib/billing/harness-access";
import { formatIban, pickPayableAccount } from "@/lib/billing/iban";
import { isValidInvoicePrefix, sandboxInvoiceNumber } from "@/lib/billing/invoice-number";
import {
  formatEuro,
  invoiceDates,
  invoiceEmailWording,
  invoiceWording,
  orderSchemaWithVatCheck,
  priceFor,
} from "@/lib/billing/order";
import {
  createClient,
  createInvoice,
  getOrganization,
  listBankAccounts,
  qontoConfigFromEnv,
  sendInvoiceByEmail,
} from "@/lib/billing/qonto";
import {
  checkVatNumber,
  splitVatNumber,
  toAttempt,
  viesConfigFromEnv,
} from "@/lib/billing/vies";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  if (!(await mayUseBillingHarness())) {
    return new NextResponse(null, { status: 404 });
  }

  const config = qontoConfigFromEnv(env);
  if (!config) {
    return NextResponse.json(
      {
        error:
          "Qonto is not configured: QONTO_API_BASE must be one of Qonto's hosts over https, with that host's credential pair set.",
      },
      { status: 503 },
    );
  }
  if (!isValidInvoicePrefix(env.INVOICE_PREFIX)) {
    return NextResponse.json(
      { error: "INVOICE_PREFIX must be one to twelve uppercase letters or digits." },
      { status: 503 },
    );
  }

  const parsed = orderSchemaWithVatCheck.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid order",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }
  const order = parsed.data;

  // The schema has already checked the VAT number's structure, so this only fails on a number the
  // check accepted but the splitter cannot read. Refuse rather than fall back to the address.
  const vat = splitVatNumber(order.vatNumber);
  if (!vat) {
    return NextResponse.json(
      { error: "the VAT number does not name a member state" },
      { status: 400 },
    );
  }
  const taxCountry = vat.countryCode;
  // Printed on the invoice as the customer's VAT number, so it goes to Qonto in its one canonical
  // form (country prefix, no spaces), not however it happened to be typed.
  const canonicalVatNumber = `${vat.countryCode}${vat.vatNumber}`;
  const language = taxCountry === "DE" ? "de" : "en";

  // The register is consulted for the record. It cannot stop the invoice; see order-gate.ts.
  const registry = await checkVatNumber(order.vatNumber, viesConfigFromEnv(env));
  const attempt = toAttempt(order.vatNumber, registry);
  const money = priceFor(taxCountry, registry);
  const dates = invoiceDates(new Date());
  const wording = invoiceWording(dates, money, language);

  // The IBAN the invoice endpoint requires is read from the account rather than typed by anyone.
  const accounts = await listBankAccounts(config);
  if (!accounts.ok) {
    return NextResponse.json(
      { error: "could not read bank accounts", detail: accounts.error },
      { status: 502 },
    );
  }
  // Not "the first account with an iban": the sandbox's main account carries a MASKED IBAN full
  // of X characters that Qonto's own invoice endpoint then rejects with a 422. Only an IBAN that
  // passes its own checksum is payable, and it is printed on the invoice, so it has to be right.
  const account = pickPayableAccount(accounts.data.bank_accounts ?? []);
  const iban = account?.iban;
  if (!iban) {
    return NextResponse.json(
      { error: "no account with a valid IBAN on the Qonto organisation" },
      { status: 502 },
    );
  }

  const client = await createClient(config, {
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
    locale: language === "de" ? "DE" : "EN",
    currency: "EUR",
  });
  if (!client.ok) {
    return NextResponse.json(
      { error: "could not create the client", detail: client.error },
      { status: 502 },
    );
  }
  const clientId = client.data.client?.id;
  if (!clientId) {
    return NextResponse.json(
      { error: "Qonto returned a client with no id" },
      { status: 502 },
    );
  }

  // Automatic numbering is off on this account: Qonto answers "number must have a value". The
  // number is also what the payer types as the reference, so it is ours to own either way.
  const number = sandboxInvoiceNumber(
    env.INVOICE_PREFIX,
    Number(dates.issueDate.slice(0, 4)),
  );

  const invoice = await createInvoice(config, {
    clientId,
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
  if (!invoice.ok) {
    return NextResponse.json(
      { error: "could not create the invoice", detail: invoice.error },
      { status: 502 },
    );
  }

  // Creating an invoice does not send it: sending is its own call in the API. It goes to the
  // billing mailbox from the form, with a copy to the person who ordered when they asked for one.
  // A failed send does not fail the order; the invoice exists and can be sent again from Qonto.
  const invoiceId = invoice.data.client_invoice?.id ?? null;
  const recipients = [
    order.invoiceEmail,
    ...(order.copyToEmail ? [order.copyToEmail] : []),
  ];
  const sent = invoiceId
    ? await sendInvoiceByEmail(config, invoiceId, {
        to: recipients,
        ...invoiceEmailWording(number, language),
      })
    : null;

  const org = await getOrganization(config);

  return NextResponse.json({
    ok: true,
    sandbox: true,
    invoice: {
      id: invoiceId,
      number: invoice.data.client_invoice?.number ?? null,
      status: invoice.data.client_invoice?.status ?? null,
      // Usually null on creation: the PDF is generated asynchronously and must be polled for.
      attachmentId: invoice.data.client_invoice?.attachment_id ?? null,
    },
    sent:
      sent === null
        ? { ok: false, error: "no invoice id to send" }
        : sent.ok
          ? { ok: true, to: recipients }
          : { ok: false, status: sent.status, error: sent.error },
    issuedBy: org.ok ? (org.data.organization?.legal_name ?? null) : null,
    paidInto: { account: account?.name ?? null, iban: formatIban(iban) },
    money: {
      net: formatEuro(money.netCents),
      vat: formatEuro(money.vatCents),
      gross: formatEuro(money.grossCents),
      treatment: money.treatment.kind,
    },
    dates,
    vatCheck: attempt,
  });
}
