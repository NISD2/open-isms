"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/locale";

const LABEL = {
  de: "Zum NIS 2 Durchgang",
  en: "Open the NIS 2 walkthrough",
  cs: "Otevřít průvodce NIS 2",
} as const;

/**
 * Persistent link from the CEO course chrome into the walk. Its home takes everyone from where
 * they stand: a company not set up yet sets itself up there, an unpaid account sees the way to
 * order. Opens in a new tab so the learner keeps their place in the course.
 */
export function CoursePortalCta({ locale }: { locale: string }) {
  return (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <Link href="/durchgang/nis2" target="_blank" rel="noopener noreferrer">
        {pickLocalized<string>(LABEL, locale)}
        <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </Button>
  );
}
