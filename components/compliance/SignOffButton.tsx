"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PenTool, Loader2 } from "lucide-react";

interface SignOffButtonProps {
  isSubmitting?: boolean;
  onSignOff: () => void;
}

export function SignOffButton({ isSubmitting, onSignOff }: SignOffButtonProps) {
  const t = useTranslations("compliance");

  return (
    <Button
      variant="default"
      size="sm"
      disabled={isSubmitting}
      onClick={() => onSignOff()}
    >
      {isSubmitting ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <PenTool className="mr-1.5 h-3.5 w-3.5" />
      )}
      {t("signOff")}
    </Button>
  );
}
