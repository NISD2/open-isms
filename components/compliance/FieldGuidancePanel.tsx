"use client";

import { Lightbulb, Search } from "lucide-react";
import type { FieldGuidance } from "@/lib/ai/guidance-types";

interface FieldGuidancePanelProps {
  guidance: FieldGuidance;
}

export function FieldGuidancePanel({ guidance }: FieldGuidancePanelProps) {
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>{guidance.meaning}</p>

      {guidance.example && (
        <div className="flex items-start gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
          <span>
            <span className="font-medium text-foreground">e.g.</span>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {guidance.example}
            </code>
          </span>
        </div>
      )}

      {guidance.whereToFind && (
        <div className="flex items-start gap-1.5">
          <Search className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
          <span>{guidance.whereToFind}</span>
        </div>
      )}
    </div>
  );
}
