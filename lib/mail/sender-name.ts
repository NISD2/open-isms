/**
 * The sending company's name, as it may appear in a mail we send to an address
 * that company typed in (the supplier portal mails, lib/mail/templates.ts).
 *
 * The name is whatever the company registered with, and supplier onboarding is
 * self service. Mail clients turn anything that looks like a web or mail
 * address into a clickable link, and a phone number into tap to call, in the
 * HTML part and the plain-text part alike; escaping does nothing against that.
 * A name such as "ACME secure-login.example" would put a working link in a mail
 * signed by our domain.
 *
 * So the name is changed until nothing in it can be linked, rather than kept
 * and disguised: invisible characters or markup leave the outcome to each
 * client's link detection, which differs between Gmail, Outlook and Apple Mail
 * and changes without notice. Words that are an address in themselves (a
 * scheme, a mail address, an IP, a defanged dot) and phone numbers are dropped.
 * A dot that could start a top-level domain gets a space after it, which keeps
 * real names whole ("Co.KG" reads "Co. KG", "Dr.Oetker" reads "Dr. Oetker")
 * while "evil.com" becomes "evil. com", which no client links.
 */

/** Long enough for a full legal name, short enough that a name cannot carry a paragraph. */
const MAX_NAME_LENGTH = 80;

/**
 * Format characters (zero-width spaces, soft hyphens, bidi overrides) are
 * dropped, so "acme" + U+200B + ".test" is judged as the "acme.test" a reader
 * sees. Control characters (line breaks, tabs, NUL) separate words like spaces.
 */
const FORMAT = /\p{Cf}/gu;
const WORD_BREAK = /[\s\p{Cc}]+/u;

/**
 * A number as people write one, starting at a digit (or a "+" or "(" before
 * it) and running on over digits, spaces, dashes, dots, slashes and brackets.
 * Six or more digits in one run is a phone number to a mobile client; fewer is
 * a year or a house number and stays.
 */
const NUMBER_RUN = /[+(]*\p{Nd}[\p{Nd}\s\p{Pd}./()]*/gu;
const DIGIT = /\p{Nd}/gu;
const PHONE_MIN_DIGITS = 6;

/**
 * U+3002 stands next to the full stop because browsers read it as one in a
 * host name; the fullwidth dots are folded into these two by NFKC first.
 */
const DOT = "[.\u{3002}]";

/**
 * A word that is an address in itself: a scheme, a mail address, an IPv4
 * address short enough to pass the phone rule, or a dot written defanged
 * ("evil[.]com", "evil(dot)com"), which a reader follows even though no
 * client links it.
 */
const ADDRESS = new RegExp(
  String.raw`://|@|\p{Nd}${DOT}\p{Nd}+${DOT}\p{Nd}+${DOT}\p{Nd}|[[({]\s*(?:${DOT}|dot)\s*[\])}]`,
  "iu",
);

/** A dot followed by two letters: the start of every top-level domain and of punycode. */
const HOST_DOT = new RegExp(String.raw`(${DOT})(?=\p{L}{2})`, "gu");

const withoutPhoneNumbers = (text: string): string =>
  text.replace(NUMBER_RUN, (run) =>
    (run.match(DIGIT) ?? []).length >= PHONE_MIN_DIGITS ? " " : run,
  );

export function companyNameForMail(
  name: string | null | undefined,
  fallback: string,
): string {
  const words = withoutPhoneNumbers((name ?? "").normalize("NFKC").replace(FORMAT, ""))
    .split(WORD_BREAK)
    .filter((word) => word !== "" && !ADDRESS.test(word))
    .map((word) => word.replace(HOST_DOT, "$1 "));
  const characters = Array.from(words.join(" "));
  const kept =
    characters.length > MAX_NAME_LENGTH
      ? `${characters.slice(0, MAX_NAME_LENGTH).join("").trimEnd()}\u{2026}`
      : characters.join("");
  return kept === "" ? fallback : kept;
}
