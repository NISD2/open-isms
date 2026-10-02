"use client";

import "./transitions.css";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  Footprints,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { resumeAt } from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import { Art } from "./Art";
import { STAGE } from "./transition";
import type { WalkEntry } from "./view";

/**
 * Each promise carries the sign the person meets for it in the walk: the walk's own footprints,
 * the BSI default's shield, the clock of an item set aside, management's approval.
 */
const POINT_ICONS = [Footprints, ShieldCheck, Clock, BadgeCheck] as const;

/**
 * The Durchgang's front door: what the walk is on the left, pinned while the path scrolls, with
 * one way on (the next open item, else the first one waiting); "Ihr Weg" on the right, step by
 * step, each step a card with its status circle and its picture. There is no separate
 * introduction screen; this page is it (Simon, 03.10.2026).
 */
export function DurchgangHome({ walk }: { walk: readonly WalkEntry[] }) {
  const t = useTranslations("durchgang");
  const points = t.raw("ui.intro.points") as ReadonlyArray<{
    title: string;
    text: string;
  }>;
  const untouched = walk.every((w) => w.state.kind === "open");
  const next = resumeAt(walk, (w) => w.state);

  /** The state a step's circle names on hover; the card's top line stays its area. */
  const stateLabel = (entry: WalkEntry): string => {
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
        return entry.code === next?.code ? t("ui.home.next") : t("ui.home.open");
      default:
        return entry.state satisfies never;
    }
  };

  return (
    <div
      style={STAGE}
      className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_28rem] xl:gap-16"
    >
      <div className="flex flex-col lg:sticky lg:top-18 lg:self-start lg:py-6">
        <p className="self-start rounded-full bg-primary/[0.08] px-3 py-1 text-sm font-medium text-primary">
          {t("ui.intro.eyebrow")}
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t("ui.intro.title")}
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
          {t("ui.intro.lead")}
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {points.map((point, i) => {
            const Icon = POINT_ICONS[i];
            return (
              <li key={point.title} className="rounded-2xl border bg-card p-5 shadow-xs">
                {Icon && (
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                    <Icon className="size-[1.125rem]" />
                  </span>
                )}
                <p className="mt-3 font-semibold">{point.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {point.text}
                </p>
              </li>
            );
          })}
        </ul>
        {next ? (
          <Button
            asChild
            size="lg"
            className="mt-10 h-12 self-start rounded-xl px-7 text-base"
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
          <div className="mt-10 rounded-3xl border bg-card p-8">
            <p className="text-xl font-semibold">{t("ui.home.allFilled")}</p>
            <p className="mt-2 text-muted-foreground">{t("ui.home.allFilledNote")}</p>
          </div>
        )}
      </div>

      <aside className="self-start rounded-3xl bg-primary/[0.06] p-3 sm:p-4">
        <h2 className="px-2 pt-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t("ui.home.yourWay")}
        </h2>
        <ol className="mt-4 space-y-2">
          {walk.map((entry, index) => {
            const settled = entry.state.kind !== "open" && entry.state.kind !== "waiting";
            const signedOff = entry.state.kind === "signed";
            const waiting = entry.state.kind === "waiting";
            const isNext = next?.code === entry.code;
            const href = {
              pathname: "/durchgang/nis2/[code]",
              params: { code: entry.code },
            } as const;
            return (
              <li key={entry.code} className="relative">
                {index < walk.length - 1 && (
                  // Joins this card to the next across the 8px gap, under the status circle's
                  // centre (1px border, 20px padding, half the 28px circle).
                  <span
                    aria-hidden
                    className="absolute top-full left-[35px] h-2 w-px -translate-x-1/2 bg-primary/25"
                  />
                )}
                <div
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl border bg-card p-3 pr-4 pl-5 shadow-xs sm:gap-4 transition-colors hover:border-primary/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
                    isNext && "border-primary/60 ring-4 ring-primary/10",
                  )}
                >
                  {/* Two marks, two questions. The big circle: is the step filled in (empty, or
                      a blue tick)? The small grey tick at its bottom right: signed off yet? Once
                      signed off the small one goes and the whole circle turns green (Simon,
                      03.10.2026). Above the card's stretched link so it can show its tooltip,
                      and itself a link to the same step, out of the tab order, so a click on it
                      opens it. */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        tabIndex={-1}
                        aria-hidden
                        className={cn(
                          "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/25",
                          settled && "border-primary bg-primary text-primary-foreground",
                          signedOff && "border-emerald-600 bg-emerald-600 text-white",
                          waiting && "border-amber-400 text-amber-600",
                          isNext && !waiting && "border-primary ring-4 ring-primary/15",
                        )}
                      >
                        {settled ? (
                          <Check className="size-4" />
                        ) : waiting ? (
                          <Clock className="size-4" />
                        ) : null}
                        {!signedOff && (
                          <span className="absolute -right-1.5 -bottom-1.5 flex size-4 items-center justify-center rounded-full border border-muted-foreground/30 bg-card text-muted-foreground/60 ring-2 ring-card">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{stateLabel(entry)}</TooltipContent>
                  </Tooltip>
                  <div className="flex h-12 w-14 shrink-0 items-end justify-center sm:h-14 sm:w-16">
                    <Art
                      src={entry.image}
                      className={cn("h-full", settled && "opacity-40")}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{entry.section}</p>
                    <Link
                      href={href}
                      className={cn(
                        "text-sm font-semibold leading-snug after:absolute after:inset-0 focus-visible:outline-none",
                        settled && "text-muted-foreground",
                      )}
                    >
                      {entry.headline}
                      <span className="sr-only">: {stateLabel(entry)}</span>
                    </Link>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
