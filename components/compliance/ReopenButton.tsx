"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Undo2, Loader2 } from "lucide-react";

interface ReopenButtonProps {
  isSubmitting?: boolean;
  onReopen: () => void;
}

/**
 * Withdraws a sign-off, or an out-of-scope decision, and puts the
 * requirement back into editing.
 *
 * The counterpart to `SignOffButton`, and confirmed where that one is not:
 * signing is additive and reversible by this button, whereas reopening
 * discards the current attestation, so it asks first. The dialog says what is
 * kept as much as what is lost — the history entry survives, which is the
 * part people worry about before clicking.
 */
export function ReopenButton({ isSubmitting, onReopen }: ReopenButtonProps) {
  const t = useTranslations("compliance");
  const tc = useTranslations("common");

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="reopen-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Undo2 className="mr-1.5 h-3.5 w-3.5" />
          )}
          {t("reopen")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("reopenTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("reopenDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            data-testid="reopen-confirm"
            disabled={isSubmitting}
            onClick={onReopen}
          >
            {t("confirmReopen")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
