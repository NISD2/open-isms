"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Save } from "lucide-react";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";
import { FieldGuidancePanel } from "./FieldGuidancePanel";

interface PolicyEditorShellProps {
  title: string;
  isLoading: boolean;
  hasData: boolean;
  isEditing: boolean;
  isPending: boolean;
  disabled?: boolean;
  guidance?: RequirementGuidanceData | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

/**
 * Shared shell for all policy config editors.
 * Handles loading state, header with edit/save/cancel buttons.
 */
export function PolicyEditorShell({
  title,
  isLoading,
  hasData,
  isEditing,
  isPending,
  disabled,
  onEdit,
  onSave,
  onCancel,
  children,
}: PolicyEditorShellProps) {
  const t = useTranslations("policyConfig");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!hasData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {!disabled &&
          (isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="policy-editor-cancel" onClick={onCancel}>
                {t("cancel")}
              </Button>
              <Button size="sm" data-testid="policy-editor-save" onClick={onSave} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t("save")}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" data-testid="policy-editor-edit" onClick={onEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t("edit")}
            </Button>
          ))}
      </div>
      {children}
    </div>
  );
}

/**
 * Inline guidance hint for a specific editor section.
 * Renders the FieldGuidancePanel if guidance exists for the given key.
 */
export function SectionGuidance({
  // guidance,
  // fieldKey,
}: {
  guidance?: RequirementGuidanceData | null;
  fieldKey: string;
}) {
  // Field guidance disabled
  return null;
  // const fg = guidance?.fields[fieldKey];
  // if (!fg) return null;
  // return (
  //   <div className="rounded-md bg-muted/40 p-3">
  //     <FieldGuidancePanel guidance={fg} />
  //   </div>
  // );
}
