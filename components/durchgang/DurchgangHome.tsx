"use client";

import "./transitions.css";
import { ArrowRight, Check, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { resumeAt } from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import { Art, ArtThumb } from "./Art";
import { STAGE, transition } from "./transition";
import type { WalkEntry } from "./view";

/**
 * The Durchgang's front door. A first visit, with nothing started, opens on the introduction;
 * after that on "Ihr Weg" with one way on: the next open item, else the first one waiting.
 */
export function DurchgangHome({ walk }: { walk: readonly WalkEntry[] }) {
  const untouched = walk.every((w) => w.state.kind === "open");
  const [intro, setIntro] = useState(untouched);
  return intro ? (
    <Intro walk={walk} onStart={() => transition("forward", () => setIntro(false))} />
  ) : (
    <Home walk={walk} />
  );
}

function Intro({ walk, onStart }: { walk: readonly WalkEntry[]; onStart: () => void }) {
  const t = useTranslations("durchgang.ui.intro");
  const points = t.raw("points") as ReadonlyArray<{ title: string; text: string }>;
  return (
    <main style={STAGE} className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex w-full max-w-[42rem] flex-col justify-center justify-self-end py-14 sm:px-10 lg:py-20 lg:pr-16">
        <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
          {t("lead")}
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
        <Button
          size="lg"
          className="sticky bottom-6 mt-12 h-12 self-start rounded-xl px-7 text-base shadow-lg lg:static lg:shadow-none"
          onClick={onStart}
        >
          {t("start")}
          <ArrowRight />
        </Button>
      </div>
      <div className="relative hidden overflow-hidden rounded-3xl bg-primary/[0.06] lg:block">
        <div className="absolute inset-y-0 left-0 flex w-full max-w-[42rem] flex-col justify-center gap-5 px-16">
          <p className="text-sm font-medium text-muted-foreground">{t("firstItems")}</p>
          {walk.slice(0, 4).map((item, i) => (
            <div
              key={item.code}
              className="flex items-center gap-5 rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur"
              style={{ marginLeft: `${i * 2.5}rem` }}
            >
              <ArtThumb src={item.image} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.section}</p>
                <p className="font-semibold">{item.headline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Home({ walk }: { walk: readonly WalkEntry[] }) {
  const t = useTranslations("durchgang");
  const next = resumeAt(walk, (w) => w.state);
  const nextWaiting = next?.state.kind === "waiting" ? next.state : null;

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
    <main
      style={STAGE}
      className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-20"
    >
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("ui.home.title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("ui.home.lead")}</p>

        {next ? (
          <section className="mt-10 overflow-hidden rounded-3xl border bg-card shadow-sm">
            {next.image && (
              <div className="flex h-56 items-end justify-center bg-primary/[0.06] sm:h-64">
                <Art src={next.image} className="h-48 translate-y-2 sm:h-56" />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <p className="text-sm font-medium text-primary">
                {nextWaiting ? t("ui.home.waiting") : t("ui.home.next")}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {next.headline}
              </p>
              <p className="mt-2 text-muted-foreground">{next.teaser}</p>
              {nextWaiting?.reason && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-50">
                  <Clock className="mt-0.5 size-4 shrink-0" />
                  {t(`waitReasons.${nextWaiting.reason}`)}
                </p>
              )}
              <Button
                asChild
                size="lg"
                className="mt-6 h-12 w-full rounded-xl text-base sm:w-auto sm:px-7"
              >
                <Link
                  href={{
                    pathname: "/durchgang/nis2/[code]",
                    params: { code: next.code },
                  }}
                >
                  {t("ui.home.continue")}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <section className="mt-10 rounded-3xl border bg-card p-8">
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
    </main>
  );
}
