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
      `${inviterName} lädt Sie in das Konto Ihres Unternehmens auf nisd2.eu ein`,
    heading: "Einladung in Ihr Unternehmenskonto",
    hello: (name: string) => (name ? `Guten Tag ${name},` : "Guten Tag,"),
    invite: ({ inviterName, companyName }: Parts) =>
      `${inviterName} lädt Sie als Geschäftsführung in das Konto von ${companyName} auf nisd2.eu ein.`,
    sameAccount: ({ inviterName }: Parts) =>
      `Sie arbeiten dann im selben Konto wie ${inviterName}. Ein eigenes Konto brauchen Sie dafür nicht.`,
    button: "Einladung annehmen",
    note: (days: number) =>
      `Die Einladung gilt ${days} Tage. Haben Sie diese E-Mail nicht erwartet, können Sie sie ignorieren.`,
    colleague: "Jemand aus Ihrem Unternehmen",
    company: "Ihr Unternehmen",
  },
  en: {
    subject: ({ inviterName }: Parts) =>
      `${inviterName} invited you to your company's account on nisd2.eu`,
    heading: "Invitation to your company's account",
    hello: (name: string) => (name ? `Hello ${name},` : "Hello,"),
    invite: ({ inviterName, companyName }: Parts) =>
      `${inviterName} has invited you as management to the account of ${companyName} on nisd2.eu.`,
    sameAccount: ({ inviterName }: Parts) =>
      `You then work in the same account as ${inviterName}. You do not need an account of your own for it.`,
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
