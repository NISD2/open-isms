"use client";

import { Link } from "@/i18n/navigation";
import { Compass, ArrowRight } from "lucide-react";
import { JOURNEY_CATEGORY_LABEL } from "@/lib/training/lesson-journey-map";

interface JourneyLinkProps {
  /** NIS2 category code (e.g. "SUP"). Gating + lookup happen server-side. */
  category: string;
  locale: string;
}

/**
 * Inline link from a course lesson to the matching spot in the compliance
 * journey. The journey page reads ?focus=<category> and scrolls + highlights
 * that category's first step.
 */
export function JourneyLink({ category, locale }: JourneyLinkProps) {
  const de = locale === "de";
  const label = JOURNEY_CATEGORY_LABEL[category];
  const name = label ? (de ? label.de : label.en) : category;

  return (
    <Link
      href={{ pathname: "/journey", query: { focus: category } }}
      className="group mt-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm transition-colors hover:border-primary/60 hover:bg-primary/10"
    >
      <Compass aria-hidden className="size-4 shrink-0 text-primary" />
      <span className="text-muted-foreground">
        {de ? "Sehen Sie das in Ihrer Umsetzung: " : "See this in your journey: "}
        <span className="font-medium text-foreground">{name}</span>
      </span>
      <ArrowRight
        aria-hidden
        className="ml-auto size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
