import { EmailFrame } from "../components/frame";
import { CtaButton, Note, Para, Title } from "../components/parts";
import { ENGLISH_ONLY } from "../layout";

export interface InviteProps {
  readonly companyName: string;
  readonly inviterName: string;
  readonly inviteUrl: string;
  readonly role: string;
}

/** An invitation to join a company's workspace. */
export default function InviteEmail({
  companyName,
  inviterName,
  inviteUrl,
  role,
}: InviteProps) {
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <Title>Join {companyName}</Title>
      <Para>
        {inviterName} has invited you to join <strong>{companyName}</strong> as{" "}
        <strong>{role}</strong> on the NIS2 Compliance Platform.
      </Para>
      <Para style={{ margin: "0 0 24px" }}>
        Click the button below to accept and get started.
      </Para>
      <CtaButton href={inviteUrl}>Accept Invite</CtaButton>
      <Note>
        This invite expires in 7 days. If you didn't expect this email, you can ignore it.
      </Note>
    </EmailFrame>
  );
}

InviteEmail.PreviewProps = {
  companyName: "Stadtwerke Musterstadt",
  inviterName: "Anna Schmidt",
  inviteUrl: "https://nisd2.eu/invite/preview",
  role: "member",
} satisfies InviteProps;
