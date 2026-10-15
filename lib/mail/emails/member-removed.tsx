import { EmailFrame } from "../components/frame";
import { Para, Title } from "../components/parts";
import type { WorkflowMailLocale } from "../locale";

export interface MemberRemovedProps {
  readonly locale: WorkflowMailLocale;
  readonly companyName: string;
  readonly memberName: string;
}

export const MEMBER_REMOVED_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (companyName: string) => string;
    readonly heading: (companyName: string) => string;
    /** The text before and after the company name, which is set in bold. */
    readonly removed: (memberName: string) => {
      readonly lead: string;
      readonly end: string;
    };
    readonly mistake: string;
  }
> = {
  en: {
    subject: (companyName) => `You no longer have access to ${companyName}`,
    heading: (companyName) => `Removed from ${companyName}`,
    removed: (memberName) => ({
      lead: `Hi ${memberName}, you have been removed from `,
      end: " on the NIS2 Compliance Platform.",
    }),
    mistake: "If you believe this was a mistake, please contact your team administrator.",
  },
  cs: {
    subject: (companyName) => `Už nemáte přístup k organizaci ${companyName}`,
    heading: (companyName) => `Odebrání z organizace ${companyName}`,
    removed: () => ({
      lead: "Dobrý den, byli jste odebráni z organizace ",
      end: " na platformě pro zavádění NIS 2.",
    }),
    mistake: "Pokud jde podle vás o omyl, obraťte se na administrátora svého týmu.",
  },
};

/** The reader lost access to a company's workspace. */
export default function MemberRemovedEmail({
  locale,
  companyName,
  memberName,
}: MemberRemovedProps) {
  const copy = MEMBER_REMOVED_COPY[locale];
  const { lead, end } = copy.removed(memberName);
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{copy.heading(companyName)}</Title>
      <Para>
        {lead}
        <strong>{companyName}</strong>
        {end}
      </Para>
      <Para style={{ margin: 0 }}>{copy.mistake}</Para>
    </EmailFrame>
  );
}

MemberRemovedEmail.PreviewProps = {
  locale: "en",
  companyName: "Stadtwerke Musterstadt",
  memberName: "Jan",
} satisfies MemberRemovedProps;
