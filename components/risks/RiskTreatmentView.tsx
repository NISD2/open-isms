"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { getRiskScoreColor, RISK_SCORE_COLORS, type ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import { RiskMatrixPicker } from "./RiskMatrixPicker";
import type { companyRiskMethodology, risk as riskSchema, riskTreatment as rtSchema } from "@/schema";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, ArrowRight, Check, ChevronDown, ChevronRight,
  Loader2, Plus, X, CircleCheck, Circle,
} from "lucide-react";

type MethodologyRow = typeof companyRiskMethodology.$inferSelect;
type Treatment = typeof rtSchema.$inferSelect;

interface RiskTreatmentViewProps {
  initialData?: Record<string, unknown> | null;
  disabled?: boolean;
  guidance?: unknown;
}

type RiskWithTreatments = typeof riskSchema.$inferSelect & {
  treatments: Treatment[];
};

const TREATMENT_STATUSES = ["not_started", "in_progress", "completed"] as const;

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CircleCheck className="h-4 w-4 text-emerald-500" />;
  if (status === "in_progress") return <Circle className="h-4 w-4 text-amber-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

function scoreColor(score: number, maxScore: number) {
  return RISK_SCORE_COLORS[getRiskScoreColor(score, maxScore)];
}

export function RiskTreatmentView({ initialData, disabled }: RiskTreatmentViewProps) {
  const t = useTranslations("risks");
  const router = useRouter();
  const utils = trpc.useUtils();
  const invalidate = () => { utils.risk.listWithTreatments.invalidate(); router.refresh(); };

  const methodology = initialData?.methodology as MethodologyRow | undefined;
  const likelihoodLevels = (methodology?.likelihoodLevels ?? []) as ScaleLevel[];
  const impactLevels = (methodology?.impactLevels ?? []) as ScaleLevel[];
  const maxScore = likelihoodLevels.length * impactLevels.length || 16;
  const threshold = methodology?.acceptanceThreshold ?? 4;

  const { data: risks } = trpc.risk.listWithTreatments.useQuery(undefined, {
    initialData: (initialData?.risks ?? []) as RiskWithTreatments[],
  });

  const updateRiskMut = trpc.risk.update.useMutation({ onSuccess: invalidate });
  const createTreatmentMut = trpc.risk.createTreatment.useMutation({ onSuccess: invalidate });
  const updateTreatmentMut = trpc.risk.updateTreatment.useMutation({ onSuccess: invalidate });
  const deleteTreatmentMut = trpc.risk.deleteTreatment.useMutation({ onSuccess: invalidate });

  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [addingTreatment, setAddingTreatment] = useState<string | null>(null);
  const [settingResidual, setSettingResidual] = useState<string | null>(null);

  const aboveThreshold = (risks ?? []).filter(r => r.riskScore > threshold);
  const belowOrAccepted = (risks ?? []).filter(r => r.riskScore <= threshold);

  function toggleRisk(id: string) {
    setExpandedRisks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Above threshold — needs treatment */}
      {aboveThreshold.length > 0 && (
        <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          {t("risksAboveThreshold", { count: aboveThreshold.length, threshold })}
        </div>
      )}

      {aboveThreshold.map(risk => {
        const expanded = expandedRisks.has(risk.id);
        const hasResidual = risk.residualLikelihood != null && risk.residualImpact != null;
        const residualScore = hasResidual ? (risk.residualLikelihood ?? 0) * (risk.residualImpact ?? 0) : null;
        const residualBelow = residualScore != null && residualScore <= threshold;

        return (
          <Card key={risk.id}>
            <button
              type="button"
              onClick={() => toggleRisk(risk.id)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-medium text-sm flex-1">{risk.title}</span>
              <Badge className={cn("text-xs font-mono", scoreColor(risk.riskScore, maxScore))}>{risk.riskScore}</Badge>
              {hasResidual && (
                <>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge className={cn("text-xs font-mono", scoreColor(residualScore ?? 0, maxScore))}>{residualScore}</Badge>
                  {residualBelow && <Check className="h-4 w-4 text-emerald-500" />}
                </>
              )}
            </button>

            {expanded && (
              <CardContent className="pt-0 space-y-4">
                {/* Initial vs Residual */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("initialScore")}:</span>
                    <Badge className={cn("ml-2 font-mono", scoreColor(risk.riskScore, maxScore))}>{risk.riskScore}</Badge>
                  </div>
                  {hasResidual && (
                    <>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">{t("residualScore")}:</span>
                        <Badge className={cn("ml-2 font-mono", scoreColor(residualScore ?? 0, maxScore))}>{residualScore}</Badge>
                        {residualBelow && <span className="ml-2 text-emerald-600 text-xs">{t("belowThreshold")}</span>}
                      </div>
                    </>
                  )}
                </div>

                {/* Treatment measures */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("treatmentMeasures")}</span>
                  {risk.treatments.map(tm => (
                    <div key={tm.id} className="flex items-center gap-2 py-1 pl-4 border-l-2 border-muted">
                      <StatusIcon status={tm.status} />
                      <span className="text-sm flex-1">{tm.action}</span>
                      {!disabled && (
                        <Select
                          value={tm.status}
                          onValueChange={(s) => updateTreatmentMut.mutate({ id: tm.id, status: s as typeof tm.status })}
                        >
                          <SelectTrigger className="w-32 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TREATMENT_STATUSES.map(s => (
                              <SelectItem key={s} value={s}>{t(`treatmentStatus.${s}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {!disabled && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => {
                            if (window.confirm(t("deleteConfirm"))) deleteTreatmentMut.mutate({ id: tm.id });
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Add treatment form */}
                  {addingTreatment === risk.id ? (
                    <AddTreatmentForm
                      riskId={risk.id}
                      onSave={(data) => {
                        createTreatmentMut.mutate(data, { onSuccess: () => setAddingTreatment(null) });
                      }}
                      onCancel={() => setAddingTreatment(null)}
                      isPending={createTreatmentMut.isPending}
                      disabled={disabled}
                    />
                  ) : !disabled && (
                    <Button variant="ghost" size="sm" className="ml-4" data-testid="treatment-add" onClick={() => setAddingTreatment(risk.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {t("addMeasure")}
                    </Button>
                  )}
                </div>

                {/* Residual risk matrix */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("residualScore")}</span>
                  {settingResidual === risk.id ? (
                    <div className="space-y-2">
                      <RiskMatrixPicker
                        likelihoodLevels={likelihoodLevels}
                        impactLevels={impactLevels}
                        selectedLikelihood={risk.residualLikelihood ?? undefined}
                        selectedImpact={risk.residualImpact ?? undefined}
                        onChange={(l, i) => {
                          updateRiskMut.mutate({ id: risk.id, residualLikelihood: l, residualImpact: i });
                          setSettingResidual(null);
                        }}
                        compact
                        disabled={disabled}
                      />
                      <Button variant="ghost" size="sm" onClick={() => setSettingResidual(null)}>{t("cancel")}</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" data-testid="residual-open" onClick={() => setSettingResidual(risk.id)} disabled={disabled}>
                      {hasResidual ? t("updateResidual") : t("setResidual")}
                    </Button>
                  )}
                </div>

                {/* Accept risk */}
                {residualBelow && !risk.acceptedAt && !disabled && (
                  <Button
                    size="sm"
                    data-testid="risk-accept"
                    onClick={() => updateRiskMut.mutate({ id: risk.id, acceptedAt: new Date() })}
                    disabled={updateRiskMut.isPending}
                  >
                    {updateRiskMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    {t("acceptRisk")}
                  </Button>
                )}
                {risk.acceptedAt && (
                  <div className="text-sm text-emerald-600 flex items-center gap-1">
                    <CircleCheck className="h-4 w-4" />
                    {t("riskAccepted", { date: new Date(risk.acceptedAt).toLocaleDateString() })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Below threshold / accepted */}
      {belowOrAccepted.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-muted-foreground">{t("acceptedRisks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {belowOrAccepted.map(r => (
              <div key={r.id} className="flex items-center gap-2 py-1.5">
                <span className="text-sm">{r.title}</span>
                <Badge className={cn("text-xs font-mono", scoreColor(r.riskScore, maxScore))}>{r.riskScore}</Badge>
                <Badge variant="outline" className="text-xs">{t(`treatment.${r.treatment}`)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(risks ?? []).length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("noRisksYet")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Treatment Form
// ---------------------------------------------------------------------------

function AddTreatmentForm({
  riskId, onSave, onCancel, isPending, disabled,
}: {
  riskId: string;
  onSave: (data: { riskId: string; action: string; description: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("risks");
  const [action, setAction] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="ml-4 p-3 border rounded-lg bg-muted/30 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">{t("measureAction")}</Label>
        <Input data-testid="treatment-action" value={action} onChange={e => setAction(e.target.value)} disabled={disabled} placeholder={t("measureActionPlaceholder")} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">{t("fields.description")}</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={disabled} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>{t("cancel")}</Button>
        <Button size="sm" data-testid="treatment-submit" onClick={() => onSave({ riskId, action, description })} disabled={!action || isPending || disabled}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("addMeasure")}
        </Button>
      </div>
    </div>
  );
}
