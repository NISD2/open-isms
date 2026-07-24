"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalkthroughTrigger({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
}
