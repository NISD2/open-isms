import type { WalkLocale } from "@/lib/durchgang/types";
import { EmailFrame } from "../components/frame";
import { CtaButton, Note, Para, Title } from "../components/parts";

export interface AccountSetupProps {
  readonly setupUrl: string;
  readonly locale: WalkLocale;
}

export const ACCOUNT_SETUP_COPY: Record<
  WalkLocale,
  {
    readonly subject: string;
    readonly heading: string;
    readonly body: string;
    readonly button: string;
    readonly note: string;
  }
> = {
  de: {
    subject: "Ihr Zugang zu nisd2.eu",
    heading: "Ihr Zugang ist eingerichtet",
    body: "Wir haben Ihr Konto für den NIS 2 Durchgang angelegt. Legen Sie über den Link ein Passwort fest, oder melden Sie sich mit Google unter dieser E-Mail-Adresse an.",
    button: "Zugang einrichten",
    note: "Der Link gilt sieben Tage und lässt sich einmal verwenden. Die Rechnung kommt in einer eigenen E-Mail.",
  },
  en: {
    subject: "Your access to nisd2.eu",
    heading: "Your access is ready",
    body: "We have set up your account for the NIS 2 walkthrough. Use the link to set a password, or sign in with Google under this email address.",
    button: "Set up access",
    note: "The link is valid for seven days and works once. The invoice arrives in a separate email.",
  },
  cs: {
    subject: "Váš přístup k nisd2.eu",
    heading: "Váš přístup je připravený",
    body: "Založili jsme vám účet pro průvodce NIS 2. Přes odkaz si nastavte heslo, nebo se přihlaste přes Google pod touto e-mailovou adresou.",
    button: "Nastavit přístup",
    note: "Odkaz platí sedm dní a lze ho použít jednou. Faktura přijde v samostatném e-mailu.",
  },
};

/**
 * The way into an account a platform admin opened on a sales call. Sent next to the invoice; the
 * link sets a first password, or the person continues with Google under the same address.
 */
export default function AccountSetupEmail({ setupUrl, locale }: AccountSetupProps) {
  const copy = ACCOUNT_SETUP_COPY[locale];
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{copy.heading}</Title>
      <Para style={{ margin: "0 0 24px" }}>{copy.body}</Para>
      <CtaButton href={setupUrl}>{copy.button}</CtaButton>
      <Note>{copy.note}</Note>
    </EmailFrame>
  );
}

AccountSetupEmail.PreviewProps = {
  setupUrl: "https://nisd2.eu/setup/preview",
  locale: "de",
} satisfies AccountSetupProps;
