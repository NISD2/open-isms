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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import type { WalkLock } from "@/lib/billing/access";
import { APPROVAL_SCREEN, resumeAt } from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import { Art, SETUP_ART } from "./Art";
import { PromiseCard } from "./PromiseCard";
import { STAGE } from "./transition";
import type { WalkEntry } from "./view";

/**
 * Each promise carries the sign the person meets for it in the walk: the walk's own footprints,
 * the BSI default's shield, the clock of an item set aside, management's approval.
 */
const POINT_ICONS = [Footprints, ShieldCheck, Clock, BadgeCheck] as const;

const FLASH_MS = 2400;

const stepId = (code: string) => `dg-step-${code}`;

/** The walk's first step while the company is not set up yet: setting it up. */
const SETUP_STEP = "unternehmen";

const hrefOf = (code: string) =>
  code === SETUP_STEP
    ? ("/durchgang/nis2/unternehmen" as const)
    : ({ pathname: "/durchgang/nis2/[code]", params: { code } } as const);

/**
 * The Durchgang's front door: what the walk is on the left, pinned while the path scrolls, with
 * one way on (the next open item, else the first one waiting); "Ihr Weg" on the right, step by
 * step, each step a card with its status circle and its picture. There is no separate
 * introduction screen; this page is it (Simon, 03.10.2026).
 *
 * `lock` (`walkLockFor`): an account that has not paid sees the same page locked, with "Jetzt
 * bestellen" in place of the way in, and steps that show but do not open. An account that keeps
 * its journey free (grandfathered) is offered it beside the order, as the quieter way, or as the
 * one way on while ordering is not open yet. `price` is what that account would pay, shown under
 * the order.
 *
 * `setup`: a company not set up yet (the draft every account gets at sign-up) walks one step more
 * first, setting itself up (Simon, 04.10.2026).
 */
export function DurchgangHome({
  walk,
  lock,
  price,
  setup,
}: {
  walk: readonly WalkEntry[];
  lock: WalkLock | null;
  price: string | null;
  setup: boolean;
}) {
  const t = useTranslations("durchgang");
  const locked = lock !== null;
  const points = t.raw("ui.intro.points") as ReadonlyArray<{
    title: string;
    text: string;
  }>;
  const steps: readonly WalkEntry[] = setup
    ? [
        {
          code: SETUP_STEP,
          section: t("ui.home.setupSection"),
          headline: t("ui.home.setupHeadline"),
          teaser: "",
          image: SETUP_ART,
          state: { kind: "open" },
        },
        ...walk,
      ]
    : walk;
  const untouched = steps.every((w) => w.state.kind === "open");
  const next = resumeAt(steps, (w) => w.state);
  const [flash, setFlash] = useState<string | null>(null);

  /** A small sign-off tick leads to the step where management signs, and lights it briefly. */
  const showSignOff = () => {
    const code = APPROVAL_SCREEN?.code;
    if (!code) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(stepId(code))
      ?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
    setFlash(code);
    window.setTimeout(() => setFlash((c) => (c === code ? null : c)), FLASH_MS);
  };

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
          {points.map((point, i) => (
            <PromiseCard
              key={point.title}
              icon={POINT_ICONS[i]}
              title={point.title}
              text={point.text}
              shot={i + 1}
            />
          ))}
        </ul>
        {lock?.orderAt === null ? (
          // Ordering is not open yet: the journey is the one way on.
          <Button
            asChild
            size="lg"
            className="mt-10 h-12 self-start rounded-xl px-7 text-base"
          >
            <Link href="/journey">
              {t("ui.home.toJourney")}
              <ArrowRight />
            </Link>
          </Button>
        ) : lock ? (
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-7 text-base">
              <Link href={lock.orderAt}>
                {t("ui.home.unlock")}
                <ArrowRight />
              </Link>
            </Button>
            {lock.journey && (
              <Link
                href="/journey"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("ui.home.toJourney")}
              </Link>
            )}
            {price && (
              <p className="w-full text-sm text-muted-foreground">
                {t("ui.home.price", { price })}
              </p>
            )}
          </div>
        ) : next ? (
          <Button
            asChild
            size="lg"
            className="mt-10 h-12 self-start rounded-xl px-7 text-base"
          >
            <Link href={hrefOf(next.code)}>
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
          {steps.map((entry, index) => {
            const settled = entry.state.kind !== "open" && entry.state.kind !== "waiting";
            const signedOff = entry.state.kind === "signed";
            // A step that does not apply is never put to management, so it has no sign-off to
            // show; neither has setting the company up.
            const awaitsSignOff =
              !signedOff &&
              entry.state.kind !== "not_applicable" &&
              entry.code !== SETUP_STEP;
            const waiting = entry.state.kind === "waiting";
            const isNext = next?.code === entry.code;
            const href = hrefOf(entry.code);
            const circle = cn(
              "flex size-7 items-center justify-center rounded-full border-2 border-muted-foreground/25",
              settled && "border-primary bg-primary text-primary-foreground",
              signedOff && "border-emerald-600 bg-emerald-600 text-white",
              waiting && "border-amber-400 text-amber-600",
              isNext && !waiting && "border-primary ring-4 ring-primary/15",
            );
            const mark = settled ? (
              <Check className="size-4" />
            ) : waiting ? (
              <Clock className="size-4" />
            ) : null;
            return (
              <li key={entry.code} className="relative">
                {index < steps.length - 1 && (
                  // Joins this card to the next across the 8px gap, under the status circle's
                  // centre (1px border, 20px padding, half the 28px circle).
                  <span
                    aria-hidden
                    className="absolute top-full left-[35px] h-2 w-px -translate-x-1/2 bg-primary/25"
                  />
                )}
                <div
                  id={stepId(entry.code)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl border bg-card p-3 pr-4 pl-5 shadow-xs transition duration-500 sm:gap-4",
                    !locked &&
                      "hover:border-primary/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
                    isNext && "border-primary/60 ring-4 ring-primary/10",
                    flash === entry.code &&
                      "border-emerald-600 ring-4 ring-emerald-600/25",
                  )}
                >
                  {/* Two marks, two questions. The big circle: is the step filled in (empty, or
                      a blue tick)? The small grey tick at its bottom right: signed off yet? Once
                      signed off the small one goes and the whole circle turns green (Simon,
                      03.10.2026). Both sit above the card's stretched link so they can show
                      their tooltips. The circle is itself a link to the same step, out of the
                      tab order, so a click on it opens it; the small tick leads to the step
                      where management signs. */}
                  <span className="relative z-10 shrink-0">
                    {locked ? (
                      <span aria-hidden className={circle}>
                        {mark}
                      </span>
                    ) : (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={href}
                              tabIndex={-1}
                              aria-hidden
                              className={circle}
                            >
                              {mark}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>{stateLabel(entry)}</TooltipContent>
                        </Tooltip>
                        {awaitsSignOff && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={t("ui.home.toSignOff")}
                                onClick={showSignOff}
                                className="absolute -right-1.5 -bottom-1.5 flex size-4 cursor-pointer items-center justify-center rounded-full border border-muted-foreground/30 bg-card text-muted-foreground/60 ring-2 ring-card hover:border-emerald-600 hover:text-emerald-600"
                              >
                                <Check className="size-2.5" strokeWidth={3} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t("ui.home.toSignOff")}</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </span>
                  <div className="flex h-12 w-14 shrink-0 items-end justify-center sm:h-14 sm:w-16">
                    <Art
                      src={entry.image}
                      className={cn("h-full", settled && "opacity-40")}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{entry.section}</p>
                    {locked ? (
                      <p className="text-sm font-semibold leading-snug">
                        {entry.headline}
                      </p>
                    ) : (
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
                    )}
                    {/* What a set-aside step still needs, in sight: the circle's tooltip never
                        opens on touch. */}
                    {entry.state.kind === "waiting" && entry.state.reason && (
                      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                        {t(`waitReasons.${entry.state.reason}`)}
                      </p>
                    )}
                  </div>
                  {!locked && (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
