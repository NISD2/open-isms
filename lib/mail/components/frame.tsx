/**
 * The frame every email is drawn in: React Email's document, a 560px card (the width attribute
 * holds it there in Outlook on Windows, which renders with Word and ignores max-width), the brand
 * mark, the body, the opt-out links for optional mail, and the footer naming who sends it.
 *
 * Each row of the card is a table of its own, so Outlook honours its padding and background.
 */
import { Body, Container, Head, Html, Img, Link, Preview } from "@react-email/components";
import { type CSSProperties, Fragment, type ReactNode } from "react";
import { getPathname } from "@/i18n/navigation";
import { isSellerInstance, SELLER } from "@/lib/billing/seller";
import { getAppUrl } from "@/lib/utils";
import {
  BRAND,
  type EmailChrome,
  FONT,
  FOOTER_COPY,
  LEGAL_COPY,
  type PreferenceFooter,
} from "../layout";
import type { EmailLocale } from "../locale";

const LOGO_URL = "https://nisd2.eu/nisd2-logo.png";

/** One full-width row of the card. */
function Band({ style, children }: { style: CSSProperties; children: ReactNode }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        <tr>
          <td style={{ fontFamily: FONT, ...style }}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}

function BrandMark() {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ borderCollapse: "collapse" }}
    >
      <tbody>
        <tr>
          <td style={{ verticalAlign: "middle", paddingRight: "10px" }}>
            <Img
              src={LOGO_URL}
              alt="NISD2"
              width="32"
              height="32"
              style={{ display: "block", borderRadius: "6px" }}
            />
          </td>
          <td
            style={{
              verticalAlign: "middle",
              color: BRAND.foreground,
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: FONT,
            }}
          >
            NISD2
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const footerLink = { color: BRAND.mutedForeground, textDecoration: "underline" } as const;

/**
 * The consent footer every optional email carries: one link to switch off all optional mail, one
 * to the preference centre. Drawn by the frame rather than by each email, so the two links cannot
 * drift apart or go missing. Essential mail has none: offering an opt-out there would be a lie.
 */
export function PreferenceLinks({ footer }: { footer: PreferenceFooter }) {
  const copy = FOOTER_COPY[footer.locale];
  return (
    <p
      style={{
        color: BRAND.mutedForeground,
        fontSize: "12px",
        margin: "32px 0 0",
        lineHeight: 1.5,
        borderTop: `1px solid ${BRAND.border}`,
        paddingTop: "16px",
      }}
    >
      <Link href={footer.unsubscribeUrl} style={footerLink}>
        {copy.unsubscribe}
      </Link>
      {`  ${copy.separator}  `}
      <Link href={footer.preferencesUrl} style={footerLink}>
        {copy.manage}
      </Link>
    </p>
  );
}

/**
 * Who sends this. On nisd2.eu that is the company, with what § 35a Abs. 1 GmbHG asks of a business
 * letter in any form: legal form, register court and number, and the managing director. A
 * self-hosted install, or one that never configured its address, is someone else's business, so
 * its mail only says what software it runs.
 */
function LegalFooter({ locale }: { locale: EmailLocale }) {
  if (!isSellerInstance()) {
    return (
      <>
        <Link
          href="https://nisd2.eu"
          style={{ color: BRAND.primary, textDecoration: "none", fontWeight: 600 }}
        >
          nisd2.eu
        </Link>
        {" ·  Open NIS2 compliance platform"}
      </>
    );
  }
  const appUrl = getAppUrl();
  const copy = LEGAL_COPY[locale];
  return (
    <>
      {`${SELLER.name} · ${SELLER.street} · ${SELLER.city}`}
      <br />
      {`${SELLER.register} · ${copy.director}: ${SELLER.director} · ${copy.vatId} ${SELLER.vatId}`}
      <br />
      {copy.links.map(([href, label], i) => (
        <Fragment key={href}>
          {i > 0 ? " · " : null}
          <Link href={`${appUrl}${getPathname({ href, locale })}`} style={footerLink}>
            {label}
          </Link>
        </Fragment>
      ))}
    </>
  );
}

export function EmailFrame({
  chrome,
  preview,
  children,
}: {
  readonly chrome: EmailChrome;
  /** Shown by most clients next to the subject line, never in the body. */
  readonly preview?: string | null;
  readonly children: ReactNode;
}) {
  return (
    <Html lang={chrome.locale}>
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={{ margin: 0, backgroundColor: BRAND.pageBackground }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
        >
          <tbody>
            <tr>
              <td
                align="center"
                style={{ padding: "24px 0", backgroundColor: BRAND.pageBackground }}
              >
                <Container
                  width="560"
                  style={{
                    width: "100%",
                    maxWidth: "560px",
                    backgroundColor: BRAND.background,
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: "8px",
                    borderCollapse: "separate",
                    fontFamily: FONT,
                  }}
                >
                  <Band
                    style={{
                      padding: "20px 32px",
                      borderBottom: `1px solid ${BRAND.border}`,
                    }}
                  >
                    <BrandMark />
                  </Band>
                  <Band style={{ padding: "28px 32px 24px" }}>
                    {children}
                    {"unsubscribeUrl" in chrome ? (
                      <PreferenceLinks footer={chrome} />
                    ) : null}
                  </Band>
                  <Band
                    style={{
                      backgroundColor: BRAND.muted,
                      padding: "16px 32px",
                      borderRadius: "0 0 8px 8px",
                      color: BRAND.mutedForeground,
                      fontSize: "11px",
                      lineHeight: 1.7,
                    }}
                  >
                    <LegalFooter locale={chrome.locale} />
                  </Band>
                </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
