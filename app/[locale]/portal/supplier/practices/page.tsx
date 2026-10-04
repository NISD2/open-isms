import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { QuestionnairePage } from "@/components/supplier-portal/questionnaire/QuestionnairePage";
import { api } from "@/lib/trpc/server";

/** Security practices: what the supplier commits to its customers, and how it runs security. */
export default async function SupplierPracticesPage() {
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);
  const profile = await api.supplierPortal.profile.get();
  if (!profile) redirect("/portal/supplier-onboarding");

  return (
    <QuestionnairePage
      page="practices"
      title={nav("practices")}
      intro={pages("practicesIntro")}
      row={profile}
      lastSavedAt={profile.practicesLastSavedAt ?? null}
    />
  );
}
