import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { ScrollText } from "lucide-react";

export default async function AuditPage() {
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
