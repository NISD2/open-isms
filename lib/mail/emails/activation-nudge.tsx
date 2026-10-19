import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { CtaButton, MutedLink, Para, SmallPrint } from "../components/parts";
import { BRAND } from "../layout";
import type { EmailLocale } from "../locale";

export interface ActivationNudgeEmailProps {
  readonly locale: EmailLocale;
  readonly greeting: string;
  readonly intro: string;
  readonly nextStepTitle: string;
  readonly walkUrl: string;
  /** How the walkthrough works, and for a locked one what the page shows. */
  readonly notes: readonly string[];
  readonly cta: string;
  /** One question about the reader's last time; a reply reaches a person. */
  readonly question: string;
  /** Lines of the sign-off, split on "\n". */
  readonly signOff: string;
  readonly unsubscribeLabel: string;
  readonly unsubscribeUrl: string;
}

/**
 * The first lifecycle email (lib/lifecycle/emails/activation-nudge.ts decides who gets it and
 * writes the copy): where the walkthrough stands, the concrete next step, a link to its home.
 */
export default function ActivationNudgeEmail(props: ActivationNudgeEmailProps) {
  const spaced = { margin: "0 0 16px" } as const;
  return (
    <EmailFrame chrome={{ locale: props.locale }}>
      <Para style={spaced}>{props.greeting}</Para>
      <Para style={spaced}>{props.intro}</Para>
      <div
        style={{
          background: BRAND.muted,
          borderLeft: `3px solid ${BRAND.primary}`,
          padding: "12px 16px",
          margin: "0 0 20px",
        }}
      >
        <Link
          href={props.walkUrl}
          style={{ color: BRAND.primary, textDecoration: "none", fontWeight: 600 }}
        >
          {props.nextStepTitle}
        </Link>
      </div>
      {props.notes.map((note, i) => (
        <Para
          key={note}
          style={{ margin: i === props.notes.length - 1 ? "0 0 24px" : "0 0 16px" }}
        >
          {note}
        </Para>
      ))}
      <p style={{ margin: "0 0 24px" }}>
        <CtaButton href={props.walkUrl} style={{ padding: "10px 20px", fontWeight: 600 }}>
          {props.cta}
        </CtaButton>
      </p>
      <Para style={spaced}>{props.question}</Para>
      <Para style={{ margin: "0 0 8px" }}>
        {props.signOff.split("\n").map((line, i) => (
          <span key={line}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </Para>
      <SmallPrint>
        <MutedLink href={props.unsubscribeUrl}>{props.unsubscribeLabel}</MutedLink>
      </SmallPrint>
    </EmailFrame>
  );
}

ActivationNudgeEmail.PreviewProps = {
  locale: "de",
  greeting: "Guten Tag, Jan,",
  intro: "Im NIS 2 Durchgang sind 3 von 20 Punkten bearbeitet. Als Nächstes steht an:",
  nextStepTitle: "Aufschreiben, was Ihr Unternehmen hat",
  walkUrl: "https://nisd2.eu/durchgang/nis2",
  notes: [
    "Sie sehen immer nur einen Punkt, und was noch nicht geht, legen Sie zur Seite. Am Ende sieht die Geschäftsführung alles durch und unterschreibt.",
  ],
  cta: "NIS 2 Umsetzung fortsetzen",
  question:
    "Eine Frage noch: Als Sie zuletzt im Durchgang waren, was hat Sie unterbrochen? Eine Zeile als Antwort reicht.",
  signOff: "Viele Grüße\nSimon",
  unsubscribeLabel: "Erinnerungen per E-Mail abbestellen",
  unsubscribeUrl: "https://nisd2.eu/u",
} satisfies ActivationNudgeEmailProps;
