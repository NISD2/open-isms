import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { CtaButton, Para, Title } from "../components/parts";
import { type DigestItem, type DigestNextStep, payoffLine, withUtm } from "../digest";
import { BRAND, type PreferenceFooter, SEVERITY } from "../layout";

export interface DailyDigestProps {
  readonly recipientName: string;
  readonly companyName: string;
  readonly overdueItems: readonly DigestItem[];
  readonly urgentItems: readonly DigestItem[];
  readonly upcomingItems: readonly DigestItem[];
  readonly nextStep: DigestNextStep | null;
  readonly compliancePercentage: string;
  readonly dashboardUrl: string;
  readonly footer: PreferenceFooter;
}

const cell = { padding: "8px 12px", borderBottom: `1px solid ${BRAND.border}` } as const;
const head = {
  padding: "8px 12px",
  textAlign: "left",
  borderBottom: `2px solid ${BRAND.border}`,
  fontWeight: 600,
  color: BRAND.foreground,
} as const;

function DigestSection({
  title,
  accent,
  items,
}: {
  readonly title: string;
  readonly accent: string;
  readonly items: readonly DigestItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div style={{ margin: "0 0 24px" }}>
      <h3 style={{ margin: "0 0 12px", color: accent, fontSize: "15px" }}>
        {title} ({items.length})
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: BRAND.muted }}>
            <th style={head}>Code</th>
            <th style={head}>Title</th>
            <th style={head}>Deadline</th>
            <th style={{ ...head, textAlign: "right" }}>Days</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.requirementCode}-${item.deadline}`}>
              <td style={cell}>
                <Link
                  href={withUtm(item.categoryUrl, "daily_digest")}
                  style={{
                    color: BRAND.primary,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  {item.requirementCode}
                </Link>
              </td>
              <td style={{ ...cell, color: BRAND.foreground }}>
                {item.requirementTitle}
              </td>
              <td style={{ ...cell, color: BRAND.foreground, whiteSpace: "nowrap" }}>
                {item.deadline}
              </td>
              <td style={{ ...cell, color: BRAND.foreground, textAlign: "right" }}>
                {item.daysRemaining}d
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Optional: what is overdue, due this week and coming up, and the one next step. */
export default function DailyDigestEmail(props: DailyDigestProps) {
  const { nextStep, dashboardUrl } = props;
  return (
    <EmailFrame chrome={props.footer}>
      <Title style={{ margin: "0 0 8px" }}>Daily Compliance Digest</Title>
      <Para style={{ margin: "0 0 4px" }}>
        Hi {props.recipientName}, here is your daily summary for{" "}
        <strong>{props.companyName}</strong>.
      </Para>
      <p style={{ margin: "0 0 24px" }}>
        <span style={{ fontSize: "28px", fontWeight: 700, color: BRAND.primary }}>
          {props.compliancePercentage}%
        </span>
        <span style={{ color: BRAND.foreground, fontSize: "14px", marginLeft: "8px" }}>
          overall compliance
        </span>
      </p>
      <DigestSection
        title="Overdue"
        accent={SEVERITY.destructive}
        items={props.overdueItems}
      />
      <DigestSection
        title="Due This Week"
        accent={SEVERITY.warning}
        items={props.urgentItems}
      />
      <DigestSection
        title="Upcoming"
        accent={BRAND.mutedForeground}
        items={props.upcomingItems}
      />
      {nextStep ? (
        <>
          <Para style={{ margin: "0 0 16px" }}>{payoffLine(nextStep)}</Para>
          <CtaButton href={withUtm(nextStep.url, "daily_digest")}>
            Continue: {nextStep.requirementCode} {nextStep.requirementTitle}
          </CtaButton>
          <p style={{ fontSize: "13px", margin: "12px 0 0" }}>
            <Link
              href={withUtm(dashboardUrl, "daily_digest")}
              style={{ color: BRAND.mutedForeground, textDecoration: "underline" }}
            >
              or open the dashboard
            </Link>
          </p>
        </>
      ) : (
        <CtaButton href={withUtm(dashboardUrl, "daily_digest")}>View Dashboard</CtaButton>
      )}
      <p
        style={{
          color: BRAND.mutedForeground,
          fontSize: "13px",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        You are receiving this digest because you are a member of {props.companyName}.
      </p>
    </EmailFrame>
  );
}

const item = {
  requirementCode: "GOV-1",
  requirementTitle: "Assign responsibility for the ISMS",
  deadline: "2026-10-01",
  daysRemaining: 3,
  urgency: "urgent",
  categoryUrl: "https://nisd2.eu/compliance/governance",
} as const;

DailyDigestEmail.PreviewProps = {
  recipientName: "Jan",
  companyName: "Stadtwerke Musterstadt",
  overdueItems: [item],
  urgentItems: [item],
  upcomingItems: [item],
  nextStep: null,
  compliancePercentage: "42.0",
  dashboardUrl: "https://nisd2.eu/dashboard",
  footer: {
    unsubscribeUrl: "https://nisd2.eu/api/email/unsubscribe?u=preview",
    preferencesUrl: "https://nisd2.eu/email/preferences?u=preview&lang=en",
    locale: "en",
  },
} satisfies DailyDigestProps;
