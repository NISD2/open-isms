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
  readonly journeyUrl: string;
  readonly mechanism: string;
  readonly cta: string;
  readonly unsubscribeLabel: string;
  readonly unsubscribeUrl: string;
}

/**
 * The first lifecycle email (lib/lifecycle/emails/activation-nudge.ts decides who gets it and
 * writes the copy): real progress, the concrete next step, a link straight back.
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
          href={props.journeyUrl}
          style={{ color: BRAND.primary, textDecoration: "none", fontWeight: 600 }}
        >
          {props.nextStepTitle}
        </Link>
      </div>
      <Para style={{ margin: "0 0 24px" }}>{props.mechanism}</Para>
      <p style={{ margin: "0 0 8px" }}>
        <CtaButton
          href={props.journeyUrl}
          style={{ padding: "10px 20px", fontWeight: 600 }}
        >
          {props.cta}
        </CtaButton>
      </p>
      <SmallPrint>
        <MutedLink href={props.unsubscribeUrl}>{props.unsubscribeLabel}</MutedLink>
      </SmallPrint>
    </EmailFrame>
  );
}

ActivationNudgeEmail.PreviewProps = {
  locale: "de",
  greeting: "Guten Tag, Jan,",
  intro:
    "Sie haben 3 von 10 Anforderungen auf Ihrem Umsetzungspfad abgeschlossen. Als Nächstes steht an:",
  nextStepTitle: "Risikoanalyse dokumentieren",
  journeyUrl: "https://nisd2.eu/journey",
  mechanism:
    "Jeder Schritt wird beim Abschluss direkt dokumentiert. So entsteht der Nachweis während der Arbeit, nicht erst kurz vor einer Prüfung.",
  cta: "Im Pfad weitermachen",
  unsubscribeLabel: "Erinnerungen per E-Mail abbestellen",
  unsubscribeUrl: "https://nisd2.eu/u",
} satisfies ActivationNudgeEmailProps;
