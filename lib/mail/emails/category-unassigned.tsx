import { EmailFrame } from "../components/frame";
import { Para, Title } from "../components/parts";
import type { PreferenceFooter } from "../layout";
import { type WorkflowMailLocale, workflowMailLocaleOf } from "../locale";

export interface CategoryUnassignedProps {
  readonly assigneeName: string;
  readonly categoryName: string;
  readonly categoryCode: string;
  readonly companyName: string;
  readonly footer: PreferenceFooter;
}

type Parts = Omit<CategoryUnassignedProps, "footer">;

export const CATEGORY_UNASSIGNED_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: (categoryName: string) => string;
    readonly heading: string;
    /** The text before and after the category name, which is set in bold. */
    readonly unassigned: (p: Parts) => { readonly lead: string; readonly end: string };
    readonly mistake: string;
  }
> = {
  en: {
    subject: (categoryName) => `You are no longer assigned to ${categoryName}`,
    heading: "Assignment Removed",
    unassigned: ({ assigneeName, categoryCode, companyName }) => ({
      lead: `Hi ${assigneeName}, you have been unassigned from `,
      end: ` (${categoryCode}) in ${companyName}.`,
    }),
    mistake: "If you believe this was a mistake, please contact your team administrator.",
  },
  cs: {
    subject: (categoryName) => `Oblast ${categoryName} vám už není přiřazena`,
    heading: "Přiřazení zrušeno",
    unassigned: ({ categoryCode, companyName }) => ({
      lead: `Dobrý den, v organizaci ${companyName} vám bylo zrušeno přiřazení oblasti `,
      end: ` (${categoryCode}).`,
    }),
    mistake: "Pokud jde podle vás o omyl, obraťte se na administrátora svého týmu.",
  },
};

/** Optional: the reader is no longer responsible for an area. */
export default function CategoryUnassignedEmail(props: CategoryUnassignedProps) {
  const copy = CATEGORY_UNASSIGNED_COPY[workflowMailLocaleOf(props.footer.locale)];
  const { lead, end } = copy.unassigned(props);
  return (
    <EmailFrame chrome={props.footer}>
      <Title>{copy.heading}</Title>
      <Para>
        {lead}
        <strong>{props.categoryName}</strong>
        {end}
      </Para>
      <Para style={{ margin: 0 }}>{copy.mistake}</Para>
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
