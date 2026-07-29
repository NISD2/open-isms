"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePolicyEditor } from "./usePolicyEditor";
import { PolicyEditorShell, SectionGuidance } from "./PolicyEditorShell";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";

export function AccessControlEditor({ disabled, guidance, initialData }: { disabled?: boolean; guidance?: RequirementGuidanceData | null; initialData?: Record<string, unknown> | null }) {
  const tc = useTranslations("policyConfig.accessControl");
  const editor = usePolicyEditor("access_control", initialData);
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
      {/* Access Control Model — CIR 11.1.1 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tc("model")}</label>
        <SectionGuidance guidance={guidance} fieldKey="accessModel" />
        <Select
          value={display.model}
          onValueChange={(v) => draft && setDraft({ ...draft, model: v as "rbac" | "abac" | "hybrid" })}
          disabled={fieldsDisabled}
        >
          <SelectTrigger className="max-w-xs" data-testid="access-model-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rbac">{tc("rbac")}</SelectItem>
            <SelectItem value="abac">{tc("abac")}</SelectItem>
            <SelectItem value="hybrid">{tc("hybrid")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review Frequency — CIR 11.2.3, ORP.4.A4 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{tc("reviewFrequency")}</h3>
        <SectionGuidance guidance={guidance} fieldKey="reviewFrequency" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">{tc("standardReview")}</label>
            <Input
              data-testid="access-review-standard"
              value={display.reviewFrequency.standard}
              onChange={(e) =>
                draft && setDraft({
                  ...draft,
                  reviewFrequency: { ...draft.reviewFrequency, standard: e.target.value },
                })
              }
              disabled={fieldsDisabled}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">{tc("privilegedReview")}</label>
            <Input
              data-testid="access-review-privileged"
              value={display.reviewFrequency.privileged}
              onChange={(e) =>
                draft && setDraft({
                  ...draft,
                  reviewFrequency: { ...draft.reviewFrequency, privileged: e.target.value },
                })
              }
              disabled={fieldsDisabled}
              maxLength={100}
            />
          </div>
        </div>
      </div>

      {/* De-provisioning SLA — CIR 11.2.1, ORP.4.A6 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tc("deprovisioningSla")}</label>
        <SectionGuidance guidance={guidance} fieldKey="deprovisioningSla" />
        <Input
          type="number"
          min={1}
          max={720}
          value={display.deprovisioningSlaHours}
          onChange={(e) => draft && setDraft({ ...draft, deprovisioningSlaHours: Number(e.target.value) || 24 })}
          disabled={fieldsDisabled}
          className="max-w-24"
        />
      </div>

      {/* Shared Account Policy — CIR 11.5.3, ORP.4.A3 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tc("sharedAccountPolicy")}</label>
        <Select
          value={display.sharedAccountPolicy}
          onValueChange={(v) => draft && setDraft({ ...draft, sharedAccountPolicy: v as "prohibited" | "documented_exceptions" })}
          disabled={fieldsDisabled}
        >
          <SelectTrigger className="max-w-xs" data-testid="shared-account-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="prohibited">{tc("sharedProhibited")}</SelectItem>
            <SelectItem value="documented_exceptions">{tc("sharedDocumentedExceptions")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auth Review Cycle — CIR 11.6.4 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{tc("authReviewCycle")}</label>
        <Input
          type="number"
          min={1}
          max={10}
          value={display.authReviewCycleYears}
          onChange={(e) => draft && setDraft({ ...draft, authReviewCycleYears: Number(e.target.value) || 2 })}
          disabled={fieldsDisabled}
          className="max-w-24"
        />
      </div>
    </PolicyEditorShell>
  );
}
