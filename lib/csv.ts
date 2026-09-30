/**
 * Spreadsheets run a cell that starts with one of these as a formula, quoted field or not.
 * The list is OWASP's ("CSV Injection"), tab and carriage return included.
 */
const FORMULA_STARTS = ["=", "+", "-", "@", "\t", "\r"] as const;

/** Characters that end a field or a record unless the field is quoted (RFC 4180). */
const NEEDS_QUOTES = [",", '"', "\r", "\n"] as const;

/**
 * One CSV field, safe to open in a spreadsheet. The leading quote makes the cell text rather
 * than a formula; it can stay visible in the cell and always shows in a text editor, which is the
 * price of the cell not running. Only free text starting with one of FORMULA_STARTS gets it.
 */
export function csvCell(value: string): string {
  const inert = FORMULA_STARTS.some((start) => value.startsWith(start))
    ? `'${value}`
    : value;
  return NEEDS_QUOTES.some((char) => inert.includes(char))
    ? `"${inert.replaceAll('"', '""')}"`
    : inert;
}

/** Rows to CSV text: comma separated, CRLF line endings (RFC 4180). */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
