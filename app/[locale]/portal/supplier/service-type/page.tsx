import { isVisible } from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { QuestionnairePage } from "@/components/supplier-portal/questionnaire/QuestionnairePage";
import { Link } from "@/i18n/navigation";
import { SERVICE_TYPE_PAGE_FIELDS } from "@/lib/forms/supplier-portal-sections";
import { questionOf } from "@/lib/supplier-portal/completeness";
import { answersOf } from "@/lib/supplier-portal/questionnaire-view";
import { api } from "@/lib/trpc/server";

/**
 * Service details: the questions for the types of service ticked on the profile (SaaS, software on
 * the customer's premises, professional services, managed services). None ticked yet: a pointer back
 * to the profile instead of an empty form.
 */
export default async function SupplierServiceTypePage() {
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);
  const profile = await api.supplierPortal.profile.get();
  if (!profile) redirect("/portal/supplier-onboarding");

  const answers = answersOf(profile);
  const anyApplies = SERVICE_TYPE_PAGE_FIELDS.some((field) =>
    isVisible(questionOf(field), answers),
  );

  return (
    <QuestionnairePage
      page="serviceType"
      title={nav("serviceType")}
      intro={pages("serviceTypeIntro")}
      row={profile}
      lastSavedAt={profile.practicesLastSavedAt ?? null}
      empty={
        anyApplies ? undefined : (
          <div className="max-w-2xl rounded-xl border border-dashed border-border bg-muted/30 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {pages("serviceTypeEmpty")}
            </p>
            <Link
              href="/portal/supplier/profile"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4"
            >
              {pages("serviceTypeEmptyLink")}
            </Link>
          </div>
        )
      }
    />
  );
}
