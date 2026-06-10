import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { AiDataSharingSettings } from "@/components/settings/AiDataSharingSettings";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const t = await getTranslations("settings");
  const companyData = await api.assessment.getCompany();

  if (!companyData) redirect("/onboarding");

  const isAdmin = session.role === "admin";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
      </div>
      <AiDataSharingSettings
        currentLevel={companyData.aiDataSharing}
        isAdmin={isAdmin}
      />
    </div>
  );
}
