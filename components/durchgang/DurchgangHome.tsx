"use client";

import "./transitions.css";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Footprints,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { ImagePreview } from "@/components/shared/ImagePreview";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import type { WalkLock } from "@/lib/billing/access";
import {
  APPROVAL_SCREEN,
  isFreeStep,
  resumeAt,
  SETUP_STEP,
  WALK_POLICIES,
} from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import { Art, HOME_ART } from "./Art";
import { itemShot } from "./itemShots";
import { PromiseRow } from "./PromiseRow";
import { hrefOf, useSteps } from "./setup";
import { STAGE } from "./transition";
import type { WalkEntry } from "./view";
import { WalkOffer } from "./WalkOffer";

/**
 * Each promise carries the sign the person meets for it in the walk: the walk's own footprints,
 * the BSI default's shield, the clock of an item set aside, management's approval.
 */
const POINT_ICONS = [Footprints, ShieldCheck, Clock, BadgeCheck] as const;

const FLASH_MS = 2400;

const stepId = (code: string) => `dg-step-${code}`;

/**
 * The Durchgang's front door: what the walk is on the left, pinned while the path scrolls, with
 * one way on (the next open item, else the first one waiting); "Ihr Weg" on the right, step by
 * step, each step a card with its status circle and its picture. There is no separate
 * introduction screen; this page is it (Simon, 03.10.2026).
 *
 * `lock` (`walkLockFor`): an account that has not paid walks the first steps (`isFreeStep`, up to
 * the list of what the company has) and sees the rest locked: steps that show but do not open.
 * Once the free steps are filled in, even if some are set aside, the left side becomes the offer
 * (`WalkOffer`; Simon, 20.10.2026). An account that keeps its journey free (grandfathered) is
 * offered it beside the order, as the quieter way. `price` is what that account would pay, shown
 * under the order. A locked step shows a screenshot of itself on hover, or on a tap on touch, and
 * zooms into the part that matters (`itemShots`), and a click leads to the order; an open step
 * opens itself instead (Simon, 04.10.2026).
 *
 * `setup`: a company not set up yet walks one step more, setting itself up right after the
 * registration (`useSteps`).
 *
 * `call`: beside "Jetzt bestellen", the way to talk to us first (the pricing page's `TalkFirst`,
 * rendered by the server page and passed in).
 *
 * `forward`: under the order, the quiet way to hand the decision to management
 * (`ForwardToManagement`), passed in by the server page only for someone who may send it.
 */
export function DurchgangHome({
  walk,
  lock,
  price,
  setup,
  call,
  forward,
}: {
  walk: readonly WalkEntry[];
  lock: WalkLock | null;
  price: string | null;
  setup: boolean;
  call?: ReactNode;
  forward?: ReactNode;
}) {
  const t = useTranslations("durchgang");
  const locale = useLocale();
  const locked = lock !== null;
  const points = t.raw("ui.intro.points") as ReadonlyArray<{
    title: string;
    text: string;
  }>;
  const steps = useSteps(walk, setup);
  // Setting the company up is not walking: a company set up but not walked yet still starts.
  const untouched = steps.every((w) => w.code === SETUP_STEP || w.state.kind === "open");
  // Without an order the walk ends at the last free step: "next" is the next one of those, and
  // none left means the free part is filled in or set aside, which is where the order begins.
  const reachable = locked ? steps.filter((w) => isFreeStep(w.code)) : steps;
  const next = resumeAt(reachable, (w) => w.state);
  const [flash, setFlash] = useState<string | null>(null);

  /**
   * Where a locked step and the order button lead. Where ordering is not open (no live keys, so
   * no order page) the public pricing page is still there to read (Simon, 20.10.2026: nothing led
   * to pricing while locked).
   */
  const orderHref = lock?.orderAt ?? "/pricing";

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
        {lock && !next ? (
          // The free part is filled in, set-aside steps included: the offer takes this side.
          <WalkOffer
            lock={lock}
            orderHref={orderHref}
            remaining={steps.filter((w) => !isFreeStep(w.code)).length}
            documents={
              WALK_POLICIES.filter(
                (p) => !isFreeStep(p.code) && steps.some((w) => w.code === p.code),
              ).length
            }
            price={price}
            call={call}
            forward={forward}
          />
        ) : (
          <>
            {/* The picture sits beside the title, not above it, so the list and the button
                stay in the first screen (Simon, 20.10.2026). */}
            <div className="flex items-end gap-6">
              <div className="min-w-0 flex-1">
                <p className="inline-flex rounded-full bg-primary/[0.08] px-3 py-1 text-sm font-medium text-primary">
                  {t("ui.intro.eyebrow")}
                </p>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {t("ui.intro.title")}
                </h1>
                <p className="mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
                  {t("ui.intro.lead")}
                </p>
              </div>
              <Art src={HOME_ART} className="hidden h-36 shrink-0 sm:block" />
            </div>
            <ul className="mt-8 divide-y border-y">
              {points.map((point, i) => (
                <PromiseRow
                  key={point.title}
                  icon={POINT_ICONS[i]}
                  title={point.title}
                  text={point.text}
                />
              ))}
            </ul>
            {/* Without the order the free part is walked like the rest: the order is not
                mentioned until it is reached (Simon, 20.10.2026). */}
            {next ? (
              <Button
                asChild
                size="lg"
                className="mt-8 h-12 self-start rounded-xl px-7 text-base"
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
          </>
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
            // Locked: not walkable without the order. A company already set up has nothing
            // left to do on its setup step, which stays on the path but opens nothing.
            const closed = locked && !isFreeStep(entry.code);
            const inert = closed || (entry.code === SETUP_STEP && settled);
            const shot = closed
              ? itemShot(
                  entry.code,
                  locale,
                  t("ui.home.previewAlt", { step: entry.headline }),
                )
              : null;
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
                    !inert &&
                      "hover:border-primary/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
                    shot &&
                      "hover:border-primary/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring",
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
                    {inert ? (
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
                    {inert ? (
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
                  {!inert && (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  {/* A locked step does not open, it shows itself on hover: the whole card is the
                      trigger, so the preview sits beside the card. A click leads to the order,
                      or the pricing page where ordering is closed (Simon, 20.10.2026). */}
                  {shot && (
                    <>
                      <Eye
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <ImagePreview image={shot} link>
                        <Link
                          href={orderHref}
                          aria-label={t("ui.home.preview", { step: entry.headline })}
                          className="absolute inset-0 z-20 cursor-pointer rounded-2xl focus-visible:outline-none"
                        />
                      </ImagePreview>
                    </>
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
