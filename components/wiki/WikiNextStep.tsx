"use client";

import { ArrowRight, CalendarClock, MessageSquare, ShieldQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";

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

/**
 * The keys are deliberately new rather than reusing `scope` / `advice`.
 *
 * i18n/request.ts fills only MISSING keys from English, so a locale that still
 * holds its own `scope.cta` keeps it. Eight locales do, and all eight say some
 * version of "run the scope check". Reusing those keys would have shipped a
 * button reading "Faire le test d'applicabilité" that opens a request form, in
 * eight languages, because the translation looked present and was simply old.
 *
 * Fresh keys are absent everywhere, so every untranslated locale falls back to
 * the English written for this button. The stale `scope`, `timeline` and
 * `advice` blocks are now unreachable and should be deleted in a translation
 * pass. This is the same trap the tier1.p4 comment in the help page records.
 */
type Variant = "scopeHelp" | "stuckHelp" | "selfHostHelp";

/**
 * Every variant now ends at /hilfe. Two reasons, and the second one is the
 * one that made this a cleanup rather than an addition.
 *
 * The strip used to send most categories to /applicability. That check is an
 * "indikative Orientierungshilfe... keine Rechtsberatung und keine
 * verbindliche Feststellung" by its own disclaimer, so it cannot end the
 * question it is asked. The honest next step after "we cannot tell you
 * definitively" is the one that reaches somebody who can.
 *
 * And 36 wiki pages already carry their own hand-written card to
 * /applicability. While the strip pointed there too, those pages made the
 * same ask twice, which is the reliable way to get neither taken. The card
 * keeps the scope job. The strip takes the help job. One ask each.
 *
 * Categories without a card are unaffected by that second point and still
 * benefit from the first.
 */
const VARIANT_BY_CATEGORY: Record<string, Variant> = {
  // Still deciding whether this applies to them at all.
  anwendungsbereich: "scopeHelp",
  sektoren: "scopeHelp",
  grundlagen: "scopeHelp",
  "zeit-und-status": "scopeHelp",
  vergleich: "scopeHelp",
  // Doing the work and stuck in it.
  umsetzung: "stuckHelp",
  troubleshooting: "stuckHelp",
  "recht-und-folgen": "stuckHelp",
  // Running it themselves, so the offer is setup, not consulting.
  "open-source": "selfHostHelp",
};

const HREF = "/hilfe" as const;

const ICON = {
  scopeHelp: ShieldQuestion,
  stuckHelp: MessageSquare,
  selfHostHelp: CalendarClock,
} as const;

export function WikiNextStep() {
  const pathname = usePathname();
  const t = useTranslations("info.wikiNextStep");

  // "/wiki/<category>/<slug>" → segment 2. The hub and the category
  // indexes have no category segment and fall through to "scope", which
  // is the right ask for someone still browsing.
  const category = pathname.split("/")[2] ?? "";
  const variant = VARIANT_BY_CATEGORY[category] ?? "scopeHelp";

  // The whole path, not the category. "Which of the 151 pages produced this
  // request" is the question that prices a lead and decides what to write
  // next; "somebody was in the troubleshooting area" answers neither. The
  // leading slash is dropped so the stored value reads as a path and not as a
  // root-relative URL.
  const sourcePath = pathname.replace(/^\/+/, "").slice(0, 200);
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
        {/*
          The category rides along as ?from=, so the request form opens with
          the right topic selected and the stored row says which page produced
          it. Without it every request reads as "someone wants help", which is
          worth far less to the firm that receives it than "someone on the
          supply chain pages wants help".

          No hash: next-intl's Link has no `hash` prop and the typed pathname
          cannot carry one inline. It is not needed anyway, because the form is
          the first thing on /hilfe. If the page order is ever changed back,
          this button starts lying again and the fix belongs there, not here.
        */}
        <Link href={{ pathname: HREF, query: { from: sourcePath } }}>
          {t(`${variant}.cta`)}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </aside>
  );
}
