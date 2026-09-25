/**
 * Invoice numbers.
 *
 * Needed because the account has Qonto's automatic numbering switched off, which the API told us
 * plainly: `number must have a value`. That answers an open question rather than being a
 * workaround, and it makes the number ours to own.
 *
 * It matters twice over. German bookkeeping rules want invoice numbers that are unique and
 * traceable, and **the number is what the customer types into the Verwendungszweck**, so it is also
 * the key an incoming transfer is matched on. A number that is hard to transcribe is a payment that
 * lands unmatched.
 *
 * So: uppercase, no lookalike characters, one obvious separator, year in the middle so a human can
 * see at a glance which year a payment belongs to.
 *
 * The default prefix is `RE` because Qonto only matches a transfer to an invoice by itself when the
 * number uses a prefix it recognises, and `RE` is one of them.
 */

export const INVOICE_PREFIX = process.env.INVOICE_PREFIX ?? "RE";

/** Zero-padded so the numbers sort as text and line up in a column. */
const pad = (n: number, width = 4): string => String(n).padStart(width, "0");

/**
 * Build one invoice number from an explicit sequence. Pure, so it is testable and so the caller is
 * forced to have decided where the sequence comes from.
 *
 * PRODUCTION NEEDS A REAL COUNTER. A database sequence, taken inside the same transaction that
 * records the order, is the only thing that gives uniqueness without gaps under concurrency. This
 * function deliberately does not invent one: passing a sequence in means the caller cannot pretend
 * the problem is solved.
 */
export const invoiceNumber = (
  year: number,
  sequence: number,
  prefix = INVOICE_PREFIX,
): string => `${prefix}-${year}-${pad(sequence)}`;

/** Parse one back, so an incoming payment reference can be matched to an invoice. */
export const parseInvoiceNumber = (
  reference: string,
): {
  readonly prefix: string;
  readonly year: number;
  readonly sequence: number;
} | null => {
  const m = /([A-Z0-9]{2,12})-(\d{4})-(\d{3,8})/i.exec(reference.toUpperCase());
  const prefix = m?.[1];
  const year = m?.[2];
  const sequence = m?.[3];
  if (!prefix || !year || !sequence) return null;
  return { prefix, year: Number(year), sequence: Number(sequence) };
};

/**
 * Find our invoice number inside whatever the payer typed in the Verwendungszweck. People add
 * their own words, their customer number, and sometimes nothing at all, so this looks for the
 * pattern anywhere in the string rather than expecting the field to contain only the number.
 */
export const findInvoiceNumberInReference = (reference: string): string | null => {
  const parsed = parseInvoiceNumber(reference);
  return parsed ? invoiceNumber(parsed.year, parsed.sequence, parsed.prefix) : null;
};

/**
 * A number for the sandbox, where there is no counter and none is wanted. Derived from the clock so
 * repeated manual runs do not collide.
 *
 * Never use this for a real invoice: it is not gapless and two requests in the same second would
 * produce the same number.
 */
export const sandboxInvoiceNumber = (now = new Date()): string => {
  const secondsToday = Math.floor(
    (now.getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      1000,
  );
  return `${INVOICE_PREFIX}-${now.getFullYear()}-${pad(secondsToday, 5)}`;
};
