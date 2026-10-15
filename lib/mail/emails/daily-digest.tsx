import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { CtaButton, Para, Title } from "../components/parts";
import {
  type DigestItem,
  type DigestNextStep,
  formatPercent,
  payoffLine,
  withUtm,
} from "../digest";
import { BRAND, type PreferenceFooter, SEVERITY } from "../layout";
import { type WorkflowMailLocale, workflowMailLocaleOf } from "../locale";

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

export const DAILY_DIGEST_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: {
      readonly overdue: (count: number, companyName: string) => string;
      readonly urgent: (count: number, companyName: string) => string;
      readonly upcoming: (count: number, companyName: string) => string;
    };
    readonly heading: string;
    /** The text before and after the company name, which is set in bold. */
    readonly intro: (recipientName: string) => {
      readonly lead: string;
      readonly end: string;
    };
    readonly overall: string;
    readonly overallText: string;
    readonly overdue: string;
    readonly urgent: string;
    readonly upcoming: string;
    readonly columns: {
      readonly code: string;
      readonly title: string;
      readonly deadline: string;
      readonly days: string;
    };
    readonly days: (days: number) => string;
    /** One open item in the plain-text twin. */
    readonly itemText: (item: DigestItem) => string;
    readonly continue: string;
    readonly orDashboard: string;
    readonly viewDashboard: string;
    readonly viewDashboardText: string;
    readonly reason: (companyName: string) => string;
  }
> = {
  en: {
    subject: {
      overdue: (count, companyName) => `${count} overdue at ${companyName}`,
      urgent: (count, companyName) => `${count} due this week at ${companyName}`,
      upcoming: (count, companyName) => `${count} deadlines coming up at ${companyName}`,
    },
    heading: "Daily Compliance Digest",
    intro: (recipientName) => ({
      lead: `Hi ${recipientName}, here is your daily summary for `,
      end: ".",
    }),
    overall: "overall compliance",
    overallText: "Overall compliance",
    overdue: "Overdue",
    urgent: "Due This Week",
    upcoming: "Upcoming",
    columns: { code: "Code", title: "Title", deadline: "Deadline", days: "Days" },
    days: (days) => `${days}d`,
    itemText: (item) =>
      `  - ${item.requirementCode}: ${item.requirementTitle} (due ${item.deadline}, ${item.daysRemaining}d remaining)`,
    continue: "Continue",
    orDashboard: "or open the dashboard",
    viewDashboard: "View Dashboard",
    viewDashboardText: "View dashboard",
    reason: (companyName) =>
      `You are receiving this digest because you are a member of ${companyName}.`,
  },
  cs: {
    subject: {
      overdue: (count, companyName) => `${count} po termínu v organizaci ${companyName}`,
      urgent: (count, companyName) =>
        `${count} s termínem tento týden v organizaci ${companyName}`,
      upcoming: (count, companyName) =>
        `Blížící se termíny v organizaci ${companyName}: ${count}`,
    },
    heading: "Denní přehled NIS 2",
    // Czech company names end in "s.r.o." or "a.s.", so no sentence ends on one.
    intro: () => ({
      lead: "Dobrý den, toto je denní přehled organizace ",
      end: " k dnešnímu dni.",
    }),
    overall: "celkové plnění",
    overallText: "Celkové plnění",
    overdue: "Po termínu",
    urgent: "Termín tento týden",
    upcoming: "Nadcházející",
    columns: { code: "Kód", title: "Název", deadline: "Termín", days: "Dny" },
    days: (days) => `${days} d`,
    itemText: (item) =>
      `  - ${item.requirementCode}: ${item.requirementTitle} (termín ${item.deadline}, zbývá ${item.daysRemaining} d)`,
    continue: "Pokračovat",
    orDashboard: "nebo otevřít dashboard",
    viewDashboard: "Otevřít dashboard",
    viewDashboardText: "Otevřít dashboard",
    reason: (companyName) =>
      `Jako člen organizace ${companyName} dostáváte tento přehled.`,
  },
};

const cell = { padding: "8px 12px", borderBottom: `1px solid ${BRAND.border}` } as const;
const head = {
  padding: "8px 12px",
  textAlign: "left",
  borderBottom: `2px solid ${BRAND.border}`,
  fontWeight: 600,
  color: BRAND.foreground,
} as const;

function DigestSection({
  locale,
  title,
  accent,
  items,
}: {
  readonly locale: WorkflowMailLocale;
  readonly title: string;
  readonly accent: string;
  readonly items: readonly DigestItem[];
}) {
  if (items.length === 0) return null;
  const copy = DAILY_DIGEST_COPY[locale];
  return (
    <div style={{ margin: "0 0 24px" }}>
      <h3 style={{ margin: "0 0 12px", color: accent, fontSize: "15px" }}>
        {title} ({items.length})
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: BRAND.muted }}>
            <th style={head}>{copy.columns.code}</th>
            <th style={head}>{copy.columns.title}</th>
            <th style={head}>{copy.columns.deadline}</th>
            <th style={{ ...head, textAlign: "right" }}>{copy.columns.days}</th>
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
                {copy.days(item.daysRemaining)}
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
  const locale = workflowMailLocaleOf(props.footer.locale);
  const copy = DAILY_DIGEST_COPY[locale];
  const intro = copy.intro(props.recipientName);
  return (
    <EmailFrame chrome={props.footer}>
      <Title style={{ margin: "0 0 8px" }}>{copy.heading}</Title>
      <Para style={{ margin: "0 0 4px" }}>
        {intro.lead}
        <strong>{props.companyName}</strong>
        {intro.end}
      </Para>
      <p style={{ margin: "0 0 24px" }}>
        <span style={{ fontSize: "28px", fontWeight: 700, color: BRAND.primary }}>
          {formatPercent(props.compliancePercentage, locale)}
        </span>
        <span style={{ color: BRAND.foreground, fontSize: "14px", marginLeft: "8px" }}>
          {copy.overall}
        </span>
      </p>
      <DigestSection
        locale={locale}
        title={copy.overdue}
        accent={SEVERITY.destructive}
        items={props.overdueItems}
      />
      <DigestSection
        locale={locale}
        title={copy.urgent}
        accent={SEVERITY.warning}
        items={props.urgentItems}
      />
      <DigestSection
        locale={locale}
        title={copy.upcoming}
        accent={BRAND.mutedForeground}
        items={props.upcomingItems}
      />
      {nextStep ? (
        <>
          <Para style={{ margin: "0 0 16px" }}>{payoffLine(nextStep, locale)}</Para>
          <CtaButton href={withUtm(nextStep.url, "daily_digest")}>
            {copy.continue}: {nextStep.requirementCode} {nextStep.requirementTitle}
          </CtaButton>
          <p style={{ fontSize: "13px", margin: "12px 0 0" }}>
            <Link
              href={withUtm(dashboardUrl, "daily_digest")}
              style={{ color: BRAND.mutedForeground, textDecoration: "underline" }}
            >
              {copy.orDashboard}
            </Link>
          </p>
        </>
      ) : (
        <CtaButton href={withUtm(dashboardUrl, "daily_digest")}>
          {copy.viewDashboard}
        </CtaButton>
      )}
      <p
        style={{
          color: BRAND.mutedForeground,
          fontSize: "13px",
          margin: "24px 0 0",
          lineHeight: 1.5,
        }}
      >
        {copy.reason(props.companyName)}
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
