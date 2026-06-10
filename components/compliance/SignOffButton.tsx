"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PenTool, Loader2 } from "lucide-react";

interface SignOffButtonProps {
  isSubmitting?: boolean;
  isBlocked?: boolean;
  onSignOff: () => void;
}

export function SignOffButton({ isSubmitting, isBlocked, onSignOff }: SignOffButtonProps) {
  const t = useTranslations("compliance");

  return (
    <Button
      variant="default"
      size="sm"
      disabled={isSubmitting || isBlocked}
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
