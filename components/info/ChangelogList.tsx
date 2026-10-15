"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChangelogView } from "@/lib/changelog/localize";
import { CATEGORY_KEYS, type Category, isCategory } from "@/lib/changelog/types";
import { pickLocalized } from "@/lib/locale";

interface Props {
  entries: readonly ChangelogView[];
  locale: string;
  labels: Record<Category | "all" | "empty", string>;
}

const DATE_LOCALE = { de: "de-DE", en: "en-GB", cs: "cs-CZ" };

function formatMonth(dateIso: string, locale: string): string {
  return new Date(dateIso).toLocaleDateString(pickLocalized(DATE_LOCALE, locale), {
    year: "numeric",
    month: "long",
  });
}

function formatDate(dateIso: string, locale: string): string {
  return new Date(dateIso).toLocaleDateString(pickLocalized(DATE_LOCALE, locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ChangelogList({ entries, locale, labels }: Props) {
  const [filter, setFilter] = useState<"all" | Category>("all");

  const visible = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.category === filter)),
    [entries, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ChangelogView[]>();
    for (const e of visible) {
      const month = formatMonth(e.date, locale);
      const list = map.get(month) ?? [];
      list.push(e);
      map.set(month, list);
    }
    return Array.from(map.entries());
  }, [visible, locale]);

  const labelFor = (cat: string): string => (isCategory(cat) ? labels[cat] : cat);

  return (
    <div className="space-y-8">
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v === "all" || isCategory(v) ? v : "all")}
      >
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50">
          <TabsTrigger value="all">{labels.all}</TabsTrigger>
          {CATEGORY_KEYS.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {labels[cat]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        grouped.map(([month, monthEntries]) => (
          <section key={month} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {month}
            </h2>
            <div className="space-y-4">
              {monthEntries.map((entry) => (
                <Card key={entry.id} id={entry.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <time dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
                      <span>·</span>
                      <Badge variant="secondary" className="font-normal">
                        {labelFor(entry.category)}
                      </Badge>
                      {entry.version ? (
                        <>
                          <span>·</span>
                          <span className="font-mono">{entry.version}</span>
                        </>
                      ) : null}
                    </div>
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{entry.body}</p>
                    {entry.links.length > 0 ? (
                      <p className="flex flex-wrap gap-3 pt-1">
                        {entry.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            className="underline hover:text-foreground"
                          >
                            {link.label}
                          </a>
                        ))}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
