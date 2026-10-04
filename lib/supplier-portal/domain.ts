/**
 * Normalize a domain string to lowercase FQDN, stripping protocol and path. Used by the form, so
 * a pasted address passes the save schema, and by the save procedure, which must not trust it.
 *   "https://Foo.Example.de/contact" → "foo.example.de"
 *   "user@example.de"                → "example.de"
 *   "  example.de  "                 → "example.de"
 */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (s.includes("@")) s = s.split("@")[1] ?? "";
  s = s.replace(/^https?:\/\//, "");
  s = s.split("/")[0] ?? "";
  s = s.split("?")[0] ?? "";
  s = s.replace(/^www\./, "");
  if (!s.includes(".")) return null;
  return s;
}
