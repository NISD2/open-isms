/**
 * The supplier mails go to an address the sending company typed in, so they carry nothing that
 * company wrote except its name, cleaned by companyNameForMail. The incident's title and text, and
 * an invite's personal message, are read on nisd2.eu behind the link: a mail signed by our domain
 * must not be a free channel for someone else's links and instructions.
 *
 * Three emails in one file share these rules; the default export is the one the preview server
 * shows.
 */
import { EmailFrame } from "../components/frame";
import { CtaButton, MutedLink, Para, SmallPrint, Title } from "../components/parts";
import { BRAND, ENGLISH_ONLY, SEVERITY } from "../layout";

export interface SupplierIncidentProps {
  /** Already cleaned with companyNameForMail. */
  readonly name: string;
  readonly severity: string;
  readonly publishedAt: string;
  readonly incidentUrl: string;
  readonly unsubscribeUrl: string;
}

export function SupplierIncidentEmail(props: SupplierIncidentProps) {
  const color =
    props.severity === "critical"
      ? SEVERITY.destructive
      : props.severity === "warning"
        ? SEVERITY.warning
        : "#2563eb";
  const label = props.severity.charAt(0).toUpperCase() + props.severity.slice(1);
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <div
        style={{
          display: "inline-block",
          background: color,
          color: "#fff",
          padding: "4px 10px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <Title style={{ margin: "16px 0 8px" }}>
        {props.name} reported a security incident
      </Title>
      <p style={{ color: BRAND.mutedForeground, fontSize: "13px", margin: "0 0 16px" }}>
        Security notification · {props.publishedAt}
      </p>
      <Para style={{ margin: "0 0 24px" }}>
        <strong>{props.name}</strong> published an incident notice for you on nisd2.eu.
        The details are on the notice page: we never copy a supplier's own text into
        email.
      </Para>
      <CtaButton
        href={props.incidentUrl}
        style={{ padding: "10px 20px", fontSize: "14px" }}
      >
        Read the incident notice
      </CtaButton>
      <SmallPrint>
        You received this because {props.name} added your address as a recipient of their
        security updates on nisd2.eu. Use this notification as evidence for your own NIS2
        §30 supplier monitoring.
        <br />
        <br />
        <MutedLink href={props.unsubscribeUrl}>Unsubscribe</MutedLink>
      </SmallPrint>
    </EmailFrame>
  );
}

export interface SupplierInviteProps {
  readonly name: string;
  readonly inviteUrl: string;
  readonly hasMessage: boolean;
}

/** Direction B: a NIS2 entity invites a supplier to fill out their security profile. */
export function SupplierInviteEmail({
  name,
  inviteUrl,
  hasMessage,
}: SupplierInviteProps) {
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <Title>You're invited to share your security profile</Title>
      <Para style={{ margin: "0 0 16px" }}>
        <strong>{name}</strong> is a NIS2-regulated entity. Under the EU NIS2 Directive
        (and its German transposition BSIG §30) they are required to assess the
        cybersecurity practices of their suppliers, including yours.
      </Para>
      <Para style={{ margin: "0 0 16px" }}>
        Instead of sending you a 200-question PDF questionnaire, they are using nisd2.eu,
        where you can fill out a single unified questionnaire (anchored to ENISA's NIS2
        Technical Implementation Guidance v1.0 and CIR 2024/2690) and share it with every
        customer who asks. Fill it once. Use it forever. Free.
      </Para>
      {hasMessage ? (
        <Para style={{ margin: "0 0 24px" }}>
          {name} added a personal message, which you can read on the invitation page after
          signing in.
        </Para>
      ) : null}
      <CtaButton href={inviteUrl} style={{ fontSize: "14px" }}>
        Accept and create your free profile
      </CtaButton>
      <SmallPrint>
        This link is unique to you and expires in 30 days. You do not need to be a
        NIS2-regulated entity yourself to use the supplier portal. Most suppliers aren't.
      </SmallPrint>
    </EmailFrame>
  );
}

export interface SupplierAddedYouProps {
  readonly name: string;
  readonly profileUrl: string | null;
  readonly unsubscribeUrl: string;
}

/** A supplier added the reader as a recipient of its security updates. */
export function SupplierAddedYouEmail({
  name,
  profileUrl,
  unsubscribeUrl,
}: SupplierAddedYouProps) {
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <Title>You've been added as a security update recipient</Title>
      <Para>
        <strong>{name}</strong> added your email address to their NIS2 supplier portal on
        nisd2.eu. You will receive security incident notifications and certification
        updates from them.
      </Para>
      <Para style={{ margin: "0 0 24px" }}>
        These notifications are useful evidence for your own NIS2 §30 supplier monitoring
        obligation. You can unsubscribe at any time.
      </Para>
      {profileUrl ? (
        <CtaButton href={profileUrl} style={{ padding: "10px 20px", fontSize: "14px" }}>
          View supplier profile
        </CtaButton>
      ) : null}
      <SmallPrint>
        <MutedLink href={unsubscribeUrl}>Unsubscribe</MutedLink>
      </SmallPrint>
    </EmailFrame>
  );
}

export default SupplierIncidentEmail;

SupplierIncidentEmail.PreviewProps = {
  name: "ACME GmbH",
  severity: "high",
  publishedAt: "08.09.2026, 10:00:00",
  incidentUrl: "https://nisd2.eu/s#incident-1",
  unsubscribeUrl: "https://nisd2.eu/u",
} satisfies SupplierIncidentProps;
