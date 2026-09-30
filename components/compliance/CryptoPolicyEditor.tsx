"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";
import type { CryptoAlgorithmEntry } from "@/lib/compliance/policy-config-defaults";
import { cn } from "@/lib/utils";
import { PolicyEditorShell, SectionGuidance } from "./PolicyEditorShell";
import { usePolicyEditor } from "./usePolicyEditor";

const STATUS_COLORS = {
  approved: "text-emerald-600 dark:text-emerald-400",
  deprecated: "text-amber-600 dark:text-amber-400",
  prohibited: "text-red-600 dark:text-red-400",
} as const;

export function CryptoPolicyEditor({
  disabled,
  guidance,
  initialData,
}: {
  disabled?: boolean;
  guidance?: RequirementGuidanceData | null;
  initialData?: Record<string, unknown> | null;
}) {
  const tc = useTranslations("policyConfig.crypto");
  const editor = usePolicyEditor("crypto", initialData);
  const { display, draft, setDraft } = editor;
  const fieldsDisabled = disabled || !editor.isEditing;

  const CATEGORY_LABELS: Record<string, string> = {
    symmetric: tc("symmetric"),
    hash: tc("hash"),
    asymmetric: tc("asymmetric"),
    key_exchange: tc("keyExchange"),
    tls: tc("tls"),
  };

  function updateAlgorithm(
    idx: number,
    field: keyof CryptoAlgorithmEntry,
    value: string,
  ) {
    if (!draft) return;
    setDraft({
      ...draft,
      algorithms: draft.algorithms.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a,
      ),
    });
  }

  function addAlgorithm() {
    if (!draft) return;
    setDraft({
      ...draft,
      algorithms: [
        ...draft.algorithms,
        { category: "symmetric" as const, algorithm: "", status: "approved" as const },
      ],
    });
  }

  function removeAlgorithm(idx: number) {
    if (!draft) return;
    setDraft({
      ...draft,
      algorithms: draft.algorithms.filter((_, i) => i !== idx),
    });
  }

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
      {/* Algorithm Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{tc("algorithms")}</h3>
        <SectionGuidance guidance={guidance} fieldKey="algorithms" />
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {tc("category")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {tc("algorithm")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {tc("keyLength")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {tc("status")}
                </th>
                {!fieldsDisabled && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {display.algorithms.map((alg, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: rows are edited in place; a key built from their content would remount the row on every keystroke
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">
                    {fieldsDisabled ? (
                      <span className="text-muted-foreground">
                        {CATEGORY_LABELS[alg.category]}
                      </span>
                    ) : (
                      <Select
                        value={alg.category}
                        onValueChange={(v) => updateAlgorithm(idx, "category", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={alg.algorithm}
                      onChange={(e) => updateAlgorithm(idx, "algorithm", e.target.value)}
                      disabled={fieldsDisabled}
                      className="h-8"
                      maxLength={100}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={alg.keyLength ?? ""}
                      onChange={(e) => updateAlgorithm(idx, "keyLength", e.target.value)}
                      disabled={fieldsDisabled}
                      className="h-8"
                      maxLength={50}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {fieldsDisabled ? (
                      <span
                        className={cn("text-xs font-medium", STATUS_COLORS[alg.status])}
                      >
                        {tc(alg.status)}
                      </span>
                    ) : (
                      <Select
                        value={alg.status}
                        onValueChange={(v) => updateAlgorithm(idx, "status", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">{tc("approved")}</SelectItem>
                          <SelectItem value="deprecated">{tc("deprecated")}</SelectItem>
                          <SelectItem value="prohibited">{tc("prohibited")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  {!fieldsDisabled && (
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlgorithm(idx)}
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
          <Button type="button" variant="outline" size="sm" onClick={addAlgorithm}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {tc("addAlgorithm")}
          </Button>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <SectionGuidance guidance={guidance} fieldKey="minTlsVersion" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="crypto-min-tls" className="text-sm font-medium">
              {tc("minTlsVersion")}
            </label>
            <Select
              value={display.minTlsVersion}
              onValueChange={(v) =>
                draft && setDraft({ ...draft, minTlsVersion: v as "tls_1_2" | "tls_1_3" })
              }
              disabled={fieldsDisabled}
            >
              <SelectTrigger id="crypto-min-tls">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tls_1_2">TLS 1.2</SelectItem>
                <SelectItem value="tls_1_3">TLS 1.3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crypto-key-rotation" className="text-sm font-medium">
              {tc("keyRotation")}
            </label>
            <Input
              id="crypto-key-rotation"
              type="number"
              data-testid="crypto-key-rotation"
              min={1}
              max={10}
              value={display.keyRotationFrequencyYears}
              onChange={(e) =>
                draft &&
                setDraft({
                  ...draft,
                  keyRotationFrequencyYears: Number(e.target.value) || 1,
                })
              }
              disabled={fieldsDisabled}
              className="max-w-24"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crypto-review-cycle" className="text-sm font-medium">
              {tc("reviewCycle")}
            </label>
            <Input
              id="crypto-review-cycle"
              type="number"
              min={1}
              max={10}
              value={display.reviewCycleYears}
              onChange={(e) =>
                draft &&
                setDraft({ ...draft, reviewCycleYears: Number(e.target.value) || 1 })
              }
              disabled={fieldsDisabled}
              className="max-w-24"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionGuidance guidance={guidance} fieldKey="keyRotation" />
        <div className="flex items-center gap-2">
          <Checkbox
            id="crypto-trigger-on-compromise"
            checked={display.triggerRotationOnCompromise}
            onCheckedChange={(v) =>
              draft && setDraft({ ...draft, triggerRotationOnCompromise: !!v })
            }
            disabled={fieldsDisabled}
          />
          <label htmlFor="crypto-trigger-on-compromise" className="text-sm">
            {tc("triggerOnCompromise")}
          </label>
        </div>
        <SectionGuidance guidance={guidance} fieldKey="postQuantumReadiness" />
        <div className="flex items-center gap-2">
          <Checkbox
            id="crypto-post-quantum"
            checked={display.postQuantumReadiness}
            onCheckedChange={(v) =>
              draft && setDraft({ ...draft, postQuantumReadiness: !!v })
            }
            disabled={fieldsDisabled}
          />
          <label htmlFor="crypto-post-quantum" className="text-sm">
            {tc("postQuantum")}
          </label>
        </div>
      </div>
    </PolicyEditorShell>
  );
}
