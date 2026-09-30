/**
 * The inbox an address delivers to, for counting mail and never for sending it
 * (the stored and mailed address stays as typed).
 *
 * Many providers deliver "name+anything@" to "name@", and Gmail also ignores
 * dots in the local part and treats googlemail.com as gmail.com. Budgets keyed
 * on the typed address therefore count victim+1@ through victim+200@ as 200
 * people while one inbox receives it all. Keyed on this instead, they count one.
 */

const GMAIL_DOMAINS: ReadonlySet<string> = new Set(["gmail.com", "googlemail.com"]);

export function inboxOf(address: string): string {
  const normalised = address.trim().toLowerCase();
  const at = normalised.lastIndexOf("@");
  if (at < 0) return normalised;
  const domain = normalised.slice(at + 1);
  const [mailbox = ""] = normalised.slice(0, at).split("+");
  return GMAIL_DOMAINS.has(domain)
    ? `${mailbox.replaceAll(".", "")}@gmail.com`
    : `${mailbox}@${domain}`;
}
