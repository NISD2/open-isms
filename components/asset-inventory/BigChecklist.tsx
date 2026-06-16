"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus, X } from "lucide-react";

import {
  CATALOG,
  FUNCTIONAL_GROUPS,
  type FunctionalGroup,
  visibleCatalog,
} from "@/lib/asset-inventory/catalog";
import type { AssetLayer } from "@/lib/asset-inventory/types";
import { cn } from "@/lib/utils";

interface BigChecklistProps {
  sectors: string[];
  checked: string[];
  custom: Array<{ name: string; layer: AssetLayer }>;
  onCheckedChange: (next: string[]) => void;
  onCustomChange: (next: Array<{ name: string; layer: AssetLayer }>) => void;
}

const GROUP_TO_DEFAULT_LAYER: Record<FunctionalGroup, AssetLayer> = {
  "business-processes": "geschaeftsprozess",
  "customer-facing": "anwendung",
  sales: "anwendung",
  "customer-service": "anwendung",
  "hr-payroll": "anwendung",
  finance: "anwendung",
  "it-applications": "anwendung",
  "it-infrastructure": "it-system",
  endpoints: "it-system",
  locations: "raum",
  network: "kommunikation",
  "sector-specific": "anwendung",
};

export function BigChecklist({
  sectors,
  checked,
  custom,
  onCheckedChange,
  onCustomChange,
}: BigChecklistProps) {
  const t = useTranslations("assetInventory");
  const visible = useMemo(() => visibleCatalog(sectors), [sectors]);
  const byGroup = useMemo(() => {
    const map = new Map<FunctionalGroup, typeof CATALOG>();
    for (const item of visible) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return map;
  }, [visible]);

  function toggle(id: string) {
    if (checked.includes(id)) {
      onCheckedChange(checked.filter((c) => c !== id));
    } else {
      onCheckedChange([...checked, id]);
    }
  }

  function addCustom(layer: AssetLayer, name: string) {
    if (!name.trim()) return;
    onCustomChange([...custom, { name: name.trim(), layer }]);
  }

  function removeCustom(index: number) {
    onCustomChange(custom.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-8">
      {FUNCTIONAL_GROUPS.map((group) => {
        const items = byGroup.get(group);
        if (!items || items.length === 0) return null;

        const groupChecked = items.filter((i) => checked.includes(i.id)).length;
        const groupLayer = GROUP_TO_DEFAULT_LAYER[group];
        const groupCustoms = custom
          .map((c, i) => ({ ...c, originalIndex: i }))
          .filter((c) => c.layer === groupLayer);

        return (
          <section key={group} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 border-b border-border z-10">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t(`groups.${group}.label`)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(`groups.${group}.description`)}
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {groupChecked}/{items.length}
              </span>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2">
              {items.map((item) => {
                const isChecked = checked.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      isChecked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:bg-muted/50 opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border",
                        isChecked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="leading-snug">
                      {t(`catalog.${item.id}.label`)}
                    </span>
                  </button>
                );
              })}
            </div>

            {groupCustoms.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {groupCustoms.map((c) => (
                  <li
                    key={c.originalIndex}
                    className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm"
                  >
                    <Check className="h-3.5 w-3.5 flex-none text-emerald-600 dark:text-emerald-300" />
                    <span className="flex-1">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCustom(c.originalIndex)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("checklist.removeCustom")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <AddCustomRow
              layer={groupLayer}
              onAdd={(name) => addCustom(groupLayer, name)}
            />
          </section>
        );
      })}
    </div>
  );
}

function AddCustomRow({
  layer,
  onAdd,
}: {
  layer: AssetLayer;
  onAdd: (name: string) => void;
}) {
  const t = useTranslations("assetInventory");
  const [draft, setDraft] = useState("");

  function commit() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder={t(`checklist.addPlaceholder.${layer}`)}
        className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
      <button
        type="button"
        onClick={commit}
        disabled={!draft.trim()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors",
          draft.trim()
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground cursor-not-allowed",
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        {t("checklist.addButton")}
      </button>
    </div>
  );
}
