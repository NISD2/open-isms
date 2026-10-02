import { EmailFrame } from "../components/frame";
import { Para, Title } from "../components/parts";
import { BRAND, type PreferenceFooter, SEVERITY } from "../layout";

export interface ReviewDecisionProps {
  readonly submitterName: string;
  readonly requirementCode: string;
  readonly requirementTitle: string;
  readonly decision: "approved" | "rejected";
  readonly feedback?: string | null;
  readonly footer: PreferenceFooter;
}

/** Optional: a reviewer approved or returned the reader's submission. */
export default function ReviewDecisionEmail(props: ReviewDecisionProps) {
  const { submitterName, requirementCode, requirementTitle, decision, feedback } = props;
  const label = decision === "approved" ? "Approved" : "Rejected";
  const color = decision === "approved" ? SEVERITY.success : SEVERITY.destructive;
  return (
    <EmailFrame chrome={props.footer}>
      <Title>Submission {label}</Title>
      <Para>
        Hi {submitterName}, your submission for <strong>{requirementCode}</strong> (
        {requirementTitle}) has been{" "}
        <span style={{ color, fontWeight: 600 }}>{decision}</span>.
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
          <strong>Feedback:</strong> {feedback}
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
