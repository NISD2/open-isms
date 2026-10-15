import { Link } from "@react-email/components";
import { Fragment } from "react";
import { EmailFrame } from "../components/frame";
import { CtaButton, Para, Title } from "../components/parts";
import { type DigestNextStep, formatPercent, withUtm } from "../digest";
import { BRAND, type PreferenceFooter, SEVERITY } from "../layout";
import { type WorkflowMailLocale, workflowMailLocaleOf } from "../locale";

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

export const WEEKLY_DIGEST_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (companyName: string, percent: string) => string;
    readonly heading: string;
    /** The text before and after the company name, which is set in bold. */
    readonly intro: (recipientName: string) => {
      readonly lead: string;
      readonly end: string;
    };
    readonly score: string;
    readonly completed: (done: number, total: number) => string;
    readonly overdue: string;
    readonly urgent: string;
    readonly escalations: string;
    readonly nextUp: string;
    readonly owner: (assigneeName: string | null) => string;
    readonly recurring: string;
    readonly review: string;
    readonly viewDashboard: string;
    readonly viewDashboardText: string;
    /**
     * What the mail documents for management, in the reader's own law. A Czech company is
     * regulated by the Czech Act and its decrees, never by the BSIG.
     */
    readonly record: readonly string[];
  }
> = {
  en: {
    subject: (companyName, percent) =>
      `${companyName} is at ${percent} on NIS 2 this week`,
    heading: "Weekly Management Report",
    intro: (recipientName) => ({
      lead: `Hi ${recipientName}, here is the weekly compliance summary for `,
      end: ".",
    }),
    score: "Compliance Score",
    completed: (done, total) => `${done} of ${total} requirements completed`,
    overdue: "Overdue Items",
    urgent: "Urgent Items",
    escalations: "Escalations",
    nextUp: "Next up",
    owner: (assigneeName) =>
      assigneeName ? `assigned to ${assigneeName}` : "not yet assigned",
    recurring:
      "Open items return in every weekly report until they are done. Completed items land in the audit trail as evidence.",
    review: "Review the open items",
    viewDashboard: "View Dashboard",
    viewDashboardText: "View dashboard",
    record: [
      "This email serves as documentation of management notification per Art. 20 NIS 2 / §38 BSIG.",
      "Diese E-Mail dient als Nachweis der Leitungsunterrichtung gemäß Art. 20 NIS 2 / §38 BSIG.",
    ],
  },
  cs: {
    subject: (companyName, percent) =>
      `Plnění NIS 2 v organizaci ${companyName} tento týden: ${percent}`,
    heading: "Týdenní zpráva pro vedení",
    intro: () => ({
      // Czech company names end in "s.r.o." or "a.s.", so no sentence ends on one.
      lead: "Dobrý den, toto je přehled plnění NIS 2 organizace ",
      end: " za tento týden.",
    }),
    score: "Míra plnění",
    completed: (done, total) => `Splněno ${done} z celkem ${total} požadavků`,
    overdue: "Po termínu",
    urgent: "Naléhavé",
    escalations: "Eskalace",
    nextUp: "Na řadě",
    owner: (assigneeName) =>
      assigneeName ? `přiřazeno: ${assigneeName}` : "zatím nepřiřazeno",
    recurring:
      "Otevřené body se v každé týdenní zprávě objeví znovu, dokud nebudou hotové. Dokončené body se jako doklad ukládají do auditní stopy.",
    review: "Zkontrolovat otevřené body",
    viewDashboard: "Otevřít dashboard",
    viewDashboardText: "Otevřít dashboard",
    record: [
      "Tento e-mail slouží jako záznam o seznámení vedení se stavem plnění bezpečnostních opatření (čl. 20 směrnice NIS 2; v režimu nižších povinností vyhláška č. 410/2025 Sb., § 4 písm. d)).",
      "V režimu vyšších povinností se vedení prokazatelně seznamuje s konkrétními zprávami (vyhláška č. 409/2025 Sb., § 4 odst. 2), které tento e-mail nenahrazuje.",
    ],
  },
};

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
  const locale = workflowMailLocaleOf(props.footer.locale);
  const copy = WEEKLY_DIGEST_COPY[locale];
  const intro = copy.intro(props.recipientName);
  const pct = Math.min(
    100,
    Math.max(0, Number.parseFloat(props.compliancePercentage) || 0),
  );
  return (
    <EmailFrame chrome={props.footer}>
      <Title style={{ margin: "0 0 8px" }}>{copy.heading}</Title>
      <Para style={{ margin: "0 0 24px" }}>
        {intro.lead}
        <strong>{props.companyName}</strong>
        {intro.end}
      </Para>
      <div style={{ textAlign: "center", margin: "0 0 24px" }}>
        <span style={{ fontSize: "36px", fontWeight: 700, color: BRAND.primary }}>
          {formatPercent(props.compliancePercentage, locale)}
        </span>
        <div style={{ color: BRAND.foreground, fontSize: "14px", marginTop: "4px" }}>
          {copy.score}
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
          {copy.completed(props.completedRequirements, props.totalRequirements)}
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
            <td style={label}>{copy.overdue}</td>
            <td style={count(overdueCount > 0 ? SEVERITY.destructive : SEVERITY.success)}>
              {overdueCount}
            </td>
          </tr>
          <tr>
            <td style={label}>{copy.urgent}</td>
            <td style={count(urgentCount > 0 ? SEVERITY.warning : SEVERITY.success)}>
              {urgentCount}
            </td>
          </tr>
          <tr>
            <td style={label}>{copy.escalations}</td>
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
              {copy.nextUp}:{" "}
              <Link
                href={withUtm(nextStep.url, "weekly_management_digest")}
                style={{ color: BRAND.primary, fontWeight: 600, textDecoration: "none" }}
              >
                {nextStep.requirementCode} {nextStep.requirementTitle}
              </Link>{" "}
              ({nextStep.categoryName}), {copy.owner(nextStep.assigneeName)}.
            </Para>
            <p
              style={{
                color: BRAND.mutedForeground,
                fontSize: "13px",
                lineHeight: 1.6,
                margin: "0 0 16px",
              }}
            >
              {copy.recurring}
            </p>
          </>
        ) : null
      }
      <CtaButton href={withUtm(props.dashboardUrl, "weekly_management_digest")}>
        {nextStep ? copy.review : copy.viewDashboard}
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
        {copy.record.map((line, i) => (
          <Fragment key={line}>
            {i > 0 ? <br /> : null}
            {line}
          </Fragment>
        ))}
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
