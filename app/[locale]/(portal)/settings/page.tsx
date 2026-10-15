import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AiDataSharingSettings } from "@/components/settings/AiDataSharingSettings";
import { McpKeySettings } from "@/components/settings/McpKeySettings";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { MCP_DOCS_PATH } from "@/lib/mcp/config";
import { api } from "@/lib/trpc/server";

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
      <AiDataSharingSettings currentLevel={companyData.aiDataSharing} isAdmin={isAdmin} />
      <div className="mt-10 border-t pt-8">
        <McpKeySettings
          docsUrl={MCP_DOCS_PATH}
          companyId={companyData.id}
          mayWalk={mayWalkDurchgang(
            session.accessLevel,
            isPlatformAdmin(session.user.email),
          )}
        />
      </div>
    </div>
  );
}
