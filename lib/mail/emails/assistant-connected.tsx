import { EmailFrame } from "../components/frame";
import { CtaButton, Note, Para, Title } from "../components/parts";
import type { WorkflowMailLocale } from "../locale";

export interface AssistantConnectedProps {
  readonly locale: WorkflowMailLocale;
  readonly companyName: string;
  /** A pasted key was made, or an assistant was allowed through its sign-in. */
  readonly how:
    | { readonly kind: "key" }
    | {
        readonly kind: "signin";
        readonly assistant: string;
        readonly returnHost: string;
      };
  readonly settingsUrl: string;
}

export const ASSISTANT_CONNECTED_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (companyName: string) => string;
    readonly heading: string;
    readonly key: (companyName: string) => string;
    readonly signin: (assistant: string, companyName: string, host: string) => string;
    readonly what: string;
    readonly button: string;
    readonly notYou: string;
  }
> = {
  en: {
    subject: (companyName) => `An AI assistant was connected to ${companyName}`,
    heading: "AI assistant connected",
    key: (companyName) => `A key for AI assistants was made for you in ${companyName}.`,
    signin: (assistant, companyName, host) =>
      `${assistant} was allowed to work in ${companyName} as you. It returns to ${host}.`,
    what: "It reads the NIS 2 walkthrough and fills it in with your rights, until you disconnect it. Signing out does not end it.",
    button: "Open Settings",
    notYou:
      "If this was not you, disconnect all assistants in Settings and change your password.",
  },
  cs: {
    subject: (companyName) => `K organizaci ${companyName} byl připojen asistent AI`,
    heading: "Asistent AI připojen",
    key: (companyName) =>
      `V organizaci ${companyName} pro vás byl vytvořen klíč pro asistenty AI.`,
    signin: (assistant, companyName, host) =>
      `${assistant} smí pracovat v organizaci ${companyName} jako vy. Vrací se na ${host}.`,
    what: "Čte průvodce NIS 2 a vyplňuje ho s vašimi oprávněními, dokud ho neodpojíte. Odhlášení ho neukončí.",
    button: "Otevřít Nastavení",
    notYou:
      "Pokud jste to nebyli vy, odpojte v Nastavení všechny asistenty a změňte si heslo.",
  },
};

/**
 * A security notice: someone connected an AI assistant as this person. A key or an assistant's
 * sign-in outlives the browser session, so the person hears of each one and can end it.
 */
export default function AssistantConnectedEmail({
  locale,
  companyName,
  how,
  settingsUrl,
}: AssistantConnectedProps) {
  const copy = ASSISTANT_CONNECTED_COPY[locale];
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{copy.heading}</Title>
      <Para>
        {how.kind === "key"
          ? copy.key(companyName)
          : copy.signin(how.assistant, companyName, how.returnHost)}
      </Para>
      <Para>{copy.what}</Para>
      <CtaButton href={settingsUrl}>{copy.button}</CtaButton>
      <Note>{copy.notYou}</Note>
    </EmailFrame>
  );
}

AssistantConnectedEmail.PreviewProps = {
  locale: "en",
  companyName: "Stadtwerke Musterstadt",
  how: { kind: "signin", assistant: "Claude Code", returnHost: "localhost:33418" },
  settingsUrl: "https://nisd2.eu/de/settings",
} satisfies AssistantConnectedProps;
