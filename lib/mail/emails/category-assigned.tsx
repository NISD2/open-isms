import { EmailFrame } from "../components/frame";
import { CtaButton, Para, Title } from "../components/parts";
import type { PreferenceFooter } from "../layout";
import { type WorkflowMailLocale, workflowMailLocaleOf } from "../locale";

export interface CategoryAssignedProps {
  readonly assigneeName: string;
  readonly categoryName: string;
  readonly categoryCode: string;
  readonly companyName: string;
  readonly assignerName: string;
  readonly categoryUrl: string;
  readonly footer: PreferenceFooter;
}

type Parts = Omit<CategoryAssignedProps, "categoryUrl" | "footer">;

export const CATEGORY_ASSIGNED_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (p: Parts) => string;
    readonly heading: string;
    /** The text before and after the category name, which is set in bold. */
    readonly assigned: (p: Parts) => { readonly lead: string; readonly end: string };
    readonly fill: string;
    readonly button: (categoryCode: string) => string;
    readonly goTo: string;
  }
> = {
  en: {
    subject: ({ assignerName, categoryName }) =>
      `${assignerName} assigned you ${categoryName}`,
    heading: "New Assignment",
    assigned: ({ assigneeName, assignerName, categoryCode, companyName }) => ({
      lead: `Hi ${assigneeName}, ${assignerName} has assigned you to `,
      end: ` (${categoryCode}) in ${companyName}.`,
    }),
    fill: "You can now fill out the compliance requirements for this category.",
    button: (categoryCode) => `Go to ${categoryCode}`,
    goTo: "Go to category",
  },
  cs: {
    subject: ({ categoryName }) => `Byla vám přiřazena oblast ${categoryName}`,
    heading: "Nové přiřazení",
    assigned: ({ assignerName, categoryCode, companyName }) => ({
      lead: `Dobrý den, v organizaci ${companyName} vám byla přiřazena oblast `,
      end: ` (${categoryCode}). Přiřadil(a) vám ji ${assignerName}.`,
    }),
    fill: "Nyní můžete vyplnit požadavky této oblasti.",
    button: (categoryCode) => `Přejít na ${categoryCode}`,
    goTo: "Přejít na oblast",
  },
};

/** Optional: someone assigned the reader an area of the journey. */
export default function CategoryAssignedEmail(props: CategoryAssignedProps) {
  const copy = CATEGORY_ASSIGNED_COPY[workflowMailLocaleOf(props.footer.locale)];
  const { lead, end } = copy.assigned(props);
  return (
    <EmailFrame chrome={props.footer}>
      <Title>{copy.heading}</Title>
      <Para>
        {lead}
        <strong>{props.categoryName}</strong>
        {end}
      </Para>
      <Para style={{ margin: "0 0 24px" }}>{copy.fill}</Para>
      <CtaButton href={props.categoryUrl}>{copy.button(props.categoryCode)}</CtaButton>
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
