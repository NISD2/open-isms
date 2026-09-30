/**
 * The sending company's name, as it may appear in a mail we send to an address
 * that company typed in (the supplier portal mails, lib/mail/templates.ts).
 *
 * The name is whatever the company registered with, and supplier onboarding is
 * self service. Mail clients turn anything that looks like a web or mail
 * address into a clickable link, in the HTML part and the plain-text part
 * alike, and escaping does nothing against that. A name such as
 * "ACME secure-login.example" would put a working link in a mail signed by our
 * domain.
 *
 * So the words that could become a link are removed, rather than kept and
 * disguised. Escaping them or breaking them up with invisible characters leaves
 * the outcome to each client's link detection, which differs between Gmail,
 * Outlook and Apple Mail and changes without notice; a removed word cannot be
 * linked by any of them. The cost is a false positive now and then ("Dr.Muster
 * GmbH" loses "Dr.Muster"), which is cosmetic: the full name is on the page the
 * mail links to.
 */

/** Long enough for a full legal name, short enough that a name cannot carry a paragraph. */
const MAX_NAME_LENGTH = 80;

/**
 * A word a mail client may turn into a link: a scheme, a mail address, a host
 * name (anything followed by a dot and two letters, which covers every
 * top-level domain and punycode), or an IPv4 address. U+3002 is listed next to
 * the full stop because browsers read it as one in a host name; the fullwidth
 * dots are folded into it by the NFKC step first.
 */
const LINK_LIKE = /:\/\/|@|\S[.。]\p{L}{2}|\d[.。]\d+[.。]\d+[.。]\d/u;

/**
 * Format characters (zero-width spaces, soft hyphens, bidi overrides) are
 * dropped, so "acme​.test" is judged as the "acme.test" a reader sees.
 * Control characters (line breaks, tabs, NUL) separate words like spaces.
 */
const FORMAT = /\p{Cf}/gu;
const WORD_BREAK = /[\s\p{Cc}]+/u;

export function companyNameForMail(
  name: string | null | undefined,
  fallback: string,
): string {
  const words = (name ?? "")
    .normalize("NFKC")
    .replace(FORMAT, "")
    .split(WORD_BREAK)
    .filter((word) => word !== "" && !LINK_LIKE.test(word));
  const characters = Array.from(words.join(" "));
  const kept =
    characters.length > MAX_NAME_LENGTH
      ? `${characters.slice(0, MAX_NAME_LENGTH).join("").trimEnd()}…`
      : characters.join("");
  return kept === "" ? fallback : kept;
}
