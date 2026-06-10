"use client";

import { useTranslations } from "next-intl";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiDataSharingLevel } from "@/lib/ai/build-context";

const LEVELS: AiDataSharingLevel[] = ["none", "basic", "full"];

const LEVEL_ICONS = {
  none: EyeOff,
  basic: Eye,
  full: Sparkles,
} as const;

function isAiDataSharingLevel(value: string): value is AiDataSharingLevel {
  return value === "none" || value === "basic" || value === "full";
}

interface AiDataSharingCardsProps {
  value: AiDataSharingLevel;
  onChange: (level: AiDataSharingLevel) => void;
  disabled?: boolean;
  idPrefix: string;
}

export function AiDataSharingCards({
  value,
  onChange,
  disabled,
  idPrefix,
}: AiDataSharingCardsProps) {
  const t = useTranslations("settings.aiDataSharing");

  function handleValueChange(newValue: string) {
    if (isAiDataSharingLevel(newValue)) {
      onChange(newValue);
    }
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
      className="gap-3"
    >
      {LEVELS.map((level) => {
        const Icon = LEVEL_ICONS[level];
        const isSelected = value === level;

        return (
          <label key={level} htmlFor={`${idPrefix}-${level}`}>
            <Card
              className={cn(
                "cursor-pointer transition-colors",
                isSelected && "border-primary bg-primary/5",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <RadioGroupItem value={level} id={`${idPrefix}-${level}`} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{t(`${level}.label`)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t(`${level}.description`)}
                  </p>
                  <Badge variant="secondary" className="font-normal text-xs">
                    {t(`${level}.preview`)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </label>
        );
      })}
    </RadioGroup>
  );
}
