/**
 * Shared email scaffolding: brand tokens, HTML layout, and header/content
 * escaping. Extracted from templates.ts so email modules outside that file
 * (lib/lifecycle) can compose on-brand emails without templates.ts growing
 * a new export for every campaign.
 */

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
const BRAND_TAGLINE = "Halve Europe's NIS2 bill.";

function brandHeader(): string {
  return `
    <div style="background: ${BRAND.primary}; padding: 20px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="${BRAND_LOGO_URL}" alt="NISD2" width="40" height="40" style="display: block; border-radius: 8px;" />
          </td>
          <td style="vertical-align: middle;">
            <div style="color: ${BRAND.primaryForeground}; font-size: 16px; font-weight: 700; letter-spacing: 0.05em; line-height: 1.2;">NISD2</div>
            <div style="color: ${BRAND.primaryMuted}; font-size: 12px; line-height: 1.4; margin-top: 2px;">${BRAND_TAGLINE}</div>
          </td>
        </tr>
      </table>
    </div>`;
}

function brandFooter(): string {
  return `
    <div style="border-top: 1px solid ${BRAND.border}; padding: 16px 32px; color: ${BRAND.mutedForeground}; font-size: 11px; line-height: 1.6;">
      <a href="https://nisd2.eu" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">nisd2.eu</a>
      &nbsp;·&nbsp; Open NIS2 compliance platform
    </div>`;
}

/**
 * Wrap an inner HTML body in the shared brand layout (header + footer +
 * card container). Inner content is rendered inside a 24px-padded white
 * panel below the header.
 */
export function emailLayout(innerHtml: string): string {
  return `
    <div style="background: ${BRAND.pageBackground}; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: ${BRAND.background}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        ${brandHeader()}
        <div style="padding: 24px 32px;">
${innerHtml}
        </div>
        ${brandFooter()}
      </div>
    </div>`.trim();
}
