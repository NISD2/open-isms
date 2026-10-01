import { EmailFrame } from "../components/frame";
import { CtaButton, InlineLink, MutedLink, SmallPrint } from "../components/parts";
import { BRAND, ENGLISH_ONLY } from "../layout";

export interface NewsletterProps {
  readonly preheader?: string | null;
  /** Body markdown already rendered to HTML by renderNewsletterMarkdown(). */
  readonly bodyHtml: string;
  readonly unsubscribeUrl: string;
  readonly forwardUrl: string;
  /** Optional soft CTA button (one per issue). Absolute URL + label. */
  readonly cta?: { readonly url: string; readonly label: string } | null;
  /** Public permalink for the "view in browser" link. */
  readonly viewInBrowserUrl?: string | null;
}

/**
 * The newsletter, to verified, opted-in users. The body is authored as markdown in the
 * platform-admin composer. "Just reply" beats a mailto link: the message is sent with Reply-To
 * set, so hitting reply keeps the thread.
 */
export default function NewsletterEmail(props: NewsletterProps) {
  return (
    <EmailFrame chrome={ENGLISH_ONLY} preview={props.preheader}>
      <div
        style={{ color: BRAND.foreground, fontSize: "15px", lineHeight: 1.65 }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: markdown from the platform-admin composer, rendered by renderNewsletterMarkdown without raw HTML and with unsafe URLs dropped
        dangerouslySetInnerHTML={{ __html: props.bodyHtml }}
      />
      {props.cta ? (
        <div style={{ margin: "28px 0 0", textAlign: "center" }}>
          <CtaButton href={props.cta.url} style={{ fontSize: "14px" }}>
            {props.cta.label}
          </CtaButton>
        </div>
      ) : null}
      <SmallPrint style={{ lineHeight: 1.6 }}>
        Questions or feedback? Just reply to this email, it comes straight to me.
        <br />
        <br />
        Found this useful?{" "}
        <InlineLink href={props.forwardUrl}>Forward it to a colleague.</InlineLink>
        <br />
        <br />
        You are receiving this because you have an account at nisd2.eu.{" "}
        <MutedLink href={props.unsubscribeUrl}>Unsubscribe</MutedLink>.
        {props.viewInBrowserUrl ? (
          <>
            <br />
            <br />
            <MutedLink href={props.viewInBrowserUrl}>
              View this issue in your browser.
            </MutedLink>
          </>
        ) : null}
      </SmallPrint>
    </EmailFrame>
  );
}

NewsletterEmail.PreviewProps = {
  preheader: "Drei Termine im Oktober",
  bodyHtml:
    "<p>Hallo,</p><p>drei Dinge diesen Monat.</p><ul><li>Eins</li><li>Zwei</li></ul>",
  unsubscribeUrl: "https://nisd2.eu/u",
  forwardUrl: "https://nisd2.eu/f",
  cta: { url: "https://nisd2.eu/kurse", label: "Zum Kurs" },
  viewInBrowserUrl: "https://nisd2.eu/n/1",
} satisfies NewsletterProps;
