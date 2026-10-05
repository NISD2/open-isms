/**
 * Two notices to our own operators, kept apart in every visible way because they ask for
 * different reactions: a signup is a statistic, an advisory request is the only revenue event we
 * have, and whoever answers first tends to get the work. The default export is the one the
 * preview server shows.
 */
import { EmailFrame } from "../components/frame";
import { CtaButton, FactRows, Title } from "../components/parts";
import { BRAND, ENGLISH_ONLY, TO_OPERATORS } from "../layout";

export interface NewSignupProps {
  readonly userEmail: string;
  readonly userName: string;
  readonly provider: string;
  readonly at: string;
  readonly mailtoUrl: string;
  /** The language the prepared follow-up is written in. */
  readonly followUpLanguage: string;
  /** The campaign tags of the page the signup started from, as one line; null without any. */
  readonly source: string | null;
}

export function NewSignupEmail({
  userEmail,
  userName,
  provider,
  at,
  mailtoUrl,
  followUpLanguage,
  source,
}: NewSignupProps) {
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <Title>New user signed up</Title>
      <FactRows
        rows={[
          ["Email", userEmail],
          ["Name", userName],
          ["Provider", provider],
          ...(source ? [["Source", source] as const] : []),
          ["Time", at],
          [
            "Follow-up",
            `prepared in ${followUpLanguage}: the offer, the call, the page for management`,
          ],
        ]}
      />
      <CtaButton href={mailtoUrl}>Follow up with {userEmail}</CtaButton>
    </EmailFrame>
  );
}

export interface AdvisoryRequestProps {
  readonly topic: string;
  readonly email: string;
  readonly origin: string;
  readonly at: string;
  readonly adminUrl: string;
}

export function AdvisoryRequestEmail({
  topic,
  email,
  origin,
  at,
  adminUrl,
}: AdvisoryRequestProps) {
  return (
    <EmailFrame chrome={TO_OPERATORS}>
      <Title>Jemand hat um Unterstützung gebeten</Title>
      <FactRows
        rows={[
          ["Thema", topic],
          ["Kontakt", email],
          ["Herkunft", origin],
          ["Eingegangen", at],
        ]}
      />
      <p style={{ color: BRAND.foreground, fontSize: "14px", margin: "0 0 24px" }}>
        Heute antworten. Wer zuerst reagiert, bekommt die Arbeit.
      </p>
      <CtaButton href={adminUrl}>Anfrage öffnen</CtaButton>
    </EmailFrame>
  );
}

export default AdvisoryRequestEmail;

AdvisoryRequestEmail.PreviewProps = {
  topic: "Hilfe bei der Registrierung",
  email: "it@stadtwerke.example",
  origin: "/registrierung",
  at: "02.10.2026, 10:00:00",
  adminUrl: "https://nisd2.eu/platform-admin",
} satisfies AdvisoryRequestProps;
