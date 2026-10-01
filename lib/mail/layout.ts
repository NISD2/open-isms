/**
 * Shared email scaffolding: brand tokens, HTML layout, and header/content
 * escaping. Extracted from templates.ts so email modules outside that file
 * (lib/lifecycle) can compose on-brand emails without templates.ts growing
 * a new export for every campaign.
 */
import { getPathname } from "@/i18n/navigation";
import { isSellerInstance, SELLER } from "@/lib/billing/seller";
import { getAppUrl } from "@/lib/utils";
import type { EmailLocale } from "./locale";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Minimal HTML escape for user content interpolated into email HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

const BRAND_LOGO_URL = "https://nisd2.eu/nisd2-logo.png";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function brandMark(): string {
  return `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle; padding-right: 10px;">
                <img src="${BRAND_LOGO_URL}" alt="NISD2" width="32" height="32" style="display: block; border-radius: 6px;" />
              </td>
              <td style="vertical-align: middle; color: ${BRAND.foreground}; font-size: 15px; font-weight: 700; letter-spacing: 0.04em; font-family: ${FONT};">NISD2</td>
            </tr>
          </table>`;
}

const LEGAL_COPY: Record<
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

const footerLink = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="color: ${BRAND.mutedForeground};">${escapeHtml(label)}</a>`;

/**
 * Who sends this, at the bottom of every email. On nisd2.eu that is the company, with what
 * § 35a Abs. 1 GmbHG asks of a business letter in any form: legal form, register court and
 * number, and the managing director. A self-hosted install, or one that never configured its
 * address, is someone else's business, so its mail only says what software it runs.
 */
function legalFooter(locale: EmailLocale): string {
  if (!isSellerInstance()) {
    return `<a href="https://nisd2.eu" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">nisd2.eu</a>
          &nbsp;·&nbsp; Open NIS2 compliance platform`;
  }
  const appUrl = getAppUrl();
  const copy = LEGAL_COPY[locale];
  const links = copy.links
    .map(([href, label]) =>
      footerLink(`${appUrl}${getPathname({ href, locale })}`, label),
    )
    .join(" · ");
  return `${escapeHtml(SELLER.name)} · ${escapeHtml(SELLER.street)} · ${escapeHtml(SELLER.city)}<br />
          ${escapeHtml(SELLER.register)} · ${copy.director}: ${escapeHtml(SELLER.director)} · ${copy.vatId} ${escapeHtml(SELLER.vatId)}<br />
          ${links}`;
}

/**
 * The consent footer every optional email carries: one link to switch off
 * this kind of message, one to the preference centre for everything else.
 * Rendered by the layout rather than hand-written per template, so the two
 * links cannot drift apart or go missing from a new email.
 *
 * Essential mail (sign-in codes, security notices) passes no footer: there
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

const FOOTER_COPY: Record<
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

export function preferenceFooterHtml(footer: PreferenceFooter): string {
  const copy = FOOTER_COPY[footer.locale];
  return `
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 32px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${footer.unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">${copy.unsubscribe}</a>
          &nbsp;${copy.separator}&nbsp;
          <a href="${footer.preferencesUrl}" style="color: ${BRAND.mutedForeground};">${copy.manage}</a>
        </p>`;
}

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

/**
 * Wrap an inner HTML body in the shared brand layout (header, card, legal footer). The body sits
 * in a padded white panel below the header; an optional message gets its opt-out links under it.
 */
export function emailLayout(innerHtml: string, chrome: EmailChrome): string {
  const body =
    "unsubscribeUrl" in chrome
      ? `${innerHtml}\n${preferenceFooterHtml(chrome)}`
      : innerHtml;
  // A frame of tables, not divs: Outlook on Windows renders with Word, which ignores max-width,
  // margins and backgrounds on divs. The width attribute holds the card at 560px there; every
  // other client reads the CSS and shrinks it on a phone. The structure React Email's Container emits.
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.pageBackground}" style="background: ${BRAND.pageBackground};">
  <tr>
    <td align="center" style="padding: 24px 0;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.background}" style="width: 100%; max-width: 560px; background: ${BRAND.background}; border: 1px solid ${BRAND.border}; border-radius: 8px; border-collapse: separate; font-family: ${FONT};">
        <tr>
          <td style="padding: 20px 32px; border-bottom: 1px solid ${BRAND.border}; font-family: ${FONT};">${brandMark()}
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 32px 24px; font-family: ${FONT};">
${body}
          </td>
        </tr>
        <tr>
          <td bgcolor="${BRAND.muted}" style="background: ${BRAND.muted}; padding: 16px 32px; border-radius: 0 0 8px 8px; color: ${BRAND.mutedForeground}; font-size: 11px; line-height: 1.7; font-family: ${FONT};">
          ${legalFooter(chrome.locale)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}
