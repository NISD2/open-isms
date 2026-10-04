"use client";

import { ArrowRight, Footprints } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface WalkLinkProps {
  /** The walk item's code (e.g. "5.1"). Lookup happens server-side. */
  code: string;
  /** The walk's own headline of that item. */
  headline: string;
  locale: string;
}

/**
 * Inline link from a course lesson to the walk item where the lesson is put into practice. Opens
 * in a new tab so the learner keeps their place in the course.
 */
export function WalkLink({ code, headline, locale }: WalkLinkProps) {
  const de = locale === "de";

  return (
    <Link
      href={{ pathname: "/durchgang/nis2/[code]", params: { code } }}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm transition-colors hover:border-primary/60 hover:bg-primary/10"
    >
      <Footprints aria-hidden className="size-4 shrink-0 text-primary" />
      <span className="text-muted-foreground">
        {de ? "Im Durchgang: " : "In the walkthrough: "}
        <span className="font-medium text-foreground">{headline}</span>
      </span>
      <ArrowRight
        aria-hidden
        className="ml-auto size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
