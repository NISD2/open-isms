"use client";

import { useTranslations } from "next-intl";
import { usePolicyEditor } from "./usePolicyEditor";
import { useOptimisticAssets } from "./useOptimisticAssets";
import { PolicyItemsTable } from "./PolicyItemsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Server } from "lucide-react";
import type { CryptoAlgorithmEntry } from "@/lib/compliance/policy-config-defaults";
import type { Asset } from "@/schema/types";

interface CryptoItemRowsProps {
  disabled?: boolean;
  initialItems?: Asset[];
}

function getApprovedAlgorithms(
  algorithms: CryptoAlgorithmEntry[] | undefined,
  ...categories: CryptoAlgorithmEntry["category"][]
): CryptoAlgorithmEntry[] {
  if (!algorithms) return [];
  return algorithms.filter(
    (a) => a.status === "approved" && categories.includes(a.category),
  );
}

export function CryptoItemRows({ disabled, initialItems }: CryptoItemRowsProps) {
  const t = useTranslations("policyConfig.items");
  const { items, update } = useOptimisticAssets(initialItems);
  const { display: policyConfig } = usePolicyEditor("crypto");

  const restAlgorithms = getApprovedAlgorithms(policyConfig?.algorithms, "symmetric", "asymmetric");
  const transitAlgorithms = getApprovedAlgorithms(policyConfig?.algorithms, "tls");

  const completionCount = items.filter(
    (a) => a.encryptionAtRest || a.encryptionInTransit,
  ).length;

  function handleUpdate(assetId: string, field: string, value: string) {
    update({ id: assetId, [field]: value === "__none__" ? null : value });
  }

  return (
    <PolicyItemsTable
      title={t("encryptionAtRest")}
      completionCount={completionCount}
      totalCount={items.length}
      registerHref="/assets"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("asset")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("encryptionAtRest")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("encryptionInTransit")}</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("cryptoImplementation")}</th>
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
                <Select
                  value={a.encryptionAtRest ?? "__none__"}
                  onValueChange={(v) => handleUpdate(a.id, "encryptionAtRest", v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-xs w-[180px]">
                    <SelectValue placeholder={t("selectAlgorithm")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("notConfigured")}</SelectItem>
                    {restAlgorithms.map((alg) => (
                      <SelectItem key={alg.algorithm + (alg.keyLength ?? "")} value={alg.algorithm}>
                        {alg.algorithm}{alg.keyLength ? ` (${alg.keyLength})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                <Select
                  value={a.encryptionInTransit ?? "__none__"}
                  onValueChange={(v) => handleUpdate(a.id, "encryptionInTransit", v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-xs w-[220px]">
                    <SelectValue placeholder={t("selectAlgorithm")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("notConfigured")}</SelectItem>
                    {transitAlgorithms.map((alg) => (
                      <SelectItem key={alg.algorithm} value={alg.algorithm}>
                        {alg.algorithm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                {a.cryptoImplementation ? (
                  <span className="text-xs">{a.cryptoImplementation}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{t("notConfigured")}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PolicyItemsTable>
  );
}
