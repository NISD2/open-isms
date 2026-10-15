import { EmailFrame } from "../components/frame";
import { CtaButton, Note, Para, Title } from "../components/parts";
import type { WorkflowMailLocale } from "../locale";

export interface InviteProps {
  readonly locale: WorkflowMailLocale;
  readonly companyName: string;
  readonly inviterName: string;
  readonly inviteUrl: string;
  readonly role: string;
}

/**
 * The labels the Czech team page shows for each role (messages/team/cs.json, team.roles and
 * team.memberRole.member).
 */
const CZECH_ROLE: Readonly<Record<string, string>> = {
  member: "Člen",
  ceo: "Generální ředitel / Jednatel",
  ciso: "CISO / Pověřenec pro bezpečnost IT",
  cto: "CTO / Vedoucí vývoje",
  coo: "COO / Provozní ředitel",
  cpo: "CPO / Vedoucí nákupu",
  hr_director: "Personální ředitel",
  legal: "Právní / Compliance referent",
  dpo: "Pověřenec pro ochranu osobních údajů",
};

type Parts = Pick<InviteProps, "companyName" | "inviterName" | "role">;

export const INVITE_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (p: Parts) => string;
    readonly heading: (companyName: string) => string;
    /** The invitation sentence, split around the company name and the role, which are set in bold. */
    readonly invite: (p: Parts) => {
      readonly lead: string;
      readonly company: string;
      readonly as: string;
      readonly role: string;
      readonly end: string;
    };
    readonly click: string;
    readonly button: string;
    readonly acceptText: string;
    readonly note: string;
    readonly expires: string;
  }
> = {
  en: {
    subject: ({ inviterName, companyName }) =>
      `${inviterName} invited you to ${companyName} on NISD2`,
    heading: (companyName) => `Join ${companyName}`,
    invite: ({ inviterName, companyName, role }) => ({
      lead: `${inviterName} has invited you to join `,
      company: companyName,
      as: " as ",
      role,
      end: " on the NIS2 Compliance Platform.",
    }),
    click: "Click the button below to accept and get started.",
    button: "Accept Invite",
    acceptText: "Accept the invite",
    note: "This invite expires in 7 days. If you didn't expect this email, you can ignore it.",
    expires: "This invite expires in 7 days.",
  },
  cs: {
    subject: ({ inviterName, companyName }) =>
      `${inviterName} vás zve do organizace ${companyName} na NISD2`,
    heading: (companyName) => `Připojte se k organizaci ${companyName}`,
    invite: ({ inviterName, companyName, role }) => ({
      lead: `${inviterName} vás zve do organizace `,
      company: companyName,
      as: " v roli ",
      role: CZECH_ROLE[role] ?? role,
      end: " na platformě pro zavádění NIS 2.",
    }),
    click: "Pozvánku přijmete tlačítkem níže.",
    button: "Přijmout pozvánku",
    acceptText: "Přijmout pozvánku",
    note: "Pozvánka platí 7 dní. Pokud jste tento e-mail nečekali, můžete ho ignorovat.",
    expires: "Pozvánka platí 7 dní.",
  },
};

/** The invitation sentence as plain text. */
export const inviteText = (locale: WorkflowMailLocale, parts: Parts): string => {
  const { lead, company, as, role, end } = INVITE_COPY[locale].invite(parts);
  return `${lead}${company}${as}${role}${end}`;
};

/** An invitation to join a company's workspace. */
export default function InviteEmail({ locale, inviteUrl, ...parts }: InviteProps) {
  const copy = INVITE_COPY[locale];
  const { lead, company, as, role, end } = copy.invite(parts);
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{copy.heading(parts.companyName)}</Title>
      <Para>
        {lead}
        <strong>{company}</strong>
        {as}
        <strong>{role}</strong>
        {end}
      </Para>
      <Para style={{ margin: "0 0 24px" }}>{copy.click}</Para>
      <CtaButton href={inviteUrl}>{copy.button}</CtaButton>
      <Note>{copy.note}</Note>
    </EmailFrame>
  );
}

InviteEmail.PreviewProps = {
  locale: "en",
  companyName: "Stadtwerke Musterstadt",
  inviterName: "Anna Schmidt",
  inviteUrl: "https://nisd2.eu/invite/preview",
  role: "member",
} satisfies InviteProps;
