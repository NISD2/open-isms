import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { CtaButton, Para, Title } from "../components/parts";
import { type DigestNextStep, withUtm } from "../digest";
import { BRAND, type PreferenceFooter, SEVERITY } from "../layout";

export interface WeeklyDigestProps {
  readonly recipientName: string;
  readonly companyName: string;
  readonly compliancePercentage: string;
  readonly overdueCount: number;
  readonly urgentCount: number;
  readonly escalationCount: number;
  readonly totalRequirements: number;
  readonly completedRequirements: number;
  readonly nextStep: DigestNextStep | null;
  readonly dashboardUrl: string;
  readonly footer: PreferenceFooter;
}

const label = {
  padding: "10px 12px",
  borderBottom: `1px solid ${BRAND.border}`,
  color: BRAND.foreground,
} as const;
const count = (color: string) =>
  ({
    padding: "10px 12px",
    borderBottom: `1px solid ${BRAND.border}`,
    fontWeight: 600,
    textAlign: "right",
    color,
  }) as const;

/** Optional: the week's compliance score and open items, as evidence of informing management. */
export default function WeeklyDigestEmail(props: WeeklyDigestProps) {
  const { nextStep, overdueCount, urgentCount, escalationCount } = props;
  const pct = Math.min(
    100,
    Math.max(0, Number.parseFloat(props.compliancePercentage) || 0),
  );
  return (
    <EmailFrame chrome={props.footer}>
      <Title style={{ margin: "0 0 8px" }}>Weekly Management Report</Title>
      <Para style={{ margin: "0 0 24px" }}>
        Hi {props.recipientName}, here is the weekly compliance summary for{" "}
        <strong>{props.companyName}</strong>.
      </Para>
      <div style={{ textAlign: "center", margin: "0 0 24px" }}>
        <span style={{ fontSize: "36px", fontWeight: 700, color: BRAND.primary }}>
          {props.compliancePercentage}%
        </span>
        <div style={{ color: BRAND.foreground, fontSize: "14px", marginTop: "4px" }}>
          Compliance Score
        </div>
        <div
          style={{
            background: BRAND.border,
            borderRadius: "4px",
            height: "8px",
            margin: "12px 0 0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: BRAND.primary,
              height: "100%",
              width: `${pct}%`,
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ color: BRAND.foreground, fontSize: "13px", marginTop: "4px" }}>
          {props.completedRequirements} of {props.totalRequirements} requirements
          completed
        </div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
          margin: "0 0 24px",
        }}
      >
        <tbody>
          <tr>
            <td style={label}>Overdue Items</td>
            <td style={count(overdueCount > 0 ? SEVERITY.destructive : SEVERITY.success)}>
              {overdueCount}
            </td>
          </tr>
          <tr>
            <td style={label}>Urgent Items</td>
            <td style={count(urgentCount > 0 ? SEVERITY.warning : SEVERITY.success)}>
              {urgentCount}
            </td>
          </tr>
          <tr>
            <td style={label}>Escalations</td>
            <td
              style={count(escalationCount > 0 ? SEVERITY.destructive : SEVERITY.success)}
            >
              {escalationCount}
            </td>
          </tr>
        </tbody>
      </table>
      {
        // Gate on nextStep, not the persisted assessment counters: nextStep is derived from the
        // live status rows, so "there are open items" and "here is the next one" cannot
        // contradict each other when the counters are stale.
        nextStep ? (
          <>
            <Para>
              Next up:{" "}
              <Link
                href={withUtm(nextStep.url, "weekly_management_digest")}
                style={{ color: BRAND.primary, fontWeight: 600, textDecoration: "none" }}
              >
                {nextStep.requirementCode} {nextStep.requirementTitle}
              </Link>{" "}
              ({nextStep.categoryName}),{" "}
              {nextStep.assigneeName
                ? `assigned to ${nextStep.assigneeName}`
                : "not yet assigned"}
              .
            </Para>
            <p
              style={{
                color: BRAND.mutedForeground,
                fontSize: "13px",
                lineHeight: 1.6,
                margin: "0 0 16px",
              }}
            >
              Open items return in every weekly report until they are done. Completed
              items land in the audit trail as evidence.
            </p>
          </>
        ) : null
      }
      <CtaButton href={withUtm(props.dashboardUrl, "weekly_management_digest")}>
        {nextStep ? "Review the open items" : "View Dashboard"}
      </CtaButton>
      <div
        style={{
          margin: "24px 0 0",
          padding: "16px",
          background: BRAND.muted,
          border: `1px solid ${BRAND.border}`,
          borderRadius: "6px",
          fontSize: "12px",
          color: BRAND.mutedForeground,
          lineHeight: 1.5,
        }}
      >
        This email serves as documentation of management notification per Art. 20 NIS 2 /
        §38 BSIG.
        <br />
        Diese E-Mail dient als Nachweis der Leitungsunterrichtung gemäß Art. 20 NIS 2 /
        §38 BSIG.
      </div>
    </EmailFrame>
  );
}

WeeklyDigestEmail.PreviewProps = {
  recipientName: "Jan",
  companyName: "Stadtwerke Musterstadt",
  compliancePercentage: "42.0",
  overdueCount: 1,
  urgentCount: 2,
  escalationCount: 0,
  totalRequirements: 49,
  completedRequirements: 20,
  nextStep: null,
  dashboardUrl: "https://nisd2.eu/dashboard",
  footer: {
    unsubscribeUrl: "https://nisd2.eu/api/email/unsubscribe?u=preview",
    preferencesUrl: "https://nisd2.eu/email/preferences?u=preview&lang=en",
    locale: "en",
  },
} satisfies WeeklyDigestProps;
