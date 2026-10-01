/**
 * Who sells the licence and issues the invoice: the company behind nisd2.eu, as entered in the
 * commercial register. The order page's invoice preview, the structured data and the email footer
 * print it from here; the legal pages state the same facts in their own sentences (messages/info,
 * messages/billing).
 */
export const SELLER = {
  name: "Kardashev Catalyst UG (haftungsbeschränkt)",
  street: "Trierer Str. 6",
  city: "50676 Köln",
  register: "Amtsgericht Köln, HRB 126993",
  vatId: "DE462889433",
  /** § 35a Abs. 1 GmbHG names every managing director on business letters, email included. */
  director: "Simon Orzel",
  /**
   * The contact address the legal notice and privacy policy publish. Replies to our letters go
   * here: the sending address and SUPPORT_EMAIL take no mail.
   */
  email: "contact@nisd2.eu",
} as const;

/** Where the company serves nisd2.eu. A self-hosted install answers on its own address. */
const SELLER_HOSTS: ReadonlySet<string> = new Set(["nisd2.eu", "www.nisd2.eu"]);

/**
 * Whether this install is nisd2.eu itself, judged by the public address it was configured with.
 * Self-hosters run the same code, and their mail must not carry this company's name, register
 * entry and signature. lib/env fills an unset address with nisd2.eu so links still work, so this
 * reads the configured value instead: an install that never set one is not taken for us.
 */
export const isSellerInstance = (
  configuredUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL,
): boolean => {
  const url = configuredUrl?.trim() ?? "";
  return URL.canParse(url) && SELLER_HOSTS.has(new URL(url).hostname);
};
