import { EmailFrame } from "../components/frame";
import { Note, Para, Title } from "../components/parts";
import type { WorkflowMailLocale } from "../locale";

export interface TwoFactorResetProps {
  readonly locale: WorkflowMailLocale;
  readonly host: string;
  /** An address a person reads (replyAddress), never the no-reply sender. */
  readonly contact: string;
}

export const TWO_FACTOR_RESET_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (host: string) => string;
    readonly heading: string;
    readonly body: (host: string) => string;
    readonly next: string;
    readonly notYou: (contact: string) => string;
  }
> = {
  en: {
    subject: (host) => `Your two-factor sign-in at ${host} was reset`,
    heading: "Two-factor sign-in reset",
    body: (host) =>
      `The team at ${host} removed the authenticator app from your account. Your old codes and recovery codes no longer work.`,
    next: "If your company requires it, you set up the app again at your next sign-in. Otherwise you can turn it on again in Settings.",
    notYou: (contact) =>
      `If you did not ask for this, write to ${contact} straight away.`,
  },
  cs: {
    subject: (host) => `Dvoufázové přihlášení na ${host} bylo zrušeno`,
    heading: "Dvoufázové přihlášení zrušeno",
    body: (host) =>
      `Tým ${host} odebral z vašeho účtu ověřovací aplikaci. Staré kódy ani záložní kódy už neplatí.`,
    next: "Pokud to vaše organizace vyžaduje, aplikaci nastavíte znovu při příštím přihlášení. Jinak ji můžete znovu zapnout v Nastavení.",
    notYou: (contact) => `Pokud jste o to nežádali, napište ihned na ${contact}.`,
  },
};

/** A security notice: a platform admin removed the person's authenticator app. */
export default function TwoFactorResetEmail({
  locale,
  host,
  contact,
}: TwoFactorResetProps) {
  const copy = TWO_FACTOR_RESET_COPY[locale];
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{copy.heading}</Title>
      <Para>{copy.body(host)}</Para>
      <Para>{copy.next}</Para>
      <Note>{copy.notYou(contact)}</Note>
    </EmailFrame>
  );
}

TwoFactorResetEmail.PreviewProps = {
  locale: "en",
  host: "nisd2.eu",
  contact: "contact@example.com",
} satisfies TwoFactorResetProps;
