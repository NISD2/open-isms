"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, CalendarClock, MessageSquare, ShieldQuestion } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * The "what now?" strip under every wiki page.
 *
 * Rendered once from app/[locale]/wiki/layout.tsx so a new page cannot
 * ship without a next step. Before this existed the CTA was hand-written
 * per page and coverage ran inverse to traffic: zeit-und-status (45% of
 * wiki traffic, 756 visitors/month) carried one CTA across 32 pages,
 * while troubleshooting (0.8% of traffic) carried six across eight.
 *
 * The variant is picked from the canonical category segment. next-intl's
 * usePathname() returns the INTERNAL pathname — the German-key form —
 * whatever locale is being viewed, so matching on the WIKI_TOP_LEVEL
 * keys works in all ten locales without pulling the 1,196-line TOC into
 * the client bundle.
 */

type Variant = "timeline" | "advice" | "scope";

/**
 * Categories whose pages already carry a bespoke, page-specific CTA card
 * to /applicability (troubleshooting 6 of 8 pages, recht-und-folgen 6 of
 * 9) send the strip to /start instead, so it complements the card above
 * it rather than repeating the same ask twice.
 */
const VARIANT_BY_CATEGORY: Record<string, Variant> = {
  "zeit-und-status": "timeline",
  troubleshooting: "advice",
  "recht-und-folgen": "advice",
};

const HREF = {
  timeline: "/applicability",
  scope: "/applicability",
  advice: "/start",
} as const;

const ICON = {
  timeline: CalendarClock,
  scope: ShieldQuestion,
  advice: MessageSquare,
} as const;

export function WikiNextStep() {
  const pathname = usePathname();
  const t = useTranslations("info.wikiNextStep");

  // "/wiki/<category>/<slug>" → segment 2. The hub and the category
  // indexes have no category segment and fall through to "scope", which
  // is the right ask for someone still browsing.
  const category = pathname.split("/")[2] ?? "";
  const variant = VARIANT_BY_CATEGORY[category] ?? "scope";
  const Icon = ICON[variant];

  return (
    <aside
      className="mt-10 flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="wiki-next-step-heading"
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <p id="wiki-next-step-heading" className="text-sm font-semibold">
            {t(`${variant}.heading`)}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`${variant}.body`)}
          </p>
        </div>
      </div>
      <Button asChild className="shrink-0 self-start sm:self-auto">
        <Link href={HREF[variant]}>
          {t(`${variant}.cta`)}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </aside>
  );
}
