"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { usePolicyEditor } from "./usePolicyEditor";
import { PolicyItemsTable } from "./PolicyItemsTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SEVERITY_ORDER, SEVERITY_COLORS, isSeverity, type Severity } from "./severity-colors";
import type { PatchSlaHours } from "@/lib/compliance/policy-config-defaults";

export function PatchSlaItemRows() {
  const t = useTranslations("policyConfig.items");
  const ts = useTranslations("policyConfig.patchMgmt");
  const { data: patches } = trpc.patch.list.useQuery();
  const { display: policyConfig } = usePolicyEditor("patch_mgmt");

  const items = patches ?? [];

  if (!policyConfig) {
    return (
      <PolicyItemsTable
        title={ts("patchSla")}
        completionCount={0}
        totalCount={0}
        registerHref="/patches"
      >
        <div className="p-4 text-sm text-muted-foreground text-center">
          {t("noPatchSla")}
        </div>
      </PolicyItemsTable>
    );
  }

  const bySeverity = new Map<Severity, { onTime: number; overdue: number; total: number }>();
  for (const sev of SEVERITY_ORDER) {
    bySeverity.set(sev, { onTime: 0, overdue: 0, total: 0 });
  }

  const slaHours: PatchSlaHours = policyConfig.patchSlaHours;

  for (const patch of items) {
    const rawSev = (patch.severity ?? "low").toLowerCase();
    const sev: Severity = isSeverity(rawSev) ? rawSev : "low";
    const group = bySeverity.get(sev);
    if (!group) continue;
    group.total++;

    const limit = slaHours[sev];

    if (patch.status === "applied" && patch.appliedAt && patch.releaseDate) {
      const releaseMs = new Date(patch.releaseDate).getTime();
      const appliedMs = new Date(patch.appliedAt).getTime();
      const hoursToApply = (appliedMs - releaseMs) / (1000 * 60 * 60);
      if (hoursToApply <= limit) {
        group.onTime++;
      } else {
        group.overdue++;
      }
    } else if (patch.status === "pending" && patch.releaseDate) {
      const releaseMs = new Date(patch.releaseDate).getTime();
      const hoursElapsed = (Date.now() - releaseMs) / (1000 * 60 * 60);
      if (hoursElapsed > limit) {
        group.overdue++;
      }
    }
  }

  const appliedCount = items.filter((p) => p.status === "applied").length;

  return (
    <PolicyItemsTable
      title={ts("patchSla")}
      completionCount={appliedCount}
      totalCount={items.length}
      registerHref="/patches"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{ts("patchSla")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("sla")}</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t("patchesOnTime")}</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t("patchesOverdue")}</th>
          </tr>
        </thead>
        <tbody>
          {SEVERITY_ORDER.map((sev) => {
            const group = bySeverity.get(sev);
            if (!group || group.total === 0) return null;
            return (
              <tr key={sev} className="border-t">
                <td className="px-3 py-2">
                  <Badge variant="outline" className={cn("text-[10px]", SEVERITY_COLORS[sev])}>
                    {ts(sev)}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({group.total})
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {slaHours[sev] < 24
                    ? t("hoursLabel", { count: slaHours[sev] })
                    : t("daysLabel", { count: Math.round(slaHours[sev] / 24) })}
                </td>
                <td className="px-3 py-2 text-center">
                  {group.onTime > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {group.onTime}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {group.overdue > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                      {group.overdue}
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </PolicyItemsTable>
  );
}
