import { EmailFrame } from "../components/frame";
import { CtaButton, Para, Title } from "../components/parts";
import type { PreferenceFooter } from "../layout";

export interface CategoryAssignedProps {
  readonly assigneeName: string;
  readonly categoryName: string;
  readonly categoryCode: string;
  readonly companyName: string;
  readonly assignerName: string;
  readonly categoryUrl: string;
  readonly footer: PreferenceFooter;
}

/** Optional: someone assigned the reader an area of the journey. */
export default function CategoryAssignedEmail(props: CategoryAssignedProps) {
  const { assigneeName, categoryName, categoryCode, companyName, assignerName } = props;
  return (
    <EmailFrame chrome={props.footer}>
      <Title>New Assignment</Title>
      <Para>
        Hi {assigneeName}, {assignerName} has assigned you to{" "}
        <strong>{categoryName}</strong> ({categoryCode}) in {companyName}.
      </Para>
      <Para style={{ margin: "0 0 24px" }}>
        You can now fill out the compliance requirements for this category.
      </Para>
      <CtaButton href={props.categoryUrl}>Go to {categoryCode}</CtaButton>
    </EmailFrame>
  );
}

CategoryAssignedEmail.PreviewProps = {
  assigneeName: "Jan",
  categoryName: "Governance",
  categoryCode: "GOV",
  companyName: "Stadtwerke Musterstadt",
  assignerName: "Anna Schmidt",
  categoryUrl: "https://nisd2.eu/journey",
  footer: {
    unsubscribeUrl: "https://nisd2.eu/api/email/unsubscribe?u=preview",
    preferencesUrl: "https://nisd2.eu/email/preferences?u=preview&lang=de",
    locale: "de",
  },
} satisfies CategoryAssignedProps;
