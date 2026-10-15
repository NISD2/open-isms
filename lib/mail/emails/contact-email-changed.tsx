import { EmailFrame } from "../components/frame";
import { Note, Para, Title } from "../components/parts";
import type { WorkflowMailLocale } from "../locale";

export interface ContactEmailChangedProps {
  readonly locale: WorkflowMailLocale;
  readonly companyName: string;
  readonly oldEmail: string;
  readonly newEmail: string;
}

export const CONTACT_EMAIL_CHANGED_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (companyName: string) => string;
    readonly heading: string;
    /** The text before and after the company name, which is set in bold. */
    readonly changed: { readonly lead: string; readonly end: string };
    readonly previous: string;
    readonly next: string;
    readonly notYou: string;
  }
> = {
  en: {
    subject: (companyName) => `The compliance contact for ${companyName} was changed`,
    heading: "Contact Email Changed",
    changed: { lead: "The compliance contact email for ", end: " has been changed." },
    previous: "Previous",
    next: "New",
    notYou: "If you did not make this change, please contact your team administrator.",
  },
  cs: {
    subject: (companyName) => `Kontaktní e-mail organizace ${companyName} byl změněn`,
    heading: "Kontaktní e-mail změněn",
    changed: { lead: "Kontaktní e-mail pro NIS 2 organizace ", end: " byl změněn." },
    previous: "Dosavadní",
    next: "Nový",
    notYou:
      "Pokud jste tuto změnu neprovedli vy, obraťte se na administrátora svého týmu.",
  },
};

/** A security notice: the company's compliance contact address changed. */
export default function ContactEmailChangedEmail({
  locale,
  companyName,
  oldEmail,
  newEmail,
}: ContactEmailChangedProps) {
  const copy = CONTACT_EMAIL_CHANGED_COPY[locale];
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{copy.heading}</Title>
      <Para>
        {copy.changed.lead}
        <strong>{companyName}</strong>
        {copy.changed.end}
      </Para>
      <Para>
        {copy.previous}: <strong>{oldEmail}</strong>
        <br />
        {copy.next}: <strong>{newEmail}</strong>
      </Para>
      <Note>{copy.notYou}</Note>
    </EmailFrame>
  );
}

ContactEmailChangedEmail.PreviewProps = {
  locale: "en",
  companyName: "Stadtwerke Musterstadt",
  oldEmail: "it@stadtwerke.example",
  newEmail: "security@stadtwerke.example",
} satisfies ContactEmailChangedProps;
