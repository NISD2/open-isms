/**
 * The bare host name in what someone typed for a domain, or null when there is none. Part of the
 * save schema (`companyInsertSchema.primaryDomain`), so the browser and the server both validate
 * what is stored, not what was pasted.
 *   "https://www.Foo.Example.de/contact" → "foo.example.de"
 *   "user@example.de"                     → "example.de"
 *   "  example.de  "                      → "example.de"
 */
export function normalizeDomain(input: string): string | null {
  const text = input.trim().toLowerCase();
  const address =
    text.includes("@") && !text.includes("://")
      ? text.slice(text.lastIndexOf("@") + 1)
      : text;
  if (address === "") return null;
  try {
    const { hostname } = new URL(
      address.includes("://") ? address : `https://${address}`,
    );
    const host = hostname.startsWith("www.") ? hostname.slice("www.".length) : hostname;
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}
