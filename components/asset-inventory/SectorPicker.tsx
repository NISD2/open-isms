"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import {
  ANNEX_I_SECTORS,
  ANNEX_II_SECTORS,
} from "@/lib/asset-inventory/sectors";
import type { NIS2Sector } from "@/lib/asset-inventory/types";
import { cn } from "@/lib/utils";

interface SectorPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

export function SectorPicker({ selected, onChange }: SectorPickerProps) {
  const t = useTranslations("assetInventory");

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-6">
      <SectorGrid
        heading={t("sectorPicker.annexI")}
        subtitle={t("sectorPicker.annexIDescription")}
        sectors={ANNEX_I_SECTORS}
        selected={selected}
        onToggle={toggle}
        t={t}
      />
      <SectorGrid
        heading={t("sectorPicker.annexII")}
        subtitle={t("sectorPicker.annexIIDescription")}
        sectors={ANNEX_II_SECTORS}
        selected={selected}
        onToggle={toggle}
        t={t}
      />
    </div>
  );
}

interface SectorGridProps {
  heading: string;
  subtitle: string;
  sectors: NIS2Sector[];
  selected: string[];
  onToggle: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}

function SectorGrid({ heading, subtitle, sectors, selected, onToggle, t }: SectorGridProps) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {heading}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {sectors.map((sector) => {
          const isSelected = selected.includes(sector.id);
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => onToggle(sector.id)}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              <span className="text-sm leading-snug">
                {t(`sectors.${sector.id}.name`)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
