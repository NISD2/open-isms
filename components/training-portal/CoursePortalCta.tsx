"use client";

import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoursePortalCtaProps {
  /** Whether the viewer has an onboarded company (decides the destination). */
  hasCompany: boolean;
  locale: string;
}

/**
 * Persistent link from the CEO course chrome into the compliance product.
 * Onboarded users go straight to their journey; everyone else starts onboarding.
 * Opens in a new tab so the learner keeps their place in the course.
 */
export function CoursePortalCta({ hasCompany, locale }: CoursePortalCtaProps) {
  const de = locale === "de";
  const href = hasCompany ? "/journey" : "/onboarding";
  const label = hasCompany
    ? de
      ? "Zur NIS2-Umsetzung"
      : "Open your journey"
    : de
      ? "NIS2-Umsetzung starten"
      : "Start your NIS2 compliance";

  return (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {label}
        <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </Button>
  );
}
