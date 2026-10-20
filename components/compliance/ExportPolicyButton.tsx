"use client";

import { FileDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useBillingAct } from "@/components/billing/BillingActGate";
import { Button } from "@/components/ui/button";

interface ExportPolicyButtonProps {
  assessmentId: string;
  categoryCode: string;
  disabled?: boolean;
}

/**
 * A policy as PDF: an export, so it asks first where the billing state says so (AGB B7, B10). The
 * file comes as a download, so the page stays; a new window would be blocked after the dialog.
 */
export function ExportPolicyButton({
  assessmentId,
  categoryCode,
  disabled,
}: ExportPolicyButtonProps) {
  const t = useTranslations("compliance");
  const locale = useLocale();
  const { guard, dialog } = useBillingAct("export");

  function handleExport() {
    if (disabled) return;
    const params = new URLSearchParams({
      assessmentId,
      categoryCode,
      locale,
    });
    guard(() => window.location.assign(`/api/export/policy?${params}`));
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleExport} disabled={disabled}>
        <FileDown className="mr-1.5 h-4 w-4" />
        {t("exportPolicy")}
      </Button>
      {dialog}
    </>
  );
}
