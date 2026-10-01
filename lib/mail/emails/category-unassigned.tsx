import { EmailFrame } from "../components/frame";
import { Para, Title } from "../components/parts";
import type { PreferenceFooter } from "../layout";

export interface CategoryUnassignedProps {
  readonly assigneeName: string;
  readonly categoryName: string;
  readonly categoryCode: string;
  readonly companyName: string;
  readonly footer: PreferenceFooter;
}

/** Optional: the reader is no longer responsible for an area. */
export default function CategoryUnassignedEmail(props: CategoryUnassignedProps) {
  const { assigneeName, categoryName, categoryCode, companyName } = props;
  return (
    <EmailFrame chrome={props.footer}>
      <Title>Assignment Removed</Title>
      <Para>
        Hi {assigneeName}, you have been unassigned from <strong>{categoryName}</strong> (
        {categoryCode}) in {companyName}.
      </Para>
      <Para style={{ margin: 0 }}>
        If you believe this was a mistake, please contact your team administrator.
      </Para>
    </EmailFrame>
  );
}

CategoryUnassignedEmail.PreviewProps = {
  assigneeName: "Jan",
  categoryName: "Governance",
  categoryCode: "GOV",
  companyName: "Stadtwerke Musterstadt",
  footer: {
    unsubscribeUrl: "https://nisd2.eu/api/email/unsubscribe?u=preview",
    preferencesUrl: "https://nisd2.eu/email/preferences?u=preview&lang=de",
    locale: "de",
  },
} satisfies CategoryUnassignedProps;
