"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Lightbulb, FileCheck } from "lucide-react";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";
import { cn } from "@/lib/utils";

interface RequirementGuidanceProps {
  /** The requirement's own text, from messages/requirements/{locale}.json. */
  description: string;
  /** Pre-generated long-form guidance, from data/guidance/{locale}.json. */
  guidance: RequirementGuidanceData | null;
}

/**
 * Answers "what is this page asking me to do?" before the reader touches a
 * field.
 *
 * Both halves of this already existed and neither reached the screen: the
 * detail page resolved `requirement.description` and loaded the guidance file
 * for all 49 requirements, then passed the guidance only to the nine
 * requirements with a custom editor and dropped the description entirely. So
 * a reader landing on a requirement saw a title, a form, and no statement of
 * what was being asked.
 *
 * Distinct from `FieldGuidancePanel`, which explains one form field. This
 * explains the obligation.
 *
 * The steps are collapsed by default. Someone who knows the requirement wants
 * the form, not a wall of prose above it; someone who does not needs the
 * detail one click away rather than on another page.
 */
export function RequirementGuidance({ description, guidance }: RequirementGuidanceProps) {
  const t = useTranslations("compliance");
  const [open, setOpen] = useState(false);

  const steps = splitSteps(guidance?.implementationSteps);
  const hasDetail =
    steps.length > 0 || !!guidance?.evidenceExample || !!guidance?.quickTip;

  if (!description && !guidance) return null;

  return (
    <section data-testid="requirement-guidance" className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("requirement.whatSection")}
      </h2>

      {description && <p className="text-sm leading-relaxed">{description}</p>}

      {guidance?.summary && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {guidance.summary}
        </p>
      )}

      {guidance?.applicability && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {guidance.applicability}
        </p>
      )}

      {hasDetail && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            data-testid="requirement-guidance-toggle"
            className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
            {t("requirement.howSection")}
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 pt-3">
            {steps.length > 0 && (
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground marker:text-muted-foreground/60">
                {/* Keyed by position, not by text: the list is static and
                    never reordered, and two identically-worded steps in a
                    regenerated guidance file would collide on a text key. */}
                {steps.map((step, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: see above — steps are ordered, never reordered, and two identically-worded steps would collide on a text key
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            )}

            {guidance?.evidenceExample && (
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <FileCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <span>
                  <span className="font-medium text-foreground">
                    {t("requirement.evidenceSection")}:
                  </span>{" "}
                  {guidance.evidenceExample}
                </span>
              </p>
            )}

            {guidance?.quickTip && (
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{guidance.quickTip}</span>
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}

/**
 * `implementationSteps` is one newline-separated string in the guidance
 * files, not an array. Splitting here keeps that storage detail out of the
 * markup and drops the blank lines a generated file tends to carry.
 */
function splitSteps(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
