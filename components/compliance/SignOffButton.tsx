"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PenTool, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignOffButtonProps {
  isSubmitting?: boolean;
  /**
   * Why this person cannot sign off, ready to show. Undefined means they can.
   *
   * The caller decides, because the reason is a domain fact (who is still
   * expected to sign) rather than anything the button can see. Passing the
   * finished sentence keeps this component presentational.
   */
  disabledReason?: string;
  onSignOff: () => void;
}

export function SignOffButton({
  isSubmitting,
  disabledReason,
  onSignOff,
}: SignOffButtonProps) {
  const t = useTranslations("compliance");
  const blocked = Boolean(disabledReason);

  // `aria-disabled` rather than `disabled` for the blocked case. A truly
  // disabled button takes neither focus nor pointer events, so it cannot host
  // the tooltip that says why it is blocked — which would leave the reason
  // reachable by mouse hover only, or not at all. This keeps the control
  // focusable and announced as disabled, and the handler refuses the click.
  const button = (
    <Button
      variant="default"
      size="sm"
      data-testid="sign-off-button"
      disabled={isSubmitting}
      aria-disabled={blocked || undefined}
      className={cn(blocked && "opacity-50")}
      onClick={() => {
        if (!blocked) onSignOff();
      }}
    >
      {isSubmitting ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <PenTool className="mr-1.5 h-3.5 w-3.5" />
      )}
      {t("signOff")}
    </Button>
  );

  if (!blocked) return button;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {disabledReason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
