"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { defaultSelectionFor } from "@/lib/asset-inventory/catalog";
import { classifyChecklist, countAssets } from "@/lib/asset-inventory/classify";
import type { AssetLayer, Inventory } from "@/lib/asset-inventory/types";
import {
  readStateFromHash,
  writeStateToHash,
} from "@/lib/asset-inventory/url-state";

import { BigChecklist } from "./BigChecklist";
import { OutputCard } from "./OutputCard";
import { SectorPicker } from "./SectorPicker";
import { ShareToolbar } from "./ShareToolbar";

type Phase = "sectors" | "checklist" | "output";

const EMPTY: Inventory = { sectors: [], checked: [], custom: [] };

/**
 * Top-level shell — three phases:
 *   1. sectors    — pick NIS2 sector(s)
 *   2. checklist  — review pre-checked typical assets, uncheck what doesn't
 *                   apply, add custom ones per layer
 *   3. output     — Informationsverbund result
 *
 * State is fully encoded in the URL hash so each unique state is one
 * shareable link. Share toolbar copies the URL or opens the user's mail
 * client. No backend, no signup.
 */
export function InventoryShell() {
  const t = useTranslations("assetInventory");
  const [inventory, setInventory] = useState<Inventory>(EMPTY);
  const [phase, setPhase] = useState<Phase>("sectors");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from URL hash on mount.
  useEffect(() => {
    const url = readStateFromHash();
    if (url) {
      setInventory({
        sectors: url.sectors,
        checked: url.checked,
        custom: url.custom,
      });
      if (url.sectors.length > 0 || url.checked.length > 0) {
        setPhase("checklist");
      }
    }
    setHydrated(true);
  }, []);

  // Write state to URL on every change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    writeStateToHash({
      sectors: inventory.sectors,
      checked: inventory.checked,
      custom: inventory.custom,
    });
  }, [inventory, hydrated]);

  const output = useMemo(() => {
    return classifyChecklist(inventory.checked, inventory.custom, {
      resolveCatalogName: (id) => t(`catalog.${id}.label`),
    });
  }, [inventory.checked, inventory.custom, t]);

  const assetCount = countAssets(output);

  function setSectors(next: string[]) {
    setInventory({ ...inventory, sectors: next });
  }

  function setChecked(next: string[]) {
    setInventory({ ...inventory, checked: next });
  }

  function setCustom(next: Array<{ name: string; layer: AssetLayer }>) {
    setInventory({ ...inventory, custom: next });
  }

  function restart() {
    setInventory(EMPTY);
    setPhase("sectors");
  }

  function startChecklist() {
    if (inventory.checked.length === 0) {
      setInventory({
        ...inventory,
        checked: defaultSelectionFor(inventory.sectors),
      });
    }
    setPhase("checklist");
  }

  const canAdvance =
    phase === "sectors" ? inventory.sectors.length > 0 : true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {t(`phases.${phase}.label`, { count: assetCount })}
        </span>
        <div className="flex items-center gap-2">
          {phase === "checklist" && <ShareToolbar />}
          {phase !== "sectors" && (
            <Button variant="ghost" size="sm" onClick={restart}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {t("steps.restart")}
            </Button>
          )}
        </div>
      </div>

      {phase === "sectors" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-tight">
              {t("sectorPicker.question")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("sectorPicker.helpText")}
            </p>
          </div>
          <SectorPicker selected={inventory.sectors} onChange={setSectors} />
        </div>
      )}

      {phase === "checklist" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-tight">
              {t("checklist.heading")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("checklist.subtitle")}
            </p>
          </div>
          <BigChecklist
            sectors={inventory.sectors}
            checked={inventory.checked}
            custom={inventory.custom}
            onCheckedChange={setChecked}
            onCustomChange={setCustom}
          />
        </div>
      )}

      {phase === "output" && <OutputCard output={output} />}

      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button
          variant="outline"
          onClick={() => {
            if (phase === "checklist") setPhase("sectors");
            else if (phase === "output") setPhase("checklist");
          }}
          disabled={phase === "sectors"}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("steps.back")}
        </Button>
        {phase === "sectors" && (
          <Button onClick={startChecklist} disabled={!canAdvance}>
            {t("steps.startChecklist")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        {phase === "checklist" && (
          <Button onClick={() => setPhase("output")}>
            {t("steps.showOutput")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
