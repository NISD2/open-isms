"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import type { QuestionStep as QuestionStepData } from "@/lib/asset-inventory/types";
import { cn } from "@/lib/utils";

interface QuestionStepProps {
  step: QuestionStepData;
  selected: string[];
  onChange: (next: string[]) => void;
}

export function QuestionStep({ step, selected, onChange }: QuestionStepProps) {
  const t = useTranslations("assetInventory");

  function toggle(optionId: string) {
    if (selected.includes(optionId)) {
      onChange(selected.filter((id) => id !== optionId));
    } else {
      onChange([...selected, optionId]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold leading-tight">
          {t(`questions.${step.id}.question`)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(`questions.${step.id}.helpText`)}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {step.options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              <span className="text-sm leading-snug">
                {t(`questions.${step.id}.options.${option.id}`)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground italic">
        {t("questions.gruppenbildungHint")}
      </p>
    </div>
  );
}
