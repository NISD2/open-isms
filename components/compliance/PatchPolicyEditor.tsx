"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { usePolicyEditor } from "./usePolicyEditor";
import { PolicyEditorShell, SectionGuidance } from "./PolicyEditorShell";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";

const SEVERITY_KEYS = ["critical", "high", "medium", "low"] as const;

export function PatchPolicyEditor({ disabled, guidance, initialData }: { disabled?: boolean; guidance?: RequirementGuidanceData | null; initialData?: Record<string, unknown> | null }) {
  const tc = useTranslations("policyConfig.patchMgmt");
  const editor = usePolicyEditor("patch_mgmt", initialData);
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
      {/* Patch SLA by Severity (hours) */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{tc("patchSla")}</h3>
        <SectionGuidance guidance={guidance} fieldKey="patchSla" />
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-1/3">{tc("severity")}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{tc("slaHours")}</th>
              </tr>
            </thead>
            <tbody>
              {SEVERITY_KEYS.map((sev) => (
                <tr key={sev} className="border-t">
                  <td className="px-3 py-2 text-muted-foreground font-medium">{tc(sev)}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      max={8760}
                      value={display.patchSlaHours[sev]}
                      onChange={(e) =>
                        draft && setDraft({
                          ...draft,
                          patchSlaHours: { ...draft.patchSlaHours, [sev]: Number(e.target.value) || 24 },
                        })
                      }
                      disabled={fieldsDisabled}
                      className="h-8 max-w-28"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Cycle */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tc("reviewCycle")}</label>
        <Input
          type="number"
          min={1}
          max={10}
          value={display.reviewCycleYears}
          onChange={(e) => draft && setDraft({ ...draft, reviewCycleYears: Number(e.target.value) || 2 })}
          disabled={fieldsDisabled}
          className="max-w-24"
        />
      </div>
    </PolicyEditorShell>
  );
}
