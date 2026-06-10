"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { usePolicyEditor } from "./usePolicyEditor";
import { useOptimisticAssets } from "./useOptimisticAssets";
import { PolicyItemsTable } from "./PolicyItemsTable";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Server } from "lucide-react";
import type { Asset } from "@/schema/types";

interface AccessItemRowsProps {
  disabled?: boolean;
  initialItems?: Asset[];
}

/** Inline text input that persists on blur via optimistic asset update. */
function InlineTextInput({
  assetId,
  field,
  value,
  placeholder,
  disabled,
  className,
  onUpdate,
}: {
  assetId: string;
  field: string;
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  onUpdate: (id: string, field: string, value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Input
      ref={ref}
      className={className}
      defaultValue={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      onBlur={(e) => {
        const newVal = e.target.value;
        if (newVal !== (value ?? "")) {
          onUpdate(assetId, field, newVal);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") ref.current?.blur();
      }}
    />
  );
}

/** Inline number input that persists on blur. */
function InlineNumberInput({
  assetId,
  field,
  value,
  disabled,
  className,
  onUpdate,
}: {
  assetId: string;
  field: string;
  value: number;
  disabled?: boolean;
  className?: string;
  onUpdate: (id: string, field: string, value: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Input
      ref={ref}
      type="number"
      min={0}
      className={className}
      defaultValue={value}
      disabled={disabled}
      onBlur={(e) => {
        const newVal = parseInt(e.target.value) || 0;
        if (newVal !== value) {
          onUpdate(assetId, field, newVal);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") ref.current?.blur();
      }}
    />
  );
}

export function AccessItemRows({ disabled, initialItems }: AccessItemRowsProps) {
  const t = useTranslations("policyConfig.items");
  const { items, update } = useOptimisticAssets(initialItems);
  const { display: policyConfig } = usePolicyEditor("access_control");

  const completionCount = items.filter(
    (a) => a.owner && a.accessManagement,
  ).length;

  function handleTextUpdate(assetId: string, field: string, value: string) {
    update({ id: assetId, [field]: value || null });
  }

  function handleNumberUpdate(assetId: string, field: string, value: number) {
    update({ id: assetId, [field]: value });
  }

  const modelLabel = policyConfig?.model
    ? t(`accessModel_${policyConfig.model}` as Parameters<typeof t>[0])
    : null;

  return (
    <PolicyItemsTable
      title={t("accessAssignment")}
      completionCount={completionCount}
      totalCount={items.length}
      registerHref="/assets"
    >
      {modelLabel && (
        <div className="px-3 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
          {t("policyModel")}: <span className="font-medium text-foreground">{modelLabel}</span>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("asset")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("owner")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("accessMethod")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("privAccounts")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate max-w-[180px]">{a.name}</span>
                  {a.type && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {a.type}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-2">
                <InlineTextInput
                  assetId={a.id}
                  field="owner"
                  value={a.owner}
                  placeholder={t("notConfigured")}
                  disabled={disabled}
                  className="h-8 text-xs w-[140px]"
                  onUpdate={handleTextUpdate}
                />
              </td>
              <td className="px-3 py-2">
                <InlineTextInput
                  assetId={a.id}
                  field="accessManagement"
                  value={a.accessManagement}
                  placeholder="e.g. Entra ID RBAC"
                  disabled={disabled}
                  className="h-8 text-xs w-[180px]"
                  onUpdate={handleTextUpdate}
                />
              </td>
              <td className="px-3 py-2">
                <InlineNumberInput
                  assetId={a.id}
                  field="privilegedAccountCount"
                  value={a.privilegedAccountCount ?? 0}
                  disabled={disabled}
                  className="h-8 text-xs w-[80px]"
                  onUpdate={handleNumberUpdate}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PolicyItemsTable>
  );
}
