"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { PolicyItemsTable } from "./PolicyItemsTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { severityColor } from "./severity-colors";
import type { supplier as supplierSchema } from "@/schema";

type SupplierRow = typeof supplierSchema.$inferSelect;

const CLAUSE_FIELDS: ReadonlyArray<keyof Pick<SupplierRow, "hasSecurityClauses" | "hasIncidentNotificationClause" | "hasAuditRights" | "hasSubcontractorFlowDown">> = [
  "hasSecurityClauses",
  "hasIncidentNotificationClause",
  "hasAuditRights",
  "hasSubcontractorFlowDown",
];

function countClausesMet(s: SupplierRow): number {
  let count = 0;
  for (const f of CLAUSE_FIELDS) {
    if (s[f]) count++;
  }
  return count;
}

export function ProcurementItemRows() {
  const t = useTranslations("policyConfig.items");
  const { data: suppliers } = trpc.supplier.list.useQuery();
  const items = suppliers ?? [];
  const totalClauses = CLAUSE_FIELDS.length;

  const completionCount = items.filter(
    (s) => countClausesMet(s) === totalClauses,
  ).length;

  return (
    <PolicyItemsTable
      title={t("clausesTitle")}
      completionCount={completionCount}
      totalCount={items.length}
      registerHref="/suppliers"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("supplier")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("riskLevel")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("clausesTitle")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("contractDates")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => {
            const met = countClausesMet(s);
            const pct = totalClauses > 0 ? Math.round((met / totalClauses) * 100) : 0;
            return (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">
                  <Link
                    href="/suppliers"
                    className="font-medium text-sm hover:underline underline-offset-2"
                  >
                    {s.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {s.riskLevel && (
                    <Badge variant="outline" className={cn("text-[10px]", severityColor(s.riskLevel))}>
                      {s.riskLevel}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-red-500",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("clausesMet", { count: met, total: totalClauses })}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {s.contractStartDate && s.contractEndDate
                    ? `${s.contractStartDate} - ${s.contractEndDate}`
                    : s.contractStartDate ?? "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </PolicyItemsTable>
  );
}
