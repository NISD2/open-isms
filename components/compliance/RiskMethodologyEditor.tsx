"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Minus, Pencil, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";
import type { companyRiskMethodology } from "@/schema";

type MethodologyRow = typeof companyRiskMethodology.$inferSelect;
import { SectionGuidance } from "./PolicyEditorShell";
import {
  getRiskScoreColor,
  RISK_SCORE_COLORS,
} from "@/lib/compliance/risk-methodology-defaults";

// ---------------------------------------------------------------------------
// Scale Table Editor
// ---------------------------------------------------------------------------

function ScaleEditor({
  title,
  levels,
  onChange,
  disabled,
}: {
  title: string;
  levels: ScaleLevel[];
  onChange: (levels: ScaleLevel[]) => void;
  disabled: boolean;
}) {
  const t = useTranslations("methodology");

  const addLevel = () => {
    if (levels.length >= 6) return;
    onChange([
      ...levels,
      { value: levels.length + 1, label: "", description: "" },
    ]);
  };

  const removeLevel = () => {
    if (levels.length <= 2) return;
    onChange(levels.slice(0, -1));
  };

  const updateLevel = (
    idx: number,
    field: "label" | "description",
    value: string
  ) => {
    const updated = levels.map((l, i) =>
      i === idx ? { ...l, [field]: value } : l
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-12 px-3 py-2 text-left font-medium text-muted-foreground">
                #
              </th>
              <th className="w-1/3 px-3 py-2 text-left font-medium text-muted-foreground">
                {t("label")}
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                {t("description")}
              </th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-3 py-2 text-muted-foreground font-mono">
                  {idx + 1}
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={level.label}
                    onChange={(e) => updateLevel(idx, "label", e.target.value)}
                    disabled={disabled}
                    className="h-8"
                    maxLength={100}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={level.description}
                    onChange={(e) =>
                      updateLevel(idx, "description", e.target.value)
                    }
                    disabled={disabled}
                    className="h-8"
                    maxLength={500}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLevel}
            disabled={levels.length >= 6}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("addLevel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeLevel}
            disabled={levels.length <= 2}
          >
            <Minus className="h-3.5 w-3.5 mr-1" />
            {t("removeLevel")}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Matrix Visualization
// ---------------------------------------------------------------------------

function RiskMatrix({
  likelihoodLevels,
  impactLevels,
}: {
  likelihoodLevels: ScaleLevel[];
  impactLevels: ScaleLevel[];
}) {
  const maxScore =
    likelihoodLevels.length * impactLevels.length;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="px-1 py-1" />
              {impactLevels.map((imp) => (
                <th
                  key={imp.value}
                  className="px-1 py-1 text-center font-normal text-muted-foreground"
                  title={imp.description}
                >
                  {imp.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...likelihoodLevels].reverse().map((lik) => (
              <tr key={lik.value}>
                <td
                  className="px-1 py-1 text-right font-normal text-muted-foreground whitespace-nowrap pr-2"
                  title={lik.description}
                >
                  {lik.label}
                </td>
                {impactLevels.map((imp) => {
                  const score = lik.value * imp.value;
                  const color = getRiskScoreColor(score, maxScore);
                  return (
                    <td key={imp.value} className="px-1 py-1">
                      <div
                        className={cn(
                          "w-10 h-8 rounded flex items-center justify-center font-mono font-medium text-xs",
                          RISK_SCORE_COLORS[color]
                        )}
                      >
                        {score}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Editor
// ---------------------------------------------------------------------------

export function RiskMethodologyEditor({
  disabled: externalDisabled,
  guidance,
  initialData,
}: {
  disabled?: boolean;
  guidance?: RequirementGuidanceData | null;
  initialData?: Record<string, unknown> | null;
}) {
  const t = useTranslations("methodology");
  const router = useRouter();

  const { data: methodology, isLoading } =
    trpc.risk.getMethodology.useQuery(undefined,
      initialData != null
        ? { initialData: initialData as MethodologyRow }
        : {},
    );
  const updateMut = trpc.risk.updateMethodology.useMutation({
    onSuccess: () => {
      toast.success(t("saved"));
      router.refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [likelihoodLevels, setLikelihoodLevels] = useState<ScaleLevel[]>([]);
  const [impactLevels, setImpactLevels] = useState<ScaleLevel[]>([]);
  const [acceptanceThreshold, setAcceptanceThreshold] = useState(4);
  const [includesOt, setIncludesOt] = useState(false);

  const startEditing = () => {
    if (!methodology) return;
    setName(methodology.name);
    setLikelihoodLevels(methodology.likelihoodLevels as ScaleLevel[]);
    setImpactLevels(methodology.impactLevels as ScaleLevel[]);
    setAcceptanceThreshold(methodology.acceptanceThreshold);
    setIncludesOt(methodology.includesOt);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMut.mutate({
      name,
      likelihoodLevels,
      impactLevels,
      acceptanceThreshold,
      includesOt,
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!methodology) return null;

  const displayLikelihood = isEditing
    ? likelihoodLevels
    : (methodology.likelihoodLevels as ScaleLevel[]);
  const displayImpact = isEditing
    ? impactLevels
    : (methodology.impactLevels as ScaleLevel[]);
  const displayThreshold = isEditing
    ? acceptanceThreshold
    : methodology.acceptanceThreshold;
  const displayIncludesOt = isEditing ? includesOt : methodology.includesOt;
  const displayName = isEditing ? name : methodology.name;

  const fieldsDisabled = externalDisabled || !isEditing;
  const maxScore = displayLikelihood.length * displayImpact.length;

  return (
    <div className="space-y-6">
      {/* Header with edit/save */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("title")}
        </h2>
        {!externalDisabled && (
          isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                size="sm"
                data-testid="methodology-save"
                onClick={handleSave}
                disabled={updateMut.isPending}
              >
                {updateMut.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t("save")}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" data-testid="methodology-edit" onClick={startEditing}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t("edit")}
            </Button>
          )
        )}
      </div>

      {/* Methodology name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("methodologyName")}</label>
        <SectionGuidance guidance={guidance} fieldKey="methodologyName" />
        <Input
          data-testid="methodology-name"
          value={displayName}
          onChange={(e) => setName(e.target.value)}
          disabled={fieldsDisabled}
          className="max-w-sm"
          maxLength={255}
        />
      </div>

      {/* Scales */}
      <div className="space-y-2">
        <SectionGuidance guidance={guidance} fieldKey="likelihoodScale" />
        <ScaleEditor
          title={t("likelihoodScale")}
          levels={displayLikelihood}
          onChange={setLikelihoodLevels}
          disabled={fieldsDisabled}
        />
      </div>

      <div className="space-y-2">
        <SectionGuidance guidance={guidance} fieldKey="impactScale" />
        <ScaleEditor
          title={t("impactScale")}
          levels={displayImpact}
          onChange={setImpactLevels}
          disabled={fieldsDisabled}
        />
      </div>

      {/* Risk Matrix */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t("riskMatrix")}</h3>
        <RiskMatrix
          likelihoodLevels={displayLikelihood}
          impactLevels={displayImpact}
        />
      </div>

      {/* Acceptance threshold */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {t("acceptanceThreshold")}
        </label>
        <SectionGuidance guidance={guidance} fieldKey="acceptanceThreshold" />
        <div className="flex items-center gap-3">
          <Select
            value={String(displayThreshold)}
            onValueChange={(v) => setAcceptanceThreshold(Number(v))}
            disabled={fieldsDisabled}
          >
            <SelectTrigger className="w-20" data-testid="methodology-threshold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxScore }, (_, i) => i + 1).map((v) => (
                <SelectItem key={v} value={String(v)}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {t("thresholdHelp", { threshold: displayThreshold })}
          </span>
        </div>
      </div>

      {/* Includes OT */}
      <SectionGuidance guidance={guidance} fieldKey="otIcsCoverage" />
      <div className="flex items-center gap-2">
        <Checkbox
          checked={displayIncludesOt}
          onCheckedChange={(v) => setIncludesOt(!!v)}
          disabled={fieldsDisabled}
        />
        <label className="text-sm">{t("includesOt")}</label>
      </div>
    </div>
  );
}
