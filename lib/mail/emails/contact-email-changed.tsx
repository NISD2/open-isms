import { EmailFrame } from "../components/frame";
import { Note, Para, Title } from "../components/parts";
import { ENGLISH_ONLY } from "../layout";

export interface ContactEmailChangedProps {
  readonly companyName: string;
  readonly oldEmail: string;
  readonly newEmail: string;
}

/** A security notice: the company's compliance contact address changed. */
export default function ContactEmailChangedEmail({
  companyName,
  oldEmail,
  newEmail,
}: ContactEmailChangedProps) {
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <Title>Contact Email Changed</Title>
      <Para>
        The compliance contact email for <strong>{companyName}</strong> has been changed.
      </Para>
      <Para>
        Previous: <strong>{oldEmail}</strong>
        <br />
        New: <strong>{newEmail}</strong>
      </Para>
      <Note>
        If you did not make this change, please contact your team administrator.
      </Note>
    </EmailFrame>
  );
}

ContactEmailChangedEmail.PreviewProps = {
  companyName: "Stadtwerke Musterstadt",
  oldEmail: "it@stadtwerke.example",
  newEmail: "security@stadtwerke.example",
} satisfies ContactEmailChangedProps;
