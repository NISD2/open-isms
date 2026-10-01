import { EmailFrame } from "../components/frame";
import { CtaButton, Para, Title } from "../components/parts";
import { BRAND } from "../layout";
import type { EmailLocale } from "../locale";

export interface RegistrationAttemptProps {
  readonly locale: EmailLocale;
  readonly heading: string;
  readonly intro: string;
  readonly action: string;
  readonly signIn: string;
  readonly reset: string;
  readonly ignoreNote: string;
  readonly signInUrl: string;
  readonly resetUrl: string;
}

/** To the owner, when someone registers with an address that already has an account. */
export default function RegistrationAttemptEmail(props: RegistrationAttemptProps) {
  const spaced = { margin: "0 8px 8px 0" } as const;
  return (
    <EmailFrame chrome={{ locale: props.locale }}>
      <Title>{props.heading}</Title>
      <Para>{props.intro}</Para>
      <Para style={{ margin: "0 0 24px" }}>{props.action}</Para>
      <CtaButton href={props.signInUrl} style={spaced}>
        {props.signIn}
      </CtaButton>
      <CtaButton
        href={props.resetUrl}
        style={{ ...spaced, background: BRAND.muted, color: BRAND.foreground }}
      >
        {props.reset}
      </CtaButton>
      <p
        style={{
          color: BRAND.mutedForeground,
          fontSize: "13px",
          margin: "16px 0 0",
          lineHeight: 1.5,
        }}
      >
        {props.ignoreNote}
      </p>
    </EmailFrame>
  );
}

RegistrationAttemptEmail.PreviewProps = {
  locale: "de",
  heading: "Jemand wollte sich mit deiner Adresse registrieren",
  intro:
    "Gerade wurde bei NISD2 ein neues Konto für diese Adresse angefragt. Zu dieser Adresse gibt es bereits ein Konto, deshalb wurde nichts geändert.",
  action:
    "Warst du das? Melde dich mit deinem bestehenden Konto an. Falls du dein Passwort nicht mehr weißt, setze es zurück.",
  signIn: "Anmelden",
  reset: "Passwort zurücksetzen",
  ignoreNote:
    "Falls du das nicht warst, ignoriere diese E-Mail. Dein Konto bleibt unverändert.",
  signInUrl: "https://nisd2.eu/anmelden",
  resetUrl: "https://nisd2.eu/passwort",
} satisfies RegistrationAttemptProps;
