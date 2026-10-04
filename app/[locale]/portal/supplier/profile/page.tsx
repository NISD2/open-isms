import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { QuestionnairePage } from "@/components/supplier-portal/questionnaire/QuestionnairePage";
import { api } from "@/lib/trpc/server";

/** Profile: who the supplier is, how to reach them, what they deliver. */
export default async function SupplierProfileSectionPage() {
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);
  const profile = await api.supplierPortal.profile.get();
  if (!profile) redirect("/portal/supplier-onboarding");

  return (
    <QuestionnairePage
      page="profile"
      title={nav("profile")}
      intro={pages("profileIntro")}
      row={profile}
      lastSavedAt={profile.practicesLastSavedAt ?? null}
    />
  );
}
