"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CalModal } from "@/components/funnel/CalModal";
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ObligationsTable } from "./ObligationsTable";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { cn } from "@/lib/utils";
import {
  SECTORS,
  SPECIAL_CASES,
  type Sector,
  type SpecialCaseId,
} from "@/lib/applicability/sectors";

function allAlwaysEssential(ids: SpecialCaseId[]): boolean {
  return ids.length > 0 && ids.every((id) => {
    const sc = SPECIAL_CASES.find((s) => s.id === id);
    return sc?.alwaysEssential;
  });
}
import {
  classify,
  computeSize,
  type ClassificationResult,
} from "@/lib/applicability/classify";

type Step = "sector" | "specialCases" | "size" | "result";

const STEPS: Step[] = ["sector", "specialCases", "size", "result"];

function getStepIndex(step: Step): number {
  return STEPS.indexOf(step);
}

export function ApplicabilityCheck({ calLink }: { calLink: string }) {
  const t = useTranslations("applicability");
  const locale = useLocale();

  const [step, setStep] = useState<Step>("sector");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [noSector, setNoSector] = useState(false);
  const [employees, setEmployees] = useState("");
  const [turnover, setTurnover] = useState("");
  const [balanceSheet, setBalanceSheet] = useState("");
  const [selectedSpecialCases, setSelectedSpecialCases] = useState<SpecialCaseId[]>([]);
  const [noneSpecial, setNoneSpecial] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const stepIndex = getStepIndex(step);
  const totalFormSteps = 3;
  const progress = step === "result" ? 100 : ((stepIndex + 1) / totalFormSteps) * 100;

  const selectedSectorObjects = SECTORS.filter((s) =>
    selectedSectors.includes(s.id)
  );

  const canProceedSector = noSector || selectedSectors.length > 0;
  const canProceedSize = employees !== "" || (turnover !== "" && balanceSheet !== "");
  const canProceedSpecial = noneSpecial || selectedSpecialCases.length > 0;

  const handleSectorToggle = useCallback(
    (sectorId: string) => {
      if (sectorId === "none") {
        setNoSector(!noSector);
        if (!noSector) setSelectedSectors([]);
        return;
      }
      setNoSector(false);
      setSelectedSectors((prev) =>
        prev.includes(sectorId)
          ? prev.filter((s) => s !== sectorId)
          : [...prev, sectorId]
      );
    },
    [noSector]
  );

  const handleSpecialToggle = useCallback(
    (id: string) => {
      if (id === "none") {
        setNoneSpecial(!noneSpecial);
        if (!noneSpecial) setSelectedSpecialCases([]);
        return;
      }
      setNoneSpecial(false);
      setSelectedSpecialCases((prev) =>
        prev.includes(id as SpecialCaseId)
          ? prev.filter((s) => s !== id)
          : [...prev, id as SpecialCaseId]
      );
    },
    [noneSpecial]
  );

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    switch (step) {
      case "sector": {
        if (noSector) {
          setResult(classify({ excluded: false, sectors: [], specialCases: [] }));
          setStep("result");
        } else {
          setStep("specialCases");
        }
        break;
      }
      case "specialCases": {
        if (allAlwaysEssential(selectedSpecialCases)) {
          const sectors = selectedSectorObjects.map((s) => ({
            sectorId: s.id,
            annex: s.annex,
          }));
          setResult(classify({ excluded: false, sectors, specialCases: selectedSpecialCases }));
          setStep("result");
        } else {
          setStep("size");
        }
        break;
      }
      case "size": {
        const size = computeSize({
          employees: Number(employees) || 0,
          turnover: Number(turnover) || 0,
          balanceSheet: Number(balanceSheet) || 0,
        });
        const sectors = selectedSectorObjects.map((s) => ({
          sectorId: s.id,
          annex: s.annex,
        }));
        setResult(
          classify({ excluded: false, sectors, specialCases: selectedSpecialCases, size })
        );
        setStep("result");
        break;
      }
    }
    scrollToTop();
  }

  function handleBack() {
    switch (step) {
      case "specialCases":
        setStep("sector");
        break;
      case "size":
        setStep("specialCases");
        break;
      case "result":
        if (noSector) setStep("sector");
        else if (allAlwaysEssential(selectedSpecialCases)) setStep("specialCases");
        else setStep("size");
        break;
    }
    scrollToTop();
  }

  function handleRestart() {
    setStep("sector");
    setSelectedSectors([]);
    setNoSector(false);
    setEmployees("");
    setTurnover("");
    setBalanceSheet("");
    setSelectedSpecialCases([]);
    setNoneSpecial(false);
    setResult(null);
  }

  const canProceed =
    step === "sector" ? canProceedSector :
    step === "specialCases" ? canProceedSpecial :
    step === "size" ? canProceedSize :
    false;

  return (
    <TooltipProvider>
      <div className="space-y-8 pb-20">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {step !== "result"
                ? t("step", { current: stepIndex + 1, total: totalFormSteps })
                : t("steps.result")}
            </span>
            <span className="flex gap-1.5">
              {STEPS.slice(0, -1).map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-colors duration-300",
                    i <= stepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step content */}
        <Card className="border-0 shadow-lg overflow-hidden">
          {step === "sector" && (
            <SectorStep
              locale={locale}
              t={t}
              selected={selectedSectors}
              noSector={noSector}
              onToggle={handleSectorToggle}
            />
          )}
          {step === "specialCases" && (
            <SpecialCasesStep
              locale={locale}
              t={t}
              selected={selectedSpecialCases}
              noneSelected={noneSpecial}
              onToggle={handleSpecialToggle}
            />
          )}
          {step === "size" && (
            <SizeStep
              t={t}
              employees={employees}
              turnover={turnover}
              balanceSheet={balanceSheet}
              onEmployeesChange={setEmployees}
              onTurnoverChange={setTurnover}
              onBalanceSheetChange={setBalanceSheet}
            />
          )}
          {step === "result" && result && (
            <ResultStep
              t={t}
              result={result}
              selectedSectors={selectedSectorObjects}
              locale={locale}
            />
          )}
        </Card>

      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {step !== "result" ? (
            <>
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === "sector"}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("nav.back")}
              </Button>
              <div className="flex items-center gap-3">
                {step === "sector" && selectedSectors.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t("sector.selectedCount", { count: selectedSectors.length })}
                  </span>
                )}
                {step === "specialCases" && selectedSpecialCases.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t("specialCases.selectedCount", { count: selectedSpecialCases.length })}
                  </span>
                )}
                <Button onClick={handleNext} disabled={!canProceed} className="gap-2">
                  {step === "size" || (step === "specialCases" && selectedSpecialCases.length > 0)
                    ? t("nav.checkResult")
                    : t("nav.next")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleRestart} className="gap-2 shrink-0">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">{t("result.restart")}</span>
              </Button>
              <CalModal calLink={calLink}>
                <Button
                  variant={result && result.classification !== "not_in_scope" ? "default" : "outline"}
                  className="gap-2 whitespace-normal text-right"
                >
                  <CheckCircle2 className="h-4 w-4 hidden sm:block shrink-0" />
                  {result && result.classification !== "not_in_scope"
                    ? t("result.cta")
                    : t("result.ctaVoluntary")}
                </Button>
              </CalModal>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Step Components ──────────────────────────────────────────

function SectorStep({
  locale,
  t,
  selected,
  noSector,
  onToggle,
}: {
  locale: string;
  t: ReturnType<typeof useTranslations<"applicability">>;
  selected: string[];
  noSector: boolean;
  onToggle: (sectorId: string) => void;
}) {
  const annexI = SECTORS.filter((s) => s.annex === "I");
  const annexII = SECTORS.filter((s) => s.annex === "II");

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">{t("sector.title")}</CardTitle>
        <CardDescription>{t("sector.description")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 space-y-0">
        <ListSection label={t("sector.annexI")}>
          {annexI.map((sector, i) => (
            <ListRow
              key={sector.id}
              label={locale === "de" ? sector.name.de : sector.name.en}
              description={locale === "de" ? sector.description.de : sector.description.en}
              selected={selected.includes(sector.id)}
              onClick={() => onToggle(sector.id)}
              last={i === annexI.length - 1}
            />
          ))}
        </ListSection>
        <ListSection label={t("sector.annexII")}>
          {annexII.map((sector, i) => (
            <ListRow
              key={sector.id}
              label={locale === "de" ? sector.name.de : sector.name.en}
              description={locale === "de" ? sector.description.de : sector.description.en}
              selected={selected.includes(sector.id)}
              onClick={() => onToggle(sector.id)}
              last={i === annexII.length - 1}
            />
          ))}
        </ListSection>
        <div className="px-6 py-4">
          <ListRow
            label={t("sector.noSector")}
            selected={noSector}
            onClick={() => onToggle("none")}
            muted
            last
          />
        </div>
      </CardContent>
    </>
  );
}

function SpecialCasesStep({
  locale,
  t,
  selected,
  noneSelected,
  onToggle,
}: {
  locale: string;
  t: ReturnType<typeof useTranslations<"applicability">>;
  selected: SpecialCaseId[];
  noneSelected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">{t("specialCases.title")}</CardTitle>
        <CardDescription>{t("specialCases.description")}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 space-y-0">
        <div>
          {SPECIAL_CASES.map((sc, i) => (
            <ListRow
              key={sc.id}
              label={locale === "de" ? sc.name.de : sc.name.en}
              tooltip={locale === "de" ? sc.description.de : sc.description.en}
              selected={selected.includes(sc.id)}
              onClick={() => onToggle(sc.id)}
              last={i === SPECIAL_CASES.length - 1}
            />
          ))}
        </div>
        <div className="border-t px-6 py-4">
          <ListRow
            label={t("specialCases.noneOfTheAbove")}
            selected={noneSelected}
            onClick={() => onToggle("none")}
            muted
            last
          />
        </div>
      </CardContent>
    </>
  );
}

function SizeStep({
  t,
  employees,
  turnover,
  balanceSheet,
  onEmployeesChange,
  onTurnoverChange,
  onBalanceSheetChange,
}: {
  t: ReturnType<typeof useTranslations<"applicability">>;
  employees: string;
  turnover: string;
  balanceSheet: string;
  onEmployeesChange: (v: string) => void;
  onTurnoverChange: (v: string) => void;
  onBalanceSheetChange: (v: string) => void;
}) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">{t("size.title")}</CardTitle>
        <CardDescription>{t("size.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="employees">{t("size.employees")}</Label>
          <Input
            id="employees"
            type="number"
            min={0}
            placeholder="50"
            value={employees}
            onChange={(e) => onEmployeesChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("size.employeesHelp")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="turnover">{t("size.turnover")}</Label>
          <Input
            id="turnover"
            type="number"
            min={0}
            step={0.1}
            placeholder="10"
            value={turnover}
            onChange={(e) => onTurnoverChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("size.turnoverHelp")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="balanceSheet">{t("size.balanceSheet")}</Label>
          <Input
            id="balanceSheet"
            type="number"
            min={0}
            step={0.1}
            placeholder="10"
            value={balanceSheet}
            onChange={(e) => onBalanceSheetChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("size.balanceSheetHelp")}</p>
        </div>
      </CardContent>
    </>
  );
}

function ResultStep({
  t,
  result,
  selectedSectors,
  locale,
}: {
  t: ReturnType<typeof useTranslations<"applicability">>;
  result: ClassificationResult;
  selectedSectors: Sector[];
  locale: string;
}) {
  const inScope = result.classification !== "not_in_scope";

  const classificationConfig = {
    not_in_scope: {
      label: t("result.notInScope"),
      sublabel: "",
      icon: ShieldX,
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      border: "border-muted",
    },
    important: {
      label: t("result.important"),
      sublabel: t("result.importantLabel"),
      icon: ShieldAlert,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800",
    },
    essential: {
      label: t("result.essential"),
      sublabel: t("result.essentialLabel"),
      icon: ShieldAlert,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/20",
      border: "border-orange-200 dark:border-orange-800",
    },
    kritis: {
      label: t("result.kritis"),
      sublabel: t("result.kritisLabel"),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
    },
  } as const;

  const config = classificationConfig[result.classification];
  const Icon = config.icon;

  return (
    <>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-2xl">{config.sublabel || config.label}</CardTitle>
            {config.sublabel && (
              <CardDescription className="text-base mt-0.5">{config.label}</CardDescription>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`result.reason.${result.reason}`)}
            </p>
          </div>
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              config.bg
            )}
          >
            <Icon className={cn("h-7 w-7", config.color)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {selectedSectors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSectors.map((s) => (
              <Badge key={s.id} variant="outline">
                {locale === "de" ? s.name.de : s.name.en}
              </Badge>
            ))}
          </div>
        )}

        <div className="rounded-lg border-l-4 border-muted-foreground/40 bg-muted/40 p-4 text-sm text-muted-foreground">
          {t("result.disclaimer")}
        </div>

        {inScope && result.penaltyCeiling && (
          <ObligationsTable
            penaltyCeiling={result.penaltyCeiling}
            supervision={result.supervision}
          />
        )}

        {!inScope && result.reason === "below_threshold" && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
            {t("result.supplyChainNote")}
          </div>
        )}

        {inScope && (
          <LeadCaptureForm classification={result.classification} />
        )}

      </CardContent>
    </>
  );
}

// ─── Shared Components ──────────────────────────────────────

function ListSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-6 pt-4 pb-1">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ListRow({
  label,
  tooltip,
  description,
  selected,
  onClick,
  last,
  muted,
}: {
  label: string;
  tooltip?: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  last?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-6 py-2.5 text-left transition-colors cursor-pointer",
        "hover:bg-muted/50 active:bg-muted",
        !last && "border-b border-border/50"
      )}
    >
      {/* Checkmark */}
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border",
          description && "self-start mt-0.5"
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>

      {/* Label + inline description */}
      <span className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm",
            selected ? "font-medium text-foreground" : "text-foreground",
            muted && !selected && "text-muted-foreground"
          )}
        >
          {label}
        </span>
        {description && (
          <span className="block text-xs text-muted-foreground mt-0.5">
            {description}
          </span>
        )}
      </span>

      {/* Info tooltip */}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors",
                description && "self-start mt-0.5"
              )}
            >
              <Info className="h-4 w-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      )}
    </button>
  );
}

