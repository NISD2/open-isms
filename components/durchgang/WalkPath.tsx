"use client";

import { Check, ChevronRight, Clock, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ImagePreview } from "@/components/shared/ImagePreview";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import type { WalkLock } from "@/lib/billing/access";
import {
  approvalOf,
  isFreeStep,
  SETUP_STEP,
  WALKS,
  type WalkFramework,
} from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import { Art } from "./Art";
import { itemShot } from "./itemShots";
import { hrefOf as stepHref } from "./setup";
import type { WalkEntry } from "./view";

const FLASH_MS = 2400;

const stepId = (code: string) => `dg-step-${code}`;

const SIGN_OFF_TICK =
  "absolute -right-1.5 -bottom-1.5 flex size-4 cursor-pointer items-center justify-center rounded-full border border-muted-foreground/30 bg-card text-muted-foreground/60 ring-2 ring-card hover:border-emerald-600 hover:text-emerald-600";

/**
 * "Ihr Weg": the walk step by step, each step a card with its status circle and its picture. The
 * walk's home shows it beside what the walk is; a locked item's preview shows it beside the item,
 * with that item marked (`current`), so the person sees where the step sits in the walk (Simon,
 * 23.10.2026).
 *
 * `locked`: steps past the free ones show but do not open. A locked step shows a screenshot of
 * itself on hover, or on a tap on touch, and zooms into the part that matters (`itemShots`), and a
 * click leads to `orderHref`; an open step opens itself instead (Simon, 04.10.2026).
 *
 * `current`: the item on screen. Its card is marked and opens nothing, since the person is on it.
 * The list then scrolls on its own beside the item, opened at that card: on the home the whole
 * page scrolls, but a step near the end would sit below the fold here.
 */
export function WalkPath({
  framework,
  steps,
  next,
  locked,
  orderHref,
  current,
}: {
  framework: WalkFramework;
  steps: readonly WalkEntry[];
  /** The step the walk carries on with, from `resumeAt`. */
  next: WalkEntry | null;
  locked: boolean;
  orderHref: NonNullable<WalkLock["orderAt"]> | "/pricing";
  current?: string;
}) {
  const t = useTranslations("durchgang");
  const locale = useLocale();
  const [flash, setFlash] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);

  // Centres the current card in the list's own scroll. Where the list does not scroll (a phone,
  // where it follows the item), there is nothing to move.
  useEffect(() => {
    const box = panel.current;
    const card = current ? document.getElementById(stepId(current)) : null;
    if (!box || !card) return;
    const top = card.getBoundingClientRect().top - box.getBoundingClientRect().top;
    box.scrollTop += top - (box.clientHeight - card.offsetHeight) / 2;
  }, [current]);

  const signOff = approvalOf(WALKS[framework])?.code ?? null;
  // Before the order the step where management signs is locked, and its card says nothing about
  // signing: the tick leads to that step's preview instead, which says sign-off comes with the
  // order (an outside tester, 30.10.2026: the jump "just scrolls to the locked items").
  const signOffLocked = signOff !== null && locked && !isFreeStep(signOff);

  /** A small sign-off tick leads to the step where management signs, and lights it briefly. */
  const showSignOff = () => {
    if (!signOff) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(stepId(signOff))
      ?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
    setFlash(signOff);
    window.setTimeout(() => setFlash((c) => (c === signOff ? null : c)), FLASH_MS);
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
    <aside
      ref={panel}
      className={cn(
        "self-start rounded-3xl bg-primary/[0.06] p-3 sm:p-4",
        current &&
          "lg:sticky lg:top-18 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:overscroll-contain",
      )}
    >
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
          const here = entry.code === current;
          const href = stepHref(framework, entry.code);
          // Locked: not walkable without the order. A company already set up has nothing
          // left to do on its setup step, which stays on the path but opens nothing.
          const closed = locked && !isFreeStep(entry.code);
          const inert = here || closed || (entry.code === SETUP_STEP && settled);
          const shot =
            closed && !here
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
                aria-current={here ? "step" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl border bg-card p-3 pr-4 pl-5 shadow-xs transition duration-500 sm:gap-4",
                  !inert &&
                    "hover:border-primary/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
                  shot &&
                    "hover:border-primary/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring",
                  // Beside an item, the item is the card that stands out, not the next step.
                  isNext && !current && "border-primary/60 ring-4 ring-primary/10",
                  here && "border-primary ring-4 ring-primary/20",
                  flash === entry.code && "border-emerald-600 ring-4 ring-emerald-600/25",
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
                          <Link href={href} tabIndex={-1} aria-hidden className={circle}>
                            {mark}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>{stateLabel(entry)}</TooltipContent>
                      </Tooltip>
                      {awaitsSignOff && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {signOffLocked ? (
                              <Link
                                href={stepHref(framework, signOff)}
                                aria-label={t("ui.home.toSignOffLocked")}
                                className={SIGN_OFF_TICK}
                              >
                                <Check className="size-2.5" strokeWidth={3} />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                aria-label={t("ui.home.toSignOff")}
                                onClick={showSignOff}
                                className={SIGN_OFF_TICK}
                              >
                                <Check className="size-2.5" strokeWidth={3} />
                              </button>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {t(
                              signOffLocked
                                ? "ui.home.toSignOffLocked"
                                : "ui.home.toSignOff",
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </span>
                {entry.image && (
                  <div className="flex h-12 w-14 shrink-0 items-end justify-center sm:h-14 sm:w-16">
                    <Art
                      src={entry.image}
                      className={cn("h-full", settled && "opacity-40")}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{entry.section}</p>
                  {inert ? (
                    <p className="text-sm font-semibold leading-snug">{entry.headline}</p>
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
                    <Eye aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    <ImagePreview image={shot} link>
                      <Link
                        href={orderHref}
                        aria-label={t("ui.home.preview", { step: entry.headline })}
                        className="absolute inset-0 z-20 cursor-pointer rounded-2xl focus-visible:outline-none"
                      />
                    </ImagePreview>
                  </>
                )}
                {/* A locked step without a screenshot (the GDPR walk's) still leads to the
                    order, as every locked step does. */}
                {closed && !shot && !here && (
                  <>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    <Link
                      href={orderHref}
                      aria-label={t("ui.home.lockedStep", { step: entry.headline })}
                      className="absolute inset-0 z-20 cursor-pointer rounded-2xl focus-visible:outline-none"
                    />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
