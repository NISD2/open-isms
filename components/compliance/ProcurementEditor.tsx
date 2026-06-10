"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { usePolicyEditor } from "./usePolicyEditor";
import { PolicyEditorShell, SectionGuidance } from "./PolicyEditorShell";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";

const CLAUSE_KEYS = [
  "cybersecurityRequirements",
  "trainingCertification",
  "backgroundChecks",
  "incidentNotification",
  "auditRights",
  "vulnerabilityDisclosure",
  "subcontractorFlowdown",
  "secureDecommissioning",
] as const;

export function ProcurementEditor({ disabled, guidance, initialData }: { disabled?: boolean; guidance?: RequirementGuidanceData | null; initialData?: Record<string, unknown> | null }) {
  const tc = useTranslations("policyConfig.procurement");
  const editor = usePolicyEditor("procurement", initialData);
  const { display, draft, setDraft } = editor;
  const fieldsDisabled = disabled || !editor.isEditing;

  if (!display) return null;

  return (
    <PolicyEditorShell
      title={tc("title")}
      disabled={disabled}
      guidance={guidance}
      onEdit={editor.startEditing}
      onSave={editor.save}
      onCancel={editor.cancel}
      isLoading={editor.isLoading}
      hasData={editor.hasData}
      isEditing={editor.isEditing}
      isPending={editor.isPending}
    >
      {/* Threshold */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tc("threshold")}</label>
        <SectionGuidance guidance={guidance} fieldKey="threshold" />
        <Input
          type="number"
          min={0}
          value={display.thresholdEur}
          onChange={(e) => draft && setDraft({ ...draft, thresholdEur: Number(e.target.value) || 0 })}
          disabled={fieldsDisabled}
          className="max-w-40"
        />
      </div>

      {/* Required Contract Clauses */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{tc("requiredClauses")}</h3>
        <SectionGuidance guidance={guidance} fieldKey="requiredClauses" />
        <div className="space-y-2">
          {CLAUSE_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                checked={display.requiredClauses[key]}
                onCheckedChange={(v) =>
                  draft && setDraft({
                    ...draft,
                    requiredClauses: { ...draft.requiredClauses, [key]: !!v },
                  })
                }
                disabled={fieldsDisabled}
              />
              <label className="text-sm">{tc(key)}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Clauses */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{tc("customClauses")}</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="w-10 px-3 py-2" />
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{tc("clauseLabel")}</th>
                {!fieldsDisabled && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {display.customClauses.map((cc, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={cc.enabled}
                      onCheckedChange={(v) =>
                        draft && setDraft({
                          ...draft,
                          customClauses: draft.customClauses.map((c, i) =>
                            i === idx ? { ...c, enabled: !!v } : c,
                          ),
                        })
                      }
                      disabled={fieldsDisabled}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={cc.clause}
                      onChange={(e) =>
                        draft && setDraft({
                          ...draft,
                          customClauses: draft.customClauses.map((c, i) =>
                            i === idx ? { ...c, clause: e.target.value } : c,
                          ),
                        })
                      }
                      disabled={fieldsDisabled}
                      className="h-8"
                      maxLength={500}
                    />
                  </td>
                  {!fieldsDisabled && (
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          draft && setDraft({
                            ...draft,
                            customClauses: draft.customClauses.filter((_, i) => i !== idx),
                          })
                        }
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!fieldsDisabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              draft && setDraft({
                ...draft,
                customClauses: [...draft.customClauses, { clause: "", enabled: true }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {tc("addClause")}
          </Button>
        )}
      </div>

      {/* Evaluation Criteria */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{tc("evaluationCriteria")}</h3>
        <SectionGuidance guidance={guidance} fieldKey="evaluationCriteria" />
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{tc("criterion")}</th>
                <th className="w-24 px-3 py-2 text-left font-medium text-muted-foreground">{tc("weight")}</th>
                {!fieldsDisabled && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {display.evaluationCriteria.map((crit, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">
                    <Input
                      value={crit.criterion}
                      onChange={(e) =>
                        draft && setDraft({
                          ...draft,
                          evaluationCriteria: draft.evaluationCriteria.map((c, i) =>
                            i === idx ? { ...c, criterion: e.target.value } : c,
                          ),
                        })
                      }
                      disabled={fieldsDisabled}
                      className="h-8"
                      maxLength={500}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={crit.weight}
                      onChange={(e) =>
                        draft && setDraft({
                          ...draft,
                          evaluationCriteria: draft.evaluationCriteria.map((c, i) =>
                            i === idx ? { ...c, weight: Number(e.target.value) || 0 } : c,
                          ),
                        })
                      }
                      disabled={fieldsDisabled}
                      className="h-8"
                    />
                  </td>
                  {!fieldsDisabled && (
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          draft && setDraft({
                            ...draft,
                            evaluationCriteria: draft.evaluationCriteria.filter((_, i) => i !== idx),
                          })
                        }
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!fieldsDisabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              draft && setDraft({
                ...draft,
                evaluationCriteria: [...draft.evaluationCriteria, { criterion: "", weight: 0 }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {tc("addCriterion")}
          </Button>
        )}
      </div>

      {/* Review Frequency */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tc("reviewFrequency")}</label>
        <SectionGuidance guidance={guidance} fieldKey="reviewFrequency" />
        <Input
          value={display.reviewFrequency}
          onChange={(e) => draft && setDraft({ ...draft, reviewFrequency: e.target.value })}
          disabled={fieldsDisabled}
          className="max-w-xs"
          maxLength={100}
        />
      </div>
    </PolicyEditorShell>
  );
}
