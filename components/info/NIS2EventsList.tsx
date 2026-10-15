"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import type { EventItem, EventTopic } from "@/lib/events/schema";
import { pickLocalized } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface NIS2EventsListProps {
  events: readonly EventItem[];
  lastUpdated: string;
}

/** A label in each language the list speaks; every other locale reads English. */
type Label = { readonly de: string; readonly en: string; readonly cs: string };

/** The filter's order. */
const TOPICS = ["all", "NIS2", "GDPR", "CRA"] as const satisfies readonly (
  | EventTopic
  | "all"
)[];

const TOPIC_LABELS: Record<EventTopic | "all", Label> = {
  all: { en: "All", de: "Alle", cs: "Vše" },
  NIS2: { en: "NIS2", de: "NIS2", cs: "NIS2" },
  GDPR: { en: "GDPR", de: "DSGVO", cs: "GDPR" },
  CRA: { en: "CRA", de: "CRA", cs: "CRA" },
};

const TOPIC_COLORS: Record<EventTopic, string> = {
  NIS2: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  GDPR: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CRA: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

const TOPIC_DOTS: Record<EventTopic, string> = {
  NIS2: "bg-blue-500",
  GDPR: "bg-emerald-500",
  CRA: "bg-violet-500",
};

const FORMAT_LABELS: Record<string, Label> = {
  online: { en: "Online", de: "Online", cs: "Online" },
  "in-person": { en: "In person", de: "Vor Ort", cs: "Na místě" },
  hybrid: { en: "Hybrid", de: "Hybrid", cs: "Hybridně" },
};

const TEXT = {
  events: {
    de: (n: number) => `${n} Veranstaltungen`,
    en: (n: number) => `${n} events`,
    cs: (n: number) => `Počet akcí: ${n}`,
  },
  updated: { de: "Aktualisiert", en: "Updated", cs: "Aktualizováno" },
  none: {
    de: "Keine anstehenden Veranstaltungen in dieser Kategorie.",
    en: "No upcoming events in this category.",
    cs: "V této kategorii nejsou žádné nadcházející akce.",
  },
  details: { de: "Infos", en: "Details", cs: "Podrobnosti" },
  register: { de: "Anmeldung", en: "Register", cs: "Registrace" },
  free: { de: "Kostenlos", en: "Free", cs: "Zdarma" },
};

const DATE_LOCALE = { de: "de-DE", en: "en-US", cs: "cs-CZ" };

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function formatMonth(key: string, locale: string): string {
  const d = new Date(`${key}-01T12:00:00Z`);
  return d.toLocaleDateString(pickLocalized(DATE_LOCALE, locale), {
    year: "numeric",
    month: "long",
  });
}

function formatDay(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toLocaleDateString(pickLocalized(DATE_LOCALE, locale), {
    month: "short",
    day: "numeric",
  });
}

function formatRange(start: string, end: string | null, locale: string): string {
  if (!end || end === start) return formatDay(start, locale);
  return `${formatDay(start, locale)} - ${formatDay(end, locale)}`;
}

function groupByMonth(events: readonly EventItem[]): Record<string, EventItem[]> {
  const groups: Record<string, EventItem[]> = {};
  for (const event of events) {
    const key = monthKey(event.startDate);
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return groups;
}

export function NIS2EventsList({ events, lastUpdated }: NIS2EventsListProps) {
  const locale = useLocale();
  const [activeTopic, setActiveTopic] = useState<EventTopic | "all">("all");
  const say = <T,>(text: { de: T; en: T; cs: T }): T => pickLocalized(text, locale);

  const filtered =
    activeTopic === "all" ? events : events.filter((e) => e.topics.includes(activeTopic));

  const sorted = [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const grouped = groupByMonth(sorted);
  const months = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-10">
      {/* Meta bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{say(TEXT.events)(sorted.length)}</span>
        <span>
          {say(TEXT.updated)}{" "}
          {new Date(lastUpdated).toLocaleDateString(pickLocalized(DATE_LOCALE, locale), {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-1.5">
        {TOPICS.map((key) => {
          const count =
            key === "all"
              ? events.length
              : events.filter((e) => e.topics.includes(key)).length;
          if (count === 0 && key !== "all") return null;
          const isActive = activeTopic === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => setActiveTopic(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                isActive
                  ? "border-foreground/20 bg-foreground/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {key !== "all" && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? TOPIC_DOTS[key] : "bg-muted-foreground/30",
                  )}
                />
              )}
              {say(TOPIC_LABELS[key])}
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">{say(TEXT.none)}</p>
      )}

      {/* Events grouped by month */}
      {months.map((month) => (
        <section key={month}>
          <div className="sticky top-0 z-10 -mx-1 mb-4 bg-background/95 px-1 py-2 backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {formatMonth(month, locale)}
            </h2>
          </div>
          <div className="relative ml-3 border-l border-border/50 pl-6">
            {grouped[month].map((event, i) => {
              const isLast = i === grouped[month].length - 1;
              const format = FORMAT_LABELS[event.format];
              return (
                <div key={event.id} className={cn("relative pb-8", isLast && "pb-0")}>
                  {/* Dot */}
                  <div className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                    <div
                      className={cn("h-2 w-2 rounded-full", TOPIC_DOTS[event.topics[0]])}
                    />
                  </div>

                  <div className="group">
                    {/* Date + topics + format */}
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <time className="text-xs tabular-nums text-muted-foreground">
                        {formatRange(event.startDate, event.endDate, locale)}
                      </time>
                      {event.topics.map((topic) => (
                        <span
                          key={topic}
                          className={cn(
                            "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            TOPIC_COLORS[topic],
                          )}
                        >
                          {say(TOPIC_LABELS[topic])}
                        </span>
                      ))}
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {format ? say(format) : event.format}
                        {event.city ? ` · ${event.city}` : ""} · {event.country}
                      </span>
                    </div>

                    {/* Title (kept in its original language) */}
                    <h3 className="text-[15px] font-medium leading-snug text-foreground">
                      {event.title}
                    </h3>

                    {/* Organizer + notes */}
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {event.organizer}
                      {event.notes ? `. ${event.notes}` : ""}
                    </p>

                    {/* Links */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={event.infoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
                      >
                        {say(TEXT.details)}
                        <svg
                          aria-hidden="true"
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
                      {event.signupUrl && (
                        <>
                          <span className="text-border">|</span>
                          <a
                            href={event.signupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
                          >
                            {say(TEXT.register)}
                          </a>
                        </>
                      )}
                      <span className="text-border">|</span>
                      <span className="text-[11px] uppercase tracking-wider text-emerald-700/80 dark:text-emerald-400/80">
                        {say(TEXT.free)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
