import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { mailSupportEmail } from "@/lib/env";

interface WelcomeEmailProps {
  name: string;
  dashboardUrl: string;
}

export function WelcomeEmail(_props: WelcomeEmailProps) {
  const supportEmail = mailSupportEmail();
  return (
    <Html>
      <Head />
      <Preview>Welcome to NISD2: your NIS2 compliance platform</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column style={logoCell}>
                <Img
                  src="https://nisd2.eu/nisd2-logo.png"
                  alt="NISD2"
                  width="40"
                  height="40"
                  style={logoImage}
                />
              </Column>
              <Column style={brandCell}>
                <Text style={logo}>NISD2</Text>
                <Text style={tagline}>Halve Europe&apos;s NIS2 bill.</Text>
              </Column>
            </Row>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Text style={greeting}>Hey {_props.name},</Text>

            <Text style={paragraph}>
              thanks for signing up.
            </Text>

            <Text style={paragraph}>
              Our mission is straightforward: NIS2 compliance costs European
              companies{" "}
              <a href="https://nisd2.eu" style={link}>
                €31 billion every year
              </a>
              . We&apos;re cutting that in half by replacing expensive
              consultants with a platform that does the heavy lifting for you.
            </Text>

            <Text style={paragraph}>
              A good first step is the{" "}
              <a
                href="https://nisd2.eu/training/courses/nis2-ceo"
                style={link}
              >
                CEO &amp; Management Training
              </a>
              . It covers what NIS2 actually requires from leadership and
              satisfies the §38 BSIG training obligation, it takes about 4
              hours.
            </Text>

            <Text style={paragraph}>
              If you have any questions, write to me at{" "}
              <a href={`mailto:${supportEmail}`} style={link}>
                {supportEmail}
              </a>
            </Text>

            <Text style={signature}>
              Cory Hisey
              <br />
              <a href="https://nisd2.eu" style={signatureLink}>
                NISD2.eu
              </a>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section>
            <Text style={footer}>
              You&apos;re receiving this because you created an account at
              nisd2.eu.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Default export required by React Email dev server
export default WelcomeEmail;

WelcomeEmail.PreviewProps = {
  name: "Anna Müller",
  dashboardUrl: "https://www.nisd2.eu/dashboard",
} satisfies WelcomeEmailProps;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const body: React.CSSProperties = {
  backgroundColor: "#fafafa",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  maxWidth: "520px",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const header: React.CSSProperties = {
  backgroundColor: "#284b63",
  padding: "20px 32px",
};

const logoCell: React.CSSProperties = {
  width: "52px",
  verticalAlign: "middle",
};

const logoImage: React.CSSProperties = {
  display: "block",
  borderRadius: "8px",
};

const brandCell: React.CSSProperties = {
  verticalAlign: "middle",
};

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  letterSpacing: "0.05em",
  lineHeight: "1.2",
  margin: 0,
};

const tagline: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "2px 0 0",
};

const content: React.CSSProperties = {
  padding: "32px 40px 24px",
};

const greeting: React.CSSProperties = {
  color: "#353535",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#353535",
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "0 0 16px",
};

const link: React.CSSProperties = {
  color: "#284b63",
  textDecoration: "underline",
};

const signature: React.CSSProperties = {
  color: "#353535",
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "24px 0 0",
};

const signatureLink: React.CSSProperties = {
  color: "#6b6b6b",
  textDecoration: "none",
};

const divider: React.CSSProperties = {
  borderColor: "#d9d9d9",
  margin: "0 40px",
};

const footer: React.CSSProperties = {
  color: "#6b6b6b",
  fontSize: "12px",
  lineHeight: "1.5",
  padding: "16px 40px 24px",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: "#6b6b6b",
  textDecoration: "underline",
};
