"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface ExportPolicyButtonProps {
  assessmentId: string;
  categoryCode: string;
  disabled?: boolean;
}

export function ExportPolicyButton({
  assessmentId,
  categoryCode,
  disabled,
}: ExportPolicyButtonProps) {
  const t = useTranslations("compliance");
  const locale = useLocale();

  function handleExport() {
    if (disabled) return;
    const params = new URLSearchParams({
      assessmentId,
      categoryCode,
      locale,
    });
    window.open(`/api/export/policy?${params}`, "_blank");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={disabled}>
      <FileDown className="mr-1.5 h-4 w-4" />
      {t("exportPolicy")}
    </Button>
  );
}
