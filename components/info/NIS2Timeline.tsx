"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  TimelineEvent,
  TimelineSource,
  TimelineCategory,
} from "@/lib/timeline/schema";

interface NIS2TimelineProps {
  events: TimelineEvent[];
  sources: TimelineSource[];
  lastUpdated: string;
}

const CATEGORIES: {
  key: TimelineCategory | "all";
  en: string;
  de: string;
}[] = [
  { key: "all", en: "All", de: "Alle" },
  { key: "eu", en: "EU", de: "EU" },
  { key: "de", en: "Germany", de: "Deutschland" },
  {
    key: "national-transposition",
    en: "Other Member States",
    de: "Andere Mitgliedstaaten",
  },
  { key: "cir", en: "CIR 2024/2690", de: "CIR 2024/2690" },
  { key: "grundschutz", en: "IT-Grundschutz", de: "IT-Grundschutz" },
  { key: "enisa", en: "ENISA", de: "ENISA" },
  { key: "market", en: "Market", de: "Markt" },
];

const CATEGORY_COLORS: Record<TimelineCategory, string> = {
  eu: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  de: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "national-transposition": "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  cir: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  grundschutz: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  enisa: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  market: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

const DOT_COLORS: Record<TimelineCategory, string> = {
  eu: "bg-blue-500",
  de: "bg-amber-500",
  "national-transposition": "bg-sky-500",
  cir: "bg-violet-500",
  grundschutz: "bg-emerald-500",
  enisa: "bg-cyan-500",
  market: "bg-orange-500",
};

const CATEGORY_LABELS: Record<TimelineCategory, { en: string; de: string }> = {
  eu: { en: "EU", de: "EU" },
  de: { en: "DE", de: "DE" },
  "national-transposition": {
    en: "Member State",
    de: "Mitgliedstaat",
  },
  cir: { en: "CIR", de: "CIR" },
  grundschutz: { en: "Grundschutz", de: "Grundschutz" },
  enisa: { en: "ENISA", de: "ENISA" },
  market: { en: "Market", de: "Markt" },
};

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function groupByYear(
  events: TimelineEvent[],
): Record<string, TimelineEvent[]> {
  const groups: Record<string, TimelineEvent[]> = {};
  for (const event of events) {
    const year = event.date.slice(0, 4);
    if (!groups[year]) groups[year] = [];
    groups[year].push(event);
  }
  return groups;
}

export function NIS2Timeline({
  events,
  sources,
  lastUpdated,
}: NIS2TimelineProps) {
  const locale = useLocale() as "en" | "de";
  const [activeCategory, setActiveCategory] = useState<
    TimelineCategory | "all"
  >("all");

  const filtered =
    activeCategory === "all"
      ? events
      : events.filter((e) => e.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = groupByYear(sorted);
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return (
    <div className="space-y-10">
      {/* Meta bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {sorted.length} {locale === "de" ? "Ereignisse" : "events"}
        </span>
        <span>
          {locale === "de" ? "Aktualisiert" : "Updated"}{" "}
          {new Date(lastUpdated).toLocaleDateString(
            locale === "de" ? "de-DE" : "en-US",
            { year: "numeric", month: "short", day: "numeric" },
          )}
        </span>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "all"
              ? events.length
              : events.filter((e) => e.category === cat.key).length;
          if (count === 0 && cat.key !== "all") return null;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                isActive
                  ? "border-foreground/20 bg-foreground/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {cat.key !== "all" && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isActive
                      ? DOT_COLORS[cat.key]
                      : "bg-muted-foreground/30",
                  )}
                />
              )}
              {locale === "de" ? cat.de : cat.en}
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline grouped by year */}
      {years.map((year) => (
        <section key={year}>
          <div className="sticky top-0 z-10 -mx-1 mb-4 bg-background/95 px-1 py-2 backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {year}
            </h2>
          </div>
          <div className="relative ml-3 border-l border-border/50 pl-6">
            {grouped[year].map((event, i) => {
              const source = sourceMap.get(event.sourceId);
              const isLast = i === grouped[year].length - 1;
              return (
                <div
                  key={event.id}
                  className={cn("relative pb-8", isLast && "pb-0")}
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        event.type === "milestone"
                          ? DOT_COLORS[event.category]
                          : "bg-border",
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="group">
                    {/* Date + category */}
                    <div className="mb-1 flex items-center gap-2">
                      <time
                        className="text-xs tabular-nums text-muted-foreground"
                        title={formatFullDate(event.date, locale)}
                      >
                        {formatDate(event.date, locale)}
                      </time>
                      <span
                        className={cn(
                          "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          CATEGORY_COLORS[event.category],
                        )}
                      >
                        {CATEGORY_LABELS[event.category][locale]}
                      </span>
                      {event.type === "milestone" && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {locale === "de" ? "Meilenstein" : "Milestone"}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-medium leading-snug text-foreground">
                      {locale === "de" ? event.titleDe : event.title}
                    </h3>

                    {/* Summary */}
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {locale === "de" ? event.summaryDe : event.summary}
                    </p>

                    {/* Tags + source */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
                      >
                        {source?.name ?? event.sourceId}
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </a>
                      {event.tags.length > 0 && (
                        <span className="text-border">|</span>
                      )}
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] text-muted-foreground/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Sources */}
      <div className="border-t pt-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {locale === "de" ? "Quellen" : "Sources"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "de"
            ? "Diese Seite wird regelmäßig aus den folgenden offiziellen und journalistischen Quellen aktualisiert."
            : "This page is regularly updated from the following official and journalistic sources."}
        </p>
        <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-2 py-1"
            >
              <span className="text-sm font-medium text-foreground/80 transition-colors group-hover:text-primary">
                {source.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                {source.language === "both"
                  ? "EN/DE"
                  : source.language.toUpperCase()}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
