import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { InlineLink, Para } from "../components/parts";
import { BRAND, ENGLISH_ONLY } from "../layout";

export interface WelcomeProps {
  readonly name: string;
  /** Where questions reach a person: the published contact address on nisd2.eu. */
  readonly contact: string;
}

const paragraph = { fontSize: "15px", lineHeight: 1.65, margin: "0 0 16px" } as const;

/** After the first sign-in: a short note from the team and one place to start. */
export default function WelcomeEmail({ name, contact }: WelcomeProps) {
  return (
    <EmailFrame
      chrome={ENGLISH_ONLY}
      preview="Welcome to NISD2: your NIS2 compliance platform"
    >
      <p
        style={{
          color: BRAND.foreground,
          fontSize: "18px",
          fontWeight: 600,
          margin: "0 0 16px",
        }}
      >
        Hey {name},
      </p>
      <Para style={paragraph}>thanks for signing up.</Para>
      <Para style={paragraph}>
        Our mission is straightforward: NIS2 compliance costs European companies{" "}
        <InlineLink href="https://nisd2.eu">€31 billion every year</InlineLink>. We're
        cutting that in half by replacing expensive consultants with a platform that does
        the heavy lifting for you.
      </Para>
      <Para style={paragraph}>
        A good first step is the{" "}
        <InlineLink href="https://nisd2.eu/training/courses/nis2-ceo">
          CEO & Management Training
        </InlineLink>
        . It covers what NIS2 actually requires from leadership and satisfies the §38 BSIG
        training obligation, it takes about 4 hours.
      </Para>
      <Para style={paragraph}>
        If you have any questions, write to me at{" "}
        <InlineLink href={`mailto:${contact}`}>{contact}</InlineLink>
      </Para>
      <p
        style={{
          color: BRAND.foreground,
          fontSize: "15px",
          lineHeight: 1.65,
          margin: "24px 0 0",
        }}
      >
        Cory Hisey
        <br />
        <Link
          href="https://nisd2.eu"
          style={{ color: BRAND.mutedForeground, textDecoration: "none" }}
        >
          NISD2.eu
        </Link>
      </p>
      <p style={{ color: BRAND.mutedForeground, fontSize: "12px", margin: "24px 0 0" }}>
        You're receiving this because you created an account at nisd2.eu.
      </p>
    </EmailFrame>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Anna",
  contact: "contact@nisd2.eu",
} satisfies WelcomeProps;
