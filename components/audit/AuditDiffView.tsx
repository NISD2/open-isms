"use client";

import { useTranslations } from "next-intl";

interface AuditDiffViewProps {
  previousValue: unknown;
  newValue: unknown;
}

export function AuditDiffView({ previousValue, newValue }: AuditDiffViewProps) {
  const t = useTranslations("common");
  const prev = normalize(previousValue);
  const next = normalize(newValue);
  const allKeys = [...new Set([...Object.keys(prev), ...Object.keys(next)])];

  if (allKeys.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t("noData")}</p>;
  }

  return (
    <div className="space-y-1 text-xs font-mono">
      {allKeys.map((key) => {
        const oldVal = prev[key];
        const newVal = next[key];
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

        return (
          <div key={key} className="flex gap-2">
            <span className="text-muted-foreground w-36 shrink-0 truncate">
              {key}:
            </span>
            {changed ? (
              <div className="flex gap-2">
                {oldVal !== undefined && (
                  <span className="text-red-500 line-through">
                    {formatVal(oldVal)}
                  </span>
                )}
                {newVal !== undefined && (
                  <span className="text-green-600">{formatVal(newVal)}</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{formatVal(newVal)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function normalize(val: unknown): Record<string, unknown> {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

function formatVal(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "string") return val;
  return JSON.stringify(val);
}
