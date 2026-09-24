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
 *     and `items`, and there is **no finalize call**: it is created as `unpaid`
 *   - the PDF is generated asynchronously, so `attachment_id` has to be polled for
 *
 * Nothing here throws on an API failure. Billing sits on the path to taking money and a third
 * party being slow must surface as a value the caller can decide about, not as an exception that
 * takes a request down.
 */

export interface QontoConfig {
  readonly baseUrl: string;
  readonly login: string;
  readonly secretKey: string;
  /** Required for the sandbox host, absent in production. */
  readonly stagingToken?: string;
}

/** Reads config from the environment. Returns null rather than throwing when it is not set up. */
export const qontoConfigFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): QontoConfig | null => {
  const baseUrl = env.QONTO_API_BASE ?? "https://thirdparty.qonto.com/v2";
  const login = env.QONTO_SANDBOX_LOGIN ?? env.QONTO_LOGIN ?? "";
  const secretKey = env.QONTO_SANDBOX_SECRET_KEY ?? env.QONTO_SECRET_KEY ?? "";
  if (!login || !secretKey) return null;
  const stagingToken = env.QONTO_STAGING_TOKEN;
  return stagingToken
    ? { baseUrl, login, secretKey, stagingToken }
    : { baseUrl, login, secretKey };
};

export type QontoResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly status: number | null; readonly error: string };

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

const request = async <T>(
  c: QontoConfig,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<QontoResult<T>> => {
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

  const json: unknown = text ? JSON.parse(text) : null;
  return { ok: true, data: json as T };
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
 * A client record. `kind` is always "company": §7.8 records that a non-business cannot buy this
 * product, so the individual and freelancer variants are unreachable for us.
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
    readonly status?: string;
    readonly attachment_id?: string | null;
    readonly total_amount?: { readonly value?: string; readonly currency?: string };
  };
}

/**
 * Create the invoice. It lands as `unpaid` immediately; there is no finalize step. The PDF is
 * produced asynchronously, so `attachment_id` is usually null in this response and has to be
 * polled for afterwards.
 */
export const createInvoice = (
  c: QontoConfig,
  input: InvoiceInput,
): Promise<QontoResult<InvoiceRecord>> =>
  request<InvoiceRecord>(c, "POST", "/client_invoices", {
    client_id: input.clientId,
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
    items: input.items.map((i) => ({
      title: i.title,
      ...(i.description ? { description: i.description } : {}),
      quantity: i.quantity,
      unit: i.unit,
      unit_price: i.unitPrice,
      vat_rate: i.vatRate,
    })),
  });

export const getInvoice = (
  c: QontoConfig,
  id: string,
): Promise<QontoResult<InvoiceRecord>> =>
  request<InvoiceRecord>(c, "GET", `/client_invoices/${encodeURIComponent(id)}`);

/** Sends the invoice to the billing email. §7.8: that is usually not the person who signed up. */
export const sendInvoiceByEmail = (
  c: QontoConfig,
  id: string,
  to: readonly string[],
  copyTo: readonly string[] = [],
): Promise<QontoResult<unknown>> =>
  request<unknown>(c, "POST", `/client_invoices/${encodeURIComponent(id)}/send`, {
    recipients: to,
    ...(copyTo.length ? { copy_to: copyTo } : {}),
  });
