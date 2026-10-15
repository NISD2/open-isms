import { EmailFrame } from "../components/frame";
import { Para, Title } from "../components/parts";
import { BRAND, type PreferenceFooter, SEVERITY } from "../layout";
import { type WorkflowMailLocale, workflowMailLocaleOf } from "../locale";

export interface ReviewDecisionProps {
  readonly submitterName: string;
  readonly requirementCode: string;
  readonly requirementTitle: string;
  readonly decision: "approved" | "rejected";
  readonly feedback?: string | null;
  readonly footer: PreferenceFooter;
}

type Decision = ReviewDecisionProps["decision"];

export const REVIEW_DECISION_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: Record<Decision, (requirementCode: string) => string>;
    readonly heading: Record<Decision, string>;
    /** Before the requirement code, which is set in bold. */
    readonly lead: (submitterName: string) => string;
    /** Between the code and the decision, which is set in colour. */
    readonly middle: (requirementTitle: string) => string;
    readonly decision: Record<Decision, string>;
    readonly feedback: string;
  }
> = {
  en: {
    subject: {
      approved: (code) => `${code} was approved`,
      rejected: (code) => `${code} needs another look`,
    },
    heading: { approved: "Submission Approved", rejected: "Submission Rejected" },
    lead: (submitterName) => `Hi ${submitterName}, your submission for `,
    middle: (requirementTitle) => ` (${requirementTitle}) has been `,
    decision: { approved: "approved", rejected: "rejected" },
    feedback: "Feedback",
  },
  cs: {
    subject: {
      approved: (code) => `Požadavek ${code} byl schválen`,
      rejected: (code) => `Požadavek ${code} je potřeba přepracovat`,
    },
    heading: { approved: "Podání schváleno", rejected: "Podání vráceno" },
    lead: () => "Dobrý den, vaše podání k požadavku ",
    middle: (requirementTitle) => ` (${requirementTitle}) bylo `,
    decision: { approved: "schváleno", rejected: "vráceno k přepracování" },
    feedback: "Zpětná vazba",
  },
};

/** Optional: a reviewer approved or returned the reader's submission. */
export default function ReviewDecisionEmail(props: ReviewDecisionProps) {
  const { submitterName, requirementCode, requirementTitle, decision, feedback } = props;
  const copy = REVIEW_DECISION_COPY[workflowMailLocaleOf(props.footer.locale)];
  const color = decision === "approved" ? SEVERITY.success : SEVERITY.destructive;
  return (
    <EmailFrame chrome={props.footer}>
      <Title>{copy.heading[decision]}</Title>
      <Para>
        {copy.lead(submitterName)}
        <strong>{requirementCode}</strong>
        {copy.middle(requirementTitle)}
        <span style={{ color, fontWeight: 600 }}>{copy.decision[decision]}</span>.
      </Para>
      {feedback ? (
        <Para
          style={{
            margin: "16px 0 0",
            padding: "12px",
            background: BRAND.muted,
            borderRadius: "6px",
          }}
        >
          <strong>{copy.feedback}:</strong> {feedback}
        </Para>
      ) : null}
    </EmailFrame>
  );
}

ReviewDecisionEmail.PreviewProps = {
  submitterName: "Jan",
  requirementCode: "GOV-1",
  requirementTitle: "Assign responsibility for the ISMS",
  decision: "rejected",
  feedback: "Please attach the signed appointment letter.",
  footer: {
    unsubscribeUrl: "https://nisd2.eu/api/email/unsubscribe?u=preview",
    preferencesUrl: "https://nisd2.eu/email/preferences?u=preview&lang=en",
    locale: "en",
  },
} satisfies ReviewDecisionProps;
