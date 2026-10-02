import { Fragment } from "react";
import { EmailFrame } from "../components/frame";
import { InlineLink } from "../components/parts";
import { BRAND } from "../layout";
import type { DocumentEmail } from "../templates";

export interface DocumentLetterProps {
  readonly mail: DocumentEmail;
  /** The line inviting replies, present only where a reply reaches a person. */
  readonly questions: string | null;
  readonly signOff: readonly string[];
}

const paragraph = (muted = false) =>
  ({
    color: muted ? BRAND.mutedForeground : BRAND.foreground,
    fontSize: "15px",
    lineHeight: 1.6,
    margin: "0 0 14px",
  }) as const;

/** Text with the one URL it may carry (Qonto's invoice page) made clickable. */
function WithLink({
  text,
  link,
}: {
  readonly text: string;
  readonly link: string | null;
}) {
  if (!link || !text.includes(link)) return <>{text}</>;
  const [before, ...after] = text.split(link);
  return (
    <>
      {before}
      <InlineLink href={link}>{link}</InlineLink>
      {after.join(link)}
    </>
  );
}

/** A card that mirrors the document: its name, its number, and the facts a reader acts on. */
function DocumentCard({ document }: { readonly document: DocumentEmail["document"] }) {
  const cell = (last: boolean) =>
    ({
      padding: "10px 16px",
      verticalAlign: "top",
      ...(last ? {} : { borderBottom: `1px solid ${BRAND.border}` }),
    }) as const;
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width="100%"
      style={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: "6px",
        borderCollapse: "separate",
        margin: "4px 0 20px",
      }}
    >
      <tbody>
        <tr>
          <td
            colSpan={2}
            style={{
              padding: "14px 16px",
              background: BRAND.muted,
              borderBottom: `1px solid ${BRAND.border}`,
              borderRadius: "6px 6px 0 0",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: BRAND.mutedForeground,
              }}
            >
              {document.kind}
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: BRAND.foreground,
                marginTop: "2px",
              }}
            >
              {document.reference}
            </div>
          </td>
        </tr>
        {document.facts.map((fact, i) => {
          const last = i === document.facts.length - 1;
          return (
            <tr key={fact.label}>
              <td
                style={{
                  ...cell(last),
                  width: "38%",
                  color: BRAND.mutedForeground,
                  fontSize: "13px",
                }}
              >
                {fact.label}
              </td>
              <td style={{ ...cell(last), color: BRAND.foreground, fontSize: "14px" }}>
                {fact.emphasis ? <strong>{fact.value}</strong> : fact.value}
                {fact.detail ? (
                  <>
                    <br />
                    <span style={{ color: BRAND.mutedForeground, fontSize: "13px" }}>
                      {fact.detail}
                    </span>
                  </>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * A letter about one business document: invoice, credit note, cancellation, refund, erasure.
 * The wording lives with the document (lib/billing, lib/gdpr); this lays it out the way the
 * document reads.
 */
export default function DocumentLetterEmail({
  mail,
  questions,
  signOff,
}: DocumentLetterProps) {
  const link = mail.link ?? null;
  return (
    <EmailFrame chrome={{ locale: mail.locale }}>
      <h1
        style={{
          margin: "0 0 12px",
          color: BRAND.foreground,
          fontSize: "22px",
          lineHeight: 1.3,
          fontWeight: 700,
        }}
      >
        {mail.heading}
      </h1>
      <p style={paragraph()}>{mail.greeting}</p>
      {mail.intro.map((text) => (
        <p key={text} style={paragraph()}>
          <WithLink text={text} link={link} />
        </p>
      ))}
      <DocumentCard document={mail.document} />
      {mail.outro.map((text) => (
        <p key={text} style={paragraph()}>
          <WithLink text={text} link={link} />
        </p>
      ))}
      {questions ? <p style={paragraph(true)}>{questions}</p> : null}
      <p
        style={{ color: BRAND.foreground, fontSize: "15px", lineHeight: 1.6, margin: 0 }}
      >
        {signOff.map((line, i) => (
          <Fragment key={line}>
            {i > 0 ? <br /> : null}
            {line}
          </Fragment>
        ))}
      </p>
      {mail.appendix ? (
        <div
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: `1px solid ${BRAND.border}`,
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: the formal erasure record, rendered by renderRecordMarkdown from escaped values with links and raw HTML removed
          dangerouslySetInnerHTML={{ __html: mail.appendix.html }}
        />
      ) : null}
    </EmailFrame>
  );
}

DocumentLetterEmail.PreviewProps = {
  mail: {
    locale: "de",
    subject: "Rechnung RE-2026-0012: NIS 2 Durchgang, Jahreslizenz",
    heading: "Ihre Rechnung",
    greeting: "Guten Tag,",
    intro: ["anbei erhalten Sie die Rechnung für die Jahreslizenz NIS 2 Durchgang."],
    document: {
      kind: "Rechnung",
      reference: "RE-2026-0012 · 15. September 2026",
      facts: [
        { label: "Leistung", value: "NIS 2 Durchgang, Jahreslizenz" },
        {
          label: "Leistungszeitraum",
          value: "15. September 2026 bis 14. September 2027",
        },
        {
          label: "Betrag",
          value: "5.712,00 €",
          detail: "4.800,00 € netto zzgl. 912,00 € USt (19 %)",
          emphasis: true,
        },
        { label: "Zahlbar bis", value: "15. Oktober 2026", emphasis: true },
        { label: "Verwendungszweck", value: "RE-2026-0012" },
      ],
    },
    outro: [
      "Bitte geben Sie bei der Überweisung die Rechnungsnummer als Verwendungszweck an. 30 Tage Geld zurück ab Bestelldatum.",
    ],
  },
  questions: "Fragen dazu? Antworten Sie einfach auf diese E-Mail.",
  signOff: ["Mit freundlichen Grüßen", "Simon Orzel", "Geschäftsführer, nisd2.eu"],
} satisfies DocumentLetterProps;
