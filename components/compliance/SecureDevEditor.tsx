"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePolicyEditor } from "./usePolicyEditor";
import { PolicyEditorShell, SectionGuidance } from "./PolicyEditorShell";
import type { SecureDevConfig } from "@/lib/compliance/policy-config-defaults";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";

const TESTING_KEYS = ["sast", "dast", "sca", "pentest", "codeReview"] as const;

export function SecureDevEditor({ disabled, guidance, initialData }: { disabled?: boolean; guidance?: RequirementGuidanceData | null; initialData?: Record<string, unknown> | null }) {
  const tc = useTranslations("policyConfig.secureDev");
  const editor = usePolicyEditor("secure_dev", initialData);
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
      {/* Framework & Baseline */}
      <div className="space-y-2">
        <SectionGuidance guidance={guidance} fieldKey="sdlcFramework" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{tc("sdlcFramework")}</label>
            <Select
              value={display.sdlcFramework}
              onValueChange={(v) =>
                draft && setDraft({ ...draft, sdlcFramework: v as SecureDevConfig["sdlcFramework"] })
              }
              disabled={fieldsDisabled}
            >
              <SelectTrigger data-testid="sdlc-framework-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owasp_samm">{tc("owaspSamm")}</SelectItem>
                <SelectItem value="bsimm">{tc("bsimm")}</SelectItem>
                <SelectItem value="ms_sdl">{tc("msSdl")}</SelectItem>
                <SelectItem value="custom">{tc("custom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{tc("hardeningBaseline")}</label>
            <Select
              value={display.hardeningBaseline}
              onValueChange={(v) =>
                draft && setDraft({ ...draft, hardeningBaseline: v as SecureDevConfig["hardeningBaseline"] })
              }
              disabled={fieldsDisabled}
            >
              <SelectTrigger data-testid="hardening-baseline-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cis">{tc("cis")}</SelectItem>
                <SelectItem value="bsi">{tc("bsi")}</SelectItem>
                <SelectItem value="disa_stig">{tc("disaStig")}</SelectItem>
                <SelectItem value="custom">{tc("custom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Testing Requirements */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{tc("testingRequirements")}</h3>
        <SectionGuidance guidance={guidance} fieldKey="testingRequirements" />
        <div className="space-y-2">
          {TESTING_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                checked={display.testingRequirements[key]}
                onCheckedChange={(v) =>
                  draft && setDraft({
                    ...draft,
                    testingRequirements: { ...draft.testingRequirements, [key]: !!v },
                  })
                }
                disabled={fieldsDisabled}
              />
              <label className="text-sm">{tc(key)}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Segregation — CIR 6(2) */}
      <div className="flex items-center gap-2">
        <Checkbox
          data-testid="environment-segregation"
          checked={display.environmentSegregation}
          onCheckedChange={(v) =>
            draft && setDraft({ ...draft, environmentSegregation: !!v })
          }
          disabled={fieldsDisabled}
        />
        <label className="text-sm font-medium">{tc("environmentSegregation")}</label>
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
