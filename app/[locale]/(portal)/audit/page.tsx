import { ScrollText } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { api } from "@/lib/trpc/server";

export default async function AuditPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!hasReviewAccess(session.role)) {
    redirect("/dashboard");
  }

  const t = await getTranslations("audit");

  const rows = await api.audit.list({ limit: 100, offset: 0 });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <AuditLogTable rows={rows} />
    </div>
  );
}
