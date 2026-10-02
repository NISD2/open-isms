"use client";

import "./transitions.css";
import { ArrowRight, Check, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { resumeAt } from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import { STAGE } from "./transition";
import type { WalkEntry } from "./view";

/**
 * The Durchgang's front door: what the walk is on the left, with one way on (the next open item,
 * else the first one waiting), and "Ihr Weg" on the right. There is no separate introduction
 * screen; this page is it (Simon, 03.10.2026).
 */
export function DurchgangHome({ walk }: { walk: readonly WalkEntry[] }) {
  const t = useTranslations("durchgang");
  const points = t.raw("ui.intro.points") as ReadonlyArray<{
    title: string;
    text: string;
  }>;
  const untouched = walk.every((w) => w.state.kind === "open");
  const next = resumeAt(walk, (w) => w.state);

  const statusLine = (entry: WalkEntry): string => {
    switch (entry.state.kind) {
      case "filled":
        return t("ui.home.filled");
      case "declined":
        return t("ui.home.declined");
      case "signed":
        return t("ui.home.signed");
      case "not_applicable":
        return t("ui.home.notApplicable");
      case "waiting":
        return entry.state.reason
          ? t(`waitReasons.${entry.state.reason}`)
          : t("ui.home.waiting");
      case "open":
        return entry.code === next?.code ? t("ui.home.next") : entry.section;
      default:
        return entry.state satisfies never;
    }
  };

  return (
    <div
      style={STAGE}
      className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-20"
    >
      <div className="flex max-w-3xl flex-col lg:py-6">
        <p className="text-sm font-medium text-primary">{t("ui.intro.eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t("ui.intro.title")}
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
          {t("ui.intro.lead")}
        </p>
        <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {points.map((point, i) => (
            <li key={point.title}>
              <span className="text-sm font-semibold text-primary tabular-nums">
                0{i + 1}
              </span>
              <p className="mt-1 font-semibold">{point.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{point.text}</p>
            </li>
          ))}
        </ol>

        {next ? (
          <Button
            asChild
            size="lg"
            className="sticky bottom-6 mt-12 h-12 self-start rounded-xl px-7 text-base shadow-lg lg:static lg:shadow-none"
          >
            <Link
              href={{
                pathname: "/durchgang/nis2/[code]",
                params: { code: next.code },
              }}
            >
              {untouched ? t("ui.intro.start") : t("ui.home.continue")}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <section className="mt-12 rounded-3xl border bg-card p-8">
            <p className="text-xl font-semibold">{t("ui.home.allFilled")}</p>
            <p className="mt-2 text-muted-foreground">{t("ui.home.allFilledNote")}</p>
          </section>
        )}
      </div>

      <aside>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t("ui.home.yourWay")}
        </h2>
        <ol className="mt-5 space-y-1">
          {walk.map((entry, index) => {
            const settled = entry.state.kind !== "open" && entry.state.kind !== "waiting";
            const waiting = entry.state.kind === "waiting";
            const isNext = next?.code === entry.code;
            return (
              <li key={entry.code} className="relative flex gap-4 rounded-xl p-2">
                {index < walk.length - 1 && (
                  // From 6px under this circle to 6px above the next one, on the circles' centre
                  // line: the 8px padding plus half the 32px circle.
                  <span
                    aria-hidden
                    className="absolute top-[46px] -bottom-1.5 left-6 w-px -translate-x-1/2 bg-border"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                    settled && "border-primary bg-primary text-primary-foreground",
                    waiting && "border-amber-400 text-amber-600",
                    isNext && !waiting && "border-primary ring-4 ring-primary/15",
                  )}
                >
                  {settled ? (
                    <Check className="size-4" />
                  ) : waiting ? (
                    <Clock className="size-4" />
                  ) : null}
                </span>
                <div className="min-w-0 pt-1">
                  <Link
                    href={{
                      pathname: "/durchgang/nis2/[code]",
                      params: { code: entry.code },
                    }}
                    className={cn(
                      "text-sm font-medium hover:underline",
                      settled && "text-muted-foreground",
                    )}
                  >
                    {entry.headline}
                  </Link>
                  <p className="text-xs text-muted-foreground">{statusLine(entry)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
