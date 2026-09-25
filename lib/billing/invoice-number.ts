/**
 * Invoice numbers.
 *
 * Needed because the account has Qonto's automatic numbering switched off, which the API told us
 * plainly: `number must have a value`. That answers an open question rather than being a
 * workaround, and it makes the number ours to own.
 *
 * It matters twice over. German VAT law wants each invoice number assigned once, and **the number
 * is what the customer types into the Verwendungszweck**, so it is also the key Qonto matches an
 * incoming transfer on. A number that is hard to transcribe is a payment that lands unmatched.
 *
 * So: uppercase, no lookalike characters, one obvious separator, year in the middle so a human can
 * see at a glance which year a payment belongs to. The prefix comes from the validated environment
 * (INVOICE_PREFIX, default RE, because Qonto only matches transfers by itself for prefixes it
 * recognises); this module has no default of its own.
 */

/**
 * A usable prefix: one to twelve uppercase letters or digits, so the whole number stays a single
 * unbroken token a payer can type into a transfer reference.
 */
export const isValidInvoicePrefix = (prefix: string): boolean =>
  /^[A-Z0-9]{1,12}$/.test(prefix);

/** Zero-padded so the numbers sort as text and line up in a column. */
const pad = (n: number, width = 4): string => String(n).padStart(width, "0");

/**
 * Build one invoice number from an explicit sequence. Pure, so it is testable and so the caller is
 * forced to have decided where the sequence comes from.
 *
 * PRODUCTION NEEDS A REAL COUNTER, taken from the database so that no number is ever issued twice.
 * This function deliberately does not invent one: passing a sequence in means the caller cannot
 * pretend the problem is solved.
 */
export const invoiceNumber = (prefix: string, year: number, sequence: number): string =>
  `${prefix}-${year}-${pad(sequence)}`;

/**
 * A number for the sandbox, where there is no counter and none is wanted. Derived from the clock so
 * repeated manual runs do not collide: the Unix time in seconds, kept to eight digits, which repeats
 * only after about three years. The year is passed in, so it matches the invoice's own issue date.
 *
 * Never use this for a real invoice: two requests in the same second would produce the same number.
 */
export const sandboxInvoiceNumber = (
  prefix: string,
  year: number,
  now = new Date(),
): string =>
  `${prefix}-${year}-${pad(Math.floor(now.getTime() / 1000) % 100_000_000, 8)}`;
