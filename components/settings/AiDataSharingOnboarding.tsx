"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AiDataSharingCards } from "./AiDataSharingCards";
import type { AiDataSharingLevel } from "@/lib/ai/build-context";

interface AiDataSharingOnboardingProps {
  value: AiDataSharingLevel;
  onChange: (level: AiDataSharingLevel) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function AiDataSharingOnboarding({
  value,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
}: AiDataSharingOnboardingProps) {
  const t = useTranslations("settings.aiDataSharing");
  const tNav = useTranslations("onboarding.nav");

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      <AiDataSharingCards
        value={value}
        onChange={onChange}
        disabled={isSubmitting}
        idPrefix="onboarding-ai"
      />

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          {tNav("back")}
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {tNav("submit")}
        </Button>
      </div>
    </div>
  );
}
