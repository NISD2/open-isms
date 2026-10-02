import { EmailFrame } from "../components/frame";
import { Para, Title } from "../components/parts";
import { ENGLISH_ONLY } from "../layout";

export interface MemberRemovedProps {
  readonly companyName: string;
  readonly memberName: string;
}

/** The reader lost access to a company's workspace. */
export default function MemberRemovedEmail({
  companyName,
  memberName,
}: MemberRemovedProps) {
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <Title>Removed from {companyName}</Title>
      <Para>
        Hi {memberName}, you have been removed from <strong>{companyName}</strong> on the
        NIS2 Compliance Platform.
      </Para>
      <Para style={{ margin: 0 }}>
        If you believe this was a mistake, please contact your team administrator.
      </Para>
    </EmailFrame>
  );
}

MemberRemovedEmail.PreviewProps = {
  companyName: "Stadtwerke Musterstadt",
  memberName: "Jan",
} satisfies MemberRemovedProps;
