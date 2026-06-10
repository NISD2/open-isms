"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Plus,
  X,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ObligationsTable } from "./ObligationsTable";
import { cn } from "@/lib/utils";
import { mapWzCodesToNis2 } from "@/lib/applicability/wz-to-nis2";
import {
  SECTORS,
  SPECIAL_CASES,
  type SpecialCaseId,
} from "@/lib/applicability/sectors";
import {
  classify,
  computeSize,
  type ClassificationResult,
} from "@/lib/applicability/classify";

export function AdminClassifier() {
  const [companyName, setCompanyName] = useState("");
  const [wzInput, setWzInput] = useState("");
  const [wzCodes, setWzCodes] = useState<string[]>([]);
  const [employees, setEmployees] = useState("");
  const [turnover, setTurnover] = useState("");
  const [balanceSheet, setBalanceSheet] = useState("");
  const [manualSectors, setManualSectors] = useState<string[]>([]);
  const [specialCases, setSpecialCases] = useState<SpecialCaseId[]>([]);
  const [excluded, setExcluded] = useState(false);

  // Derive sectors from WZ codes
  const wzMatches = useMemo(() => mapWzCodesToNis2(wzCodes), [wzCodes]);
  const wzSectorIds = useMemo(
    () => [...new Set(wzMatches.map((m) => m.sectorId))],
    [wzMatches],
  );

  // Combine WZ-derived + manual sectors (deduplicated)
  const allSectorIds = useMemo(
    () => [...new Set([...wzSectorIds, ...manualSectors])],
    [wzSectorIds, manualSectors],
  );

  const sectors = allSectorIds.map((id) => {
    const sector = SECTORS.find((s) => s.id === id);
    return { sectorId: id, annex: sector?.annex ?? ("II" as const) };
  });

  // Compute size
  const size = useMemo(() => {
    const emp = Number(employees) || 0;
    const rev = Number(turnover) || 0;
    const bal = Number(balanceSheet) || 0;
    if (emp === 0 && rev === 0 && bal === 0) return undefined;
    return computeSize({ employees: emp, turnover: rev, balanceSheet: bal });
  }, [employees, turnover, balanceSheet]);

  // Classify
  const result: ClassificationResult | null = useMemo(() => {
    if (allSectorIds.length === 0 && specialCases.length === 0 && !excluded)
      return null;
    return classify({ excluded, sectors, specialCases, size });
  }, [excluded, sectors, specialCases, size, allSectorIds.length]);

  function addWzCode() {
    const code = wzInput.trim();
    if (code && !wzCodes.includes(code)) {
      setWzCodes((prev) => [...prev, code]);
    }
    setWzInput("");
  }

  function removeWzCode(code: string) {
    setWzCodes((prev) => prev.filter((c) => c !== code));
  }

  function toggleManualSector(sectorId: string) {
    setManualSectors((prev) =>
      prev.includes(sectorId)
        ? prev.filter((s) => s !== sectorId)
        : [...prev, sectorId],
    );
  }

  function toggleSpecialCase(id: SpecialCaseId) {
    setSpecialCases((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function handleReset() {
    setCompanyName("");
    setWzInput("");
    setWzCodes([]);
    setEmployees("");
    setTurnover("");
    setBalanceSheet("");
    setManualSectors([]);
    setSpecialCases([]);
    setExcluded(false);
  }

  const inScope =
    result && result.classification !== "not_in_scope";

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Inputs */}
        <div className="space-y-6">
          {/* Company name */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="company-name">Company name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stadtwerke München GmbH"
                />
              </div>
            </CardContent>
          </Card>

          {/* WZ Codes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">WZ2008 Codes</CardTitle>
              <CardDescription>
                Add industry codes — sectors are derived automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={wzInput}
                  onChange={(e) => setWzInput(e.target.value)}
                  placeholder="e.g. 35.11"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addWzCode();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addWzCode}
                  disabled={!wzInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {wzCodes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {wzCodes.map((code) => {
                    const match = wzMatches.find((m) => m.wzCode === code);
                    const sector = match
                      ? SECTORS.find((s) => s.id === match.sectorId)
                      : null;
                    return (
                      <Badge
                        key={code}
                        variant={match ? "default" : "secondary"}
                        className="gap-1.5 font-mono"
                      >
                        {code}
                        {sector && (
                          <span className="font-sans font-normal opacity-70">
                            {sector.name.en}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeWzCode(code)}
                          className="ml-0.5 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              {wzCodes.length > 0 && wzMatches.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No NIS2 sector match for these codes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Manual sector override */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sectors</CardTitle>
              <CardDescription>
                Auto-derived from WZ codes. Add manual overrides below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {SECTORS.map((sector) => {
                  const fromWz = wzSectorIds.includes(sector.id);
                  const manual = manualSectors.includes(sector.id);
                  const active = fromWz || manual;
                  return (
                    <label
                      key={sector.id}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                        active
                          ? "bg-primary/5 text-foreground"
                          : "text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <Checkbox
                        checked={active}
                        disabled={fromWz}
                        onCheckedChange={() => {
                          if (!fromWz) toggleManualSector(sector.id);
                        }}
                      />
                      <span className="flex-1">{sector.name.en}</span>
                      <span className="text-xs opacity-60">
                        Annex {sector.annex}
                      </span>
                      {fromWz && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          WZ
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Company size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Company Size</CardTitle>
              <CardDescription>
                EU Commission Recommendation 2003/361/EC thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-employees">
                  Employees (FTE)
                </Label>
                <Input
                  id="admin-employees"
                  type="number"
                  min={0}
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-turnover">
                  Annual turnover (EUR millions)
                </Label>
                <Input
                  id="admin-turnover"
                  type="number"
                  min={0}
                  step={0.1}
                  value={turnover}
                  onChange={(e) => setTurnover(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-balance">
                  Balance sheet total (EUR millions)
                </Label>
                <Input
                  id="admin-balance"
                  type="number"
                  min={0}
                  step={0.1}
                  value={balanceSheet}
                  onChange={(e) => setBalanceSheet(e.target.value)}
                  placeholder="0"
                />
              </div>
              {size && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                  Computed size:{" "}
                  <span className="font-medium">
                    {size === "large"
                      ? "Large enterprise (≥250 FTE or >€50M+€43M)"
                      : size === "medium"
                        ? "Medium enterprise (≥50 FTE or >€10M+€10M)"
                        : "Small enterprise (<50 FTE and ≤€10M)"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special cases + exclusion */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Special Cases</CardTitle>
              <CardDescription>
                Size-independent designations and exclusions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                {SPECIAL_CASES.map((sc) => (
                  <label
                    key={sc.id}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                      specialCases.includes(sc.id)
                        ? "bg-primary/5 text-foreground"
                        : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={specialCases.includes(sc.id)}
                      onCheckedChange={() => toggleSpecialCase(sc.id)}
                    />
                    <span>{sc.name.en}</span>
                  </label>
                ))}
              </div>
              <div className="border-t pt-3">
                <label className="flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer text-muted-foreground hover:bg-muted/50">
                  <Checkbox
                    checked={excluded}
                    onCheckedChange={(v) => setExcluded(v === true)}
                  />
                  <span>
                    Excluded entity (defence, law enforcement, judiciary, etc.)
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset all fields
          </Button>
        </div>

        {/* Right column: Result (sticky) */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <ResultCard
            companyName={companyName}
            result={result}
            sectors={sectors}
            wzMatches={wzMatches}
            size={size}
            inScope={!!inScope}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

function ResultCard({
  companyName,
  result,
  sectors,
  wzMatches,
  size,
  inScope,
}: {
  companyName: string;
  result: ClassificationResult | null;
  sectors: { sectorId: string; annex: "I" | "II" }[];
  wzMatches: ReturnType<typeof mapWzCodesToNis2>;
  size: "small" | "medium" | "large" | undefined;
  inScope: boolean;
}) {
  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Add WZ codes or select sectors to see classification
        </CardContent>
      </Card>
    );
  }

  const config = CLASSIFICATION_CONFIG[result.classification];
  const Icon = config.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {companyName && (
              <CardDescription className="text-xs mb-1">
                {companyName}
              </CardDescription>
            )}
            <CardTitle className={cn("text-xl", config.color)}>
              {config.label}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {REASON_TEXT[result.reason]}
            </p>
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              config.bg,
            )}
          >
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Summary table */}
        <div className="rounded-lg border divide-y text-sm">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">
              Classification
            </span>
            <Badge variant={inScope ? "default" : "secondary"}>
              {result.classification.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">
              Company size
            </span>
            <span className="text-sm">
              {size ?? "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">
              Annexes
            </span>
            <span className="text-sm">
              {result.annexes.length > 0
                ? result.annexes.map((a) => `Annex ${a}`).join(", ")
                : "None"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">
              Supervision
            </span>
            <span className="text-sm">
              {result.supervision ?? "N/A"}
            </span>
          </div>
        </div>

        {/* Matched sectors */}
        {sectors.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              NIS2 Sectors ({sectors.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sectors.map(({ sectorId, annex }) => {
                const sector = SECTORS.find((s) => s.id === sectorId);
                return (
                  <Badge key={sectorId} variant="outline" className="text-xs gap-1">
                    {sector?.name.en ?? sectorId}
                    <span className="opacity-50">{annex}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* WZ matches detail */}
        {wzMatches.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              WZ Code Matches
            </h3>
            <div className="rounded-lg border divide-y text-xs">
              {wzMatches.map((m) => {
                const sector = SECTORS.find((s) => s.id === m.sectorId);
                return (
                  <div
                    key={`${m.wzCode}-${m.sectorId}`}
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <Badge variant="secondary" className="font-mono text-[10px] py-0">
                      {m.wzCode}
                    </Badge>
                    <span className="text-muted-foreground">
                      {sector?.name.en} — Annex {sector?.annex}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Obligations */}
        {inScope && result.penaltyCeiling && (
          <ObligationsTable
            penaltyCeiling={result.penaltyCeiling}
            supervision={result.supervision}
          />
        )}
      </CardContent>
    </Card>
  );
}

const CLASSIFICATION_CONFIG = {
  not_in_scope: {
    label: "Not in scope",
    icon: ShieldX,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  important: {
    label: "Important entity",
    icon: ShieldAlert,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
  },
  essential: {
    label: "Essential entity",
    icon: ShieldAlert,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  kritis: {
    label: "KRITIS Operator",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
} as const;

const REASON_TEXT: Record<ClassificationResult["reason"], string> = {
  excluded: "Organization is excluded from NIS2 scope.",
  no_sector: "No registered industry codes fall under a NIS2 sector.",
  below_threshold:
    "Operates in a NIS2 sector but below the size threshold.",
  special_case: "In scope regardless of size due to special designation.",
  size_and_sector: "Both sector and size criteria for NIS2 are met.",
};
