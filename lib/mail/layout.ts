/**
 * What every email shares besides its markup: brand tokens, the footer and legal copy, the
 * letter sign-off, and header escaping. The markup itself is React Email (./components, ./emails);
 * this module stays free of JSX so the plain-text builders and lib/lifecycle can use it too.
 */
import { isSellerInstance, SELLER } from "@/lib/billing/seller";
import type { EmailLocale } from "./locale";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Strip CR/LF/NUL from user content destined for email headers (subject line).
 * Defense-in-depth against header injection. Resend sanitizes headers
 * server-side, but supplier-controlled content is cross-tenant and worth
 * locking down at the source.
 */
export function safeHeader(s: string): string {
  return s.replace(/[\r\n\0]+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Brand tokens (mirror app/globals.css, email clients can't read CSS vars)
// ---------------------------------------------------------------------------

export const BRAND = {
  primary: "#284b63",
  primaryForeground: "#ffffff",
  foreground: "#353535",
  mutedForeground: "#6b6b6b",
  border: "#d9d9d9",
  muted: "#f2f2f2",
  background: "#ffffff",
  pageBackground: "#fafafa",
  primaryMuted: "#cbd5e1",
} as const;

export const SEVERITY = {
  destructive: "#ef4444",
  destructiveBgBorder: "#fecaca",
  warning: "#ea580c",
  warningBgBorder: "#fed7aa",
  success: "#16a34a",
} as const;

export const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const LEGAL_COPY: Record<
  EmailLocale,
  {
    readonly director: string;
    readonly vatId: string;
    readonly links: readonly (readonly [
      "/impressum" | "/datenschutz" | "/terms",
      string,
    ])[];
  }
> = {
  de: {
    director: "Geschäftsführer",
    vatId: "USt-IdNr.",
    links: [
      ["/impressum", "Impressum"],
      ["/datenschutz", "Datenschutzerklärung"],
      ["/terms", "Nutzungsbedingungen"],
    ],
  },
  en: {
    director: "Managing director",
    vatId: "VAT ID",
    links: [
      ["/impressum", "Legal Notice"],
      ["/datenschutz", "Privacy Policy"],
      ["/terms", "Terms of Service"],
    ],
  },
  nl: {
    director: "Bestuurder",
    vatId: "Btw-id",
    links: [
      ["/impressum", "Colofon"],
      ["/datenschutz", "Privacyverklaring"],
      ["/terms", "Voorwaarden"],
    ],
  },
};

const CLOSING: Record<EmailLocale, string> = {
  de: "Mit freundlichen Grüßen",
  en: "Kind regards",
  nl: "Met vriendelijke groet",
};

/**
 * The close of a letter, one line each. On nisd2.eu the managing director signs, the same person
 * the legal footer names; a self-hosted install signs as the software it runs.
 */
export function letterSignOff(locale: EmailLocale): readonly string[] {
  return isSellerInstance()
    ? [CLOSING[locale], SELLER.director, `${LEGAL_COPY[locale].director}, nisd2.eu`]
    : [CLOSING[locale], "nisd2.eu"];
}

/**
 * Where a reply to a letter reaches a person: on nisd2.eu the published contact address, which
 * someone reads. A self-hosted install has no address we know is read, so its letters ask for none.
 */
export function letterReplyTo(): string | null {
  return isSellerInstance() ? SELLER.email : null;
}

/**
 * The links every optional email carries, to switch off all optional mail or open the
 * preference centre. Essential mail (sign-in codes, security notices) passes no footer: there
 * is nothing to opt out of, and offering it would be a lie.
 */
export interface PreferenceFooter {
  unsubscribeUrl: string;
  preferencesUrl: string;
  /**
   * Copy language. Required, not optional with a German default: while it was
   * optional every call site left it out, so English digests went out with a
   * German footer. A default here is indistinguishable from a caller that
   * forgot, which is why there is no longer one.
   */
  locale: EmailLocale;
}

export const FOOTER_COPY: Record<
  EmailLocale,
  { unsubscribe: string; manage: string; separator: string }
> = {
  de: {
    unsubscribe: "E-Mails abbestellen",
    manage: "E-Mail-Einstellungen",
    separator: "oder",
  },
  en: {
    unsubscribe: "Unsubscribe from emails",
    manage: "Email settings",
    separator: "or",
  },
  nl: {
    unsubscribe: "Afmelden voor e-mails",
    manage: "E-mailinstellingen",
    separator: "of",
  },
};

/** Plain-text twin of the footer, for the text/plain alternative. */
export function preferenceFooterText(footer: PreferenceFooter): string {
  const copy = FOOTER_COPY[footer.locale];
  return [
    `${copy.unsubscribe}: ${footer.unsubscribeUrl}`,
    `${copy.manage}: ${footer.preferencesUrl}`,
  ].join("\n");
}

/**
 * What frames a message besides its body. Optional mail passes its preference footer, which
 * carries the language. Mail nobody can switch off (sign-in codes, invoices, confirmations of
 * what the person just did) passes only its language: it has no opt-out, and offering one
 * would be a lie. The language is required either way, because the legal footer is written in it.
 */
export type EmailChrome = PreferenceFooter | { readonly locale: EmailLocale };

/** The chrome of a message written only in English (most of the workflow mail, for now). */
export const ENGLISH_ONLY = { locale: "en" } as const satisfies EmailChrome;

/** The chrome of a message to our own operators, who read German. */
export const TO_OPERATORS = { locale: "de" } as const satisfies EmailChrome;
