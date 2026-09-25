/**
 * Qonto Business API client, for issuing the annual invoice.
 *
 * Verified against docs.qonto.com on 24.09.2026:
 *
 *   - auth is `Authorization: {login}:{secret}`, colon separated, **no base64**
 *   - production is https://thirdparty.qonto.com/v2, sandbox is
 *     https://thirdparty-sandbox.staging.qonto.co/v2
 *   - the sandbox additionally needs an `X-Qonto-Staging-Token` header, or every request is
 *     bounced to a OneLogin redirect
 *   - a client must exist before an invoice can name it; inline creation is not supported
 *   - an invoice needs `client_id`, `issue_date`, `due_date`, `currency`, `payment_methods.iban`
 *     and `items`; it is created as `unpaid` unless `status: "draft"` is sent, and a draft is
 *     finalized with its own call
 *   - the PDF is generated asynchronously, so `attachment_id` has to be polled for
 *
 * Nothing here throws on an API failure. Billing sits on the path to taking money and a third
 * party being slow must surface as a value the caller can decide about, not as an exception that
 * takes a request down.
 */
import { QONTO_PRODUCTION_BASE, QONTO_SANDBOX_HOST } from "./config-schema";
import { httpsHostOf } from "./sandbox-gate";

export interface QontoConfig {
  readonly baseUrl: string;
  readonly login: string;
  readonly secretKey: string;
  /** Required for the sandbox host, absent in production. */
  readonly stagingToken?: string;
}

const QONTO_PRODUCTION_HOST = new URL(QONTO_PRODUCTION_BASE).hostname;

/** The settings the client needs, as the validated environment provides them. */
export interface QontoEnv {
  readonly QONTO_API_BASE: string;
  readonly QONTO_LOGIN?: string | undefined;
  readonly QONTO_SECRET_KEY?: string | undefined;
  readonly QONTO_SANDBOX_LOGIN?: string | undefined;
  readonly QONTO_SANDBOX_SECRET_KEY?: string | undefined;
  readonly QONTO_STAGING_TOKEN?: string | undefined;
}

/**
 * Builds the client config from the validated environment. Returns null rather than throwing when
 * it is not set up.
 *
 * Credentials only ever go to one of Qonto's two hosts, over https: anything else, including
 * plain http or a mistyped host, yields no config, and billing is off. The host decides which
 * credentials are used, and each gets only its own: the sandbox pair and the staging token for the
 * sandbox, the production pair for production. There is no fallback between them, so a production
 * secret is never sent to the shared sandbox, and no sandbox credential reaches production.
 */
export const qontoConfigFromEnv = (env: QontoEnv): QontoConfig | null => {
  const baseUrl = env.QONTO_API_BASE;
  const host = httpsHostOf(baseUrl);
  if (host !== QONTO_PRODUCTION_HOST && host !== QONTO_SANDBOX_HOST) return null;
  const sandbox = host === QONTO_SANDBOX_HOST;
  const login = (sandbox ? env.QONTO_SANDBOX_LOGIN : env.QONTO_LOGIN) ?? "";
  const secretKey = (sandbox ? env.QONTO_SANDBOX_SECRET_KEY : env.QONTO_SECRET_KEY) ?? "";
  if (!login || !secretKey) return null;
  const stagingToken = sandbox ? env.QONTO_STAGING_TOKEN : undefined;
  return stagingToken
    ? { baseUrl, login, secretKey, stagingToken }
    : { baseUrl, login, secretKey };
};

type QontoFailure = {
  readonly ok: false;
  readonly status: number | null;
  readonly error: string;
};

export type QontoResult<T> = { readonly ok: true; readonly data: T } | QontoFailure;

const headers = (c: QontoConfig): Record<string, string> => {
  const h: Record<string, string> = {
    // Concatenated with a colon and NOT base64 encoded. Getting this wrong returns 401 with a
    // message that reads like bad credentials rather than a bad format, which wastes an hour.
    Authorization: `${c.login}:${c.secretKey}`,
    accept: "application/json",
  };
  if (c.stagingToken) h["X-Qonto-Staging-Token"] = c.stagingToken;
  return h;
};

type Exchanged =
  | { readonly ok: true; readonly status: number; readonly text: string }
  | QontoFailure;

/** One HTTP exchange. Only transport and non-2xx failures are decided here. */
const exchange = async (
  c: QontoConfig,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<Exchanged> => {
  const init: RequestInit = {
    method,
    headers: body ? { ...headers(c), "content-type": "application/json" } : headers(c),
    signal: AbortSignal.timeout(15_000),
  };
  if (body) init.body = JSON.stringify(body);

  const res = await fetch(`${c.baseUrl}${path}`, init).catch((e: unknown) =>
    e instanceof Error ? e : new Error(String(e)),
  );
  if (res instanceof Error) return { ok: false, status: null, error: res.message };

  const text = await res.text().catch(() => "");
  if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 500) };
  return { ok: true, status: res.status, text };
};

/**
 * A call that answers with a JSON body. An empty or non-JSON 2xx is a failure, not data: the
 * sandbox answers a missing staging token with an HTML login page and status 200, and a caller
 * that reads a field off `null` would throw out of a client that promises never to throw.
 */
const request = async <T>(
  c: QontoConfig,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<QontoResult<T>> => {
  const r = await exchange(c, method, path, body);
  if (!r.ok) return r;
  if (!r.text) return { ok: false, status: r.status, error: "empty response" };
  const parsed = parseJson(r.text);
  if (!parsed.ok) {
    return { ok: false, status: r.status, error: `not JSON: ${r.text.slice(0, 200)}` };
  }
  return { ok: true, data: parsed.value as T };
};

const parseJson = (
  text: string,
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};

// ---------------------------------------------------------------------------
// Discovery: what the account already knows, so nobody types it twice
// ---------------------------------------------------------------------------

export interface Organization {
  readonly organization?: {
    readonly slug?: string;
    readonly legal_name?: string;
    readonly legal_number?: string;
    readonly legal_country?: string;
    readonly vat_number?: string;
    readonly bank_accounts?: readonly BankAccount[];
  };
}

export interface BankAccount {
  readonly slug?: string;
  readonly iban?: string;
  readonly bic?: string;
  readonly currency?: string;
  readonly name?: string;
  readonly status?: string;
}

/** Also the documented way to check that credentials work: a 200 means the pair is good. */
export const getOrganization = (c: QontoConfig): Promise<QontoResult<Organization>> =>
  request<Organization>(c, "GET", "/organization");

export const listBankAccounts = (
  c: QontoConfig,
): Promise<QontoResult<{ readonly bank_accounts?: readonly BankAccount[] }>> =>
  request<{ bank_accounts?: readonly BankAccount[] }>(c, "GET", "/bank_accounts");

// ---------------------------------------------------------------------------
// The customer, and their invoice
// ---------------------------------------------------------------------------

/**
 * A client record. `kind` is always "company": the offer is to businesses only, so the individual
 * and freelancer variants are unreachable for us.
 *
 * `currency`, `locale` and the address are optional to CREATE a client but required to invoice
 * one, and the docs warn that invoice creation may fail without a valid tax number. So everything
 * here is treated as required, which is what the billing form collects.
 */
export interface ClientInput {
  readonly name: string;
  readonly email: string;
  readonly vatNumber: string;
  readonly taxIdentificationNumber?: string;
  readonly address: {
    readonly street_address: string;
    readonly city: string;
    readonly zip_code: string;
    readonly country_code: string;
  };
  readonly locale: "DE" | "EN" | "FR" | "IT" | "ES";
  readonly currency: "EUR";
}

export interface ClientRecord {
  readonly client?: { readonly id?: string; readonly name?: string };
}

export interface ClientList {
  readonly clients?: readonly { readonly id?: string; readonly vat_number?: string }[];
}

/**
 * Clients with this VAT number. Qonto has no uniqueness rule on clients, so a returning customer
 * is found here before a second record is created for them.
 */
export const findClientsByVatNumber = (
  c: QontoConfig,
  vatNumber: string,
): Promise<QontoResult<ClientList>> =>
  request<ClientList>(
    c,
    "GET",
    `/clients?filter[vat_number]=${encodeURIComponent(vatNumber)}`,
  );

export const createClient = (
  c: QontoConfig,
  input: ClientInput,
): Promise<QontoResult<ClientRecord>> =>
  request<ClientRecord>(c, "POST", "/clients", {
    kind: "company",
    name: input.name,
    email: input.email,
    vat_number: input.vatNumber,
    ...(input.taxIdentificationNumber
      ? { tax_identification_number: input.taxIdentificationNumber }
      : {}),
    locale: input.locale,
    currency: input.currency,
    billing_address: input.address,
  });

export interface InvoiceLine {
  readonly title: string;
  readonly description?: string;
  readonly quantity: string;
  readonly unit: string;
  /** Net price per unit. */
  readonly unitPrice: { readonly value: string; readonly currency: "EUR" };
  /** A decimal, so nineteen percent is "0.19" and reverse charge is "0". */
  readonly vatRate: string;
}

export interface InvoiceInput {
  readonly clientId: string;
  /** Required when Qonto's automatic numbering is off, which it is on this account. */
  readonly number?: string;
  /** The account the customer pays into. Read from listBankAccounts rather than typed. */
  readonly iban: string;
  readonly issueDate: string;
  readonly dueDate: string;
  /** The service period, which is what makes an annual licence legible on the invoice. */
  readonly performanceStartDate?: string;
  readonly performanceEndDate?: string;
  /** The customer's own Bestellnummer, if their accounting asked for one. */
  readonly purchaseOrder?: string;
  /** Where the reverse-charge wording and the payment-reference instruction go. */
  readonly termsAndConditions?: string;
  readonly items: readonly InvoiceLine[];
}

export interface InvoiceRecord {
  readonly client_invoice?: {
    readonly id?: string;
    readonly number?: string;
    /** One of draft, unpaid, paid, canceled (verified on docs.qonto.com, 26.09.2026). */
    readonly status?: string;
    readonly due_date?: string;
    readonly attachment_id?: string | null;
    /** The invoice's public page, open without login for 180 days after issue, dead on cancel. */
    readonly invoice_url?: string;
    readonly client?: { readonly name?: string };
    readonly total_amount?: { readonly value?: string; readonly currency?: string };
  };
}

/**
 * Create the invoice. It lands as `unpaid` immediately; there is no finalize step. The PDF is
 * produced asynchronously, so `attachment_id` is usually null in this response and has to be
 * polled for afterwards.
 */
const itemPayload = (i: InvoiceLine) => ({
  title: i.title,
  ...(i.description ? { description: i.description } : {}),
  quantity: i.quantity,
  unit: i.unit,
  unit_price: i.unitPrice,
  vat_rate: i.vatRate,
});

export const createInvoice = (
  c: QontoConfig,
  input: InvoiceInput,
): Promise<QontoResult<InvoiceRecord>> =>
  request<InvoiceRecord>(c, "POST", "/client_invoices", {
    client_id: input.clientId,
    ...(input.number ? { number: input.number } : {}),
    issue_date: input.issueDate,
    due_date: input.dueDate,
    currency: "EUR",
    payment_methods: { iban: input.iban },
    ...(input.performanceStartDate
      ? { performance_start_date: input.performanceStartDate }
      : {}),
    ...(input.performanceEndDate
      ? { performance_end_date: input.performanceEndDate }
      : {}),
    ...(input.purchaseOrder ? { purchase_order: input.purchaseOrder } : {}),
    ...(input.termsAndConditions
      ? { terms_and_conditions: input.termsAndConditions }
      : {}),
    items: input.items.map(itemPayload),
  });

export const getInvoice = (
  c: QontoConfig,
  id: string,
): Promise<QontoResult<InvoiceRecord>> =>
  request<InvoiceRecord>(c, "GET", `/client_invoices/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------------------
// Credit notes: how an invoice is canceled
// ---------------------------------------------------------------------------

/**
 * A credit note against one invoice. Verified against docs.qonto.com (Create a credit note,
 * `POST /v2/credit_notes`) on 26.09.2026:
 *
 *   - required: `invoice_id`, `issue_date`, `currency`, `reason` (at most 500 characters), `items`
 *   - `number` is required while automatic numbering is off, which it is on this account, at most
 *     40 characters and unique within the organization
 *   - item quantities are sent positive; Qonto negates them
 *   - the credit notes of one invoice may not add up to more than the invoice, and one for the full
 *     amount cancels the invoice automatically, paid or not
 *   - the answer is 201 with `{ credit_note: { id, number, attachment_id, client, ... } }`
 *
 * Not verified: whether `attachment_id` is empty at first and filled later, as it is for invoices.
 * The delivery polls for it either way (./deliver-credit-note).
 */
export interface CreditNoteInput {
  readonly invoiceId: string;
  readonly number?: string;
  readonly issueDate: string;
  readonly reason: string;
  readonly items: readonly InvoiceLine[];
}

export interface CreditNoteRecord {
  readonly credit_note?: {
    readonly id?: string;
    readonly number?: string;
    readonly attachment_id?: string | null;
    readonly client?: { readonly email?: string | null };
  };
}

export const createCreditNote = (
  c: QontoConfig,
  input: CreditNoteInput,
): Promise<QontoResult<CreditNoteRecord>> =>
  request<CreditNoteRecord>(c, "POST", "/credit_notes", {
    invoice_id: input.invoiceId,
    issue_date: input.issueDate,
    currency: "EUR",
    reason: input.reason,
    ...(input.number ? { number: input.number } : {}),
    items: input.items.map(itemPayload),
  });

export const getCreditNote = (
  c: QontoConfig,
  id: string,
): Promise<QontoResult<CreditNoteRecord>> =>
  request<CreditNoteRecord>(c, "GET", `/credit_notes/${encodeURIComponent(id)}`);

export interface AttachmentRecord {
  readonly attachment?: { readonly url?: string };
}

/** An attachment's download link, which Qonto keeps valid for thirty minutes. */
export const getAttachment = (
  c: QontoConfig,
  id: string,
): Promise<QontoResult<AttachmentRecord>> =>
  request<AttachmentRecord>(c, "GET", `/attachments/${encodeURIComponent(id)}`);

/** Larger than any invoice PDF, small enough that a wrong link cannot fill memory. */
const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Download a PDF from a link Qonto handed out. The link is signed and carries no credential of
 * ours, so none is sent. The answer is checked like any other response: https only, a success
 * status, a body that really is a PDF, and a size limit.
 */
export const downloadPdf = async (url: string): Promise<QontoResult<Uint8Array>> => {
  if (!httpsHostOf(url)) return { ok: false, status: null, error: "not an https link" };
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) }).catch(
    (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
  );
  if (res instanceof Error) return { ok: false, status: null, error: res.message };
  if (!res.ok) return { ok: false, status: res.status, error: "download failed" };
  const bytes = new Uint8Array(await res.arrayBuffer().catch(() => new ArrayBuffer(0)));
  if (bytes.length === 0 || bytes.length > MAX_PDF_BYTES) {
    return { ok: false, status: res.status, error: `unexpected size ${bytes.length}` };
  }
  const isPdf = String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (!isPdf) return { ok: false, status: res.status, error: "not a PDF" };
  return { ok: true, data: bytes };
};
