import { EmailFrame } from "../components/frame";
import { CtaButton, Note, Para, Title } from "../components/parts";

export interface ManagementHandoffProps {
  readonly locale: "de" | "en";
  /** Management's name as the colleague typed it, made safe for mail; empty for none. */
  readonly name: string;
  readonly inviterName: string;
  readonly companyName: string;
  readonly inviteUrl: string;
  readonly days: number;
  /** Shown only when a reply reaches a person (letterReplyTo). */
  readonly questions: string | null;
}

type Parts = Pick<ManagementHandoffProps, "inviterName" | "companyName">;

export const MANAGEMENT_HANDOFF_COPY = {
  de: {
    subject: ({ inviterName }: Parts) =>
      `${inviterName} bittet Sie um Ihre Entscheidung zum NIS 2 Durchgang`,
    heading: "Zur Freigabe: NIS 2 Durchgang",
    hello: (name: string) => (name ? `Guten Tag ${name},` : "Guten Tag,"),
    invite: ({ inviterName, companyName }: Parts) =>
      `${inviterName} lädt Sie in das Konto von ${companyName} auf nisd2.eu ein und bittet Sie, über den NIS 2 Durchgang zu entscheiden. Nach der Anmeldung sehen Sie eine Seite mit allem, was Sie dafür brauchen: was der Durchgang ist, welche Dokumente er schreibt, was er kostet und wie man ihn wieder beendet.`,
    sameAccount: ({ inviterName, companyName }: Parts) =>
      `Sie arbeiten dann im selben Konto wie ${inviterName}. Bestellen Sie dort, gilt die Bestellung für ${companyName}. Ein eigenes Konto brauchen Sie dafür nicht.`,
    button: "Einladung annehmen",
    note: (days: number) =>
      `Die Einladung gilt ${days} Tage. Haben Sie diese E-Mail nicht erwartet, können Sie sie ignorieren.`,
    colleague: "Jemand aus Ihrem Unternehmen",
    company: "Ihr Unternehmen",
  },
  en: {
    subject: ({ inviterName }: Parts) =>
      `${inviterName} asks for your decision on the NIS 2 walkthrough`,
    heading: "For your approval: NIS 2 walkthrough",
    hello: (name: string) => (name ? `Hello ${name},` : "Hello,"),
    invite: ({ inviterName, companyName }: Parts) =>
      `${inviterName} has invited you to the account of ${companyName} on nisd2.eu and asks you to decide on the NIS 2 walkthrough. After signing in you see one page with everything you need for that: what the walkthrough is, which documents it writes, what it costs and how to end it.`,
    sameAccount: ({ inviterName, companyName }: Parts) =>
      `You then work in the same account as ${inviterName}. If you order there, the order is for ${companyName}. You do not need an account of your own for it.`,
    button: "Accept the invitation",
    note: (days: number) =>
      `The invitation is valid for ${days} days. If you did not expect this email, you can ignore it.`,
    colleague: "A colleague",
    company: "your company",
  },
} as const;

/**
 * Management's invitation into the company's account, sent from the walk's lock by the colleague
 * who walks it: accepting opens the decision page, and an order from there is for that company.
 */
export default function ManagementHandoffEmail(props: ManagementHandoffProps) {
  const copy = MANAGEMENT_HANDOFF_COPY[props.locale];
  return (
    <EmailFrame chrome={{ locale: props.locale }}>
      <Title>{copy.heading}</Title>
      <Para>{copy.hello(props.name)}</Para>
      <Para>{copy.invite(props)}</Para>
      <Para style={{ margin: "0 0 24px" }}>{copy.sameAccount(props)}</Para>
      <CtaButton href={props.inviteUrl}>{copy.button}</CtaButton>
      <Note>{copy.note(props.days)}</Note>
      {props.questions ? (
        <Note style={{ margin: "8px 0 0" }}>{props.questions}</Note>
      ) : null}
    </EmailFrame>
  );
}

ManagementHandoffEmail.PreviewProps = {
  locale: "de",
  name: "Anna Beispiel",
  inviterName: "Max Muster",
  companyName: "Muster GmbH",
  inviteUrl: "https://nisd2.eu/invite/preview",
  days: 7,
  questions: "Fragen zum Durchgang? Antworten Sie einfach auf diese E-Mail.",
} satisfies ManagementHandoffProps;
