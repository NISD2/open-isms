"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { AuditDiffView } from "./AuditDiffView";
import { ChevronDown, ChevronRight } from "lucide-react";

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  previousValue: unknown;
  newValue: unknown;
  userName: string | null;
  createdAt: Date;
}

interface AuditLogTableProps {
  rows: AuditRow[];
}

const ACTION_COLORS: Record<string, string> = {
  "requirement.status_change": "bg-blue-100 text-blue-800",
  "requirement.signoff": "bg-green-100 text-green-800",
  "evidence.upload": "bg-purple-100 text-purple-800",
  "evidence.delete": "bg-red-100 text-red-800",
  "assessment.create": "bg-amber-100 text-amber-800",
  "company.create": "bg-amber-100 text-amber-800",
};

export function AuditLogTable({ rows }: AuditLogTableProps) {
  const t = useTranslations("audit");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("noEntries")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border divide-y">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_8rem_6rem_7rem] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
        <div />
        <div>{t("description")}</div>
        <div>{t("action")}</div>
        <div>{t("user")}</div>
        <div>{t("time")}</div>
      </div>

      {rows.map((row) => {
        const isExpanded = expandedId === row.id;
        const hasDiff = !!(row.previousValue || row.newValue);

        return (
          <div key={row.id}>
            <button
              className="grid grid-cols-[2rem_1fr_8rem_6rem_7rem] gap-2 px-4 py-3 w-full text-left text-sm hover:bg-accent/50 transition-colors"
              onClick={() =>
                hasDiff && setExpandedId(isExpanded ? null : row.id)
              }
              disabled={!hasDiff}
            >
              <div className="flex items-center">
                {hasDiff ? (
                  isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )
                ) : (
                  <div className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="truncate">{row.description}</div>
              <div>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    ACTION_COLORS[row.action] ??
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {row.action.split(".").pop()}
                </span>
              </div>
              <div className="text-muted-foreground truncate text-xs">
                {row.userName ?? "-"}
              </div>
              <div className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(row.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </button>

            {isExpanded && hasDiff && (
              <div className="px-4 pb-4 pl-12 bg-muted/30">
                <AuditDiffView
                  previousValue={row.previousValue}
                  newValue={row.newValue}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
