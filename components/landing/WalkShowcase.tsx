"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MotionToggle, useMotionAllowed } from "./motion";
import { type ShotName, shotImage, zoomSizes } from "./shots";
import { useInView } from "./useInView";
import { AutoShot, LoopingImage } from "./ZoomShot";

const STEPS = [
  { key: "oneAtATime", shot: "explain" },
  { key: "bsiMethods", shot: "bsiMethod" },
  { key: "riskMap", shot: "riskMap" },
  { key: "setAside", shot: "setAside" },
  { key: "signOff", shot: "approved" },
] as const satisfies readonly { readonly key: string; readonly shot: ShotName }[];

/** The frame's width on a large screen: the page's 72rem less the 22rem of steps and the gap. */
const FRAME_PX = 736;
/**
 * Where a step takes over, as a share of the window's height: the middle, where the frame's middle
 * is, so the step beside the frame is the one it shows.
 */
const READ_LINE = 0.5;

/**
 * The walk in five steps. On a large screen the text scrolls on the left while one frame on the
 * right stays put and shows the step being read, zooming into the part that proves it. Below
 * that the steps stack, each with its own screenshot under its text.
 */
export function WalkShowcase() {
  const t = useTranslations("landing.walk");
  const locale = useLocale();
  const steps = useRef<HTMLOListElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const inView = useInView(frame);
  const allowed = useMotionAllowed();

  // The step being read is the last one whose top has passed a line level with the frame's lower
  // edge. Worked out from positions on every scroll, so a jump (the End key, a restored scroll
  // position) lands on the right step too.
  useEffect(() => {
    const list = steps.current;
    if (!list) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-step]")];
    let pending = 0;
    const update = () => {
      pending = 0;
      const line = window.innerHeight * READ_LINE;
      const passed = items.filter(
        (item) => item.getBoundingClientRect().top <= line,
      ).length;
      setActive(Math.max(0, passed - 1));
    };
    const schedule = () => {
      if (!pending) pending = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(pending);
    };
  }, []);

  const image = (step: (typeof STEPS)[number]) =>
    shotImage(step.shot, locale, t(`steps.${step.key}.alt`));

  return (
    <section
      aria-labelledby="walk-title"
      className="mx-auto mt-24 w-full max-w-6xl sm:mt-32"
    >
      <div className="max-w-2xl">
        <h2
          id="walk-title"
          className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          {t("title")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>
      </div>

      <div className="mt-6 lg:mt-14 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        {/* Each step but the last is most of a window tall, so its frame holds while it is read;
            the last ends with its text, so no empty stretch follows it. */}
        <ol ref={steps}>
          {STEPS.map((step, index) => {
            const current = index === active;
            return (
              <li
                key={step.key}
                data-step={index}
                className={cn(
                  "py-8 lg:min-h-[60vh] lg:border-l-2 lg:py-2 lg:pb-16 lg:pl-8 lg:transition-colors lg:duration-300 lg:last:min-h-0 lg:last:pb-2",
                  current ? "lg:border-primary" : "lg:border-border",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border border-primary bg-primary text-sm font-semibold tabular-nums text-primary-foreground lg:transition-colors lg:duration-300",
                    !current &&
                      "lg:border-border lg:bg-background lg:text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <h3
                  className={cn(
                    "mt-4 text-xl font-semibold tracking-tight text-balance sm:text-2xl lg:transition-colors lg:duration-300",
                    !current && "lg:text-muted-foreground",
                  )}
                >
                  {t(`steps.${step.key}.title`)}
                </h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {t(`steps.${step.key}.text`)}
                </p>
                <AutoShot
                  image={image(step)}
                  sizes={zoomSizes(step.shot, FRAME_PX)}
                  className="mt-6 rounded-xl border border-border/60 shadow-md lg:hidden"
                />
              </li>
            );
          })}
        </ol>

        {/* The frame holds in the middle of the window (Simon, 04.10.2026): half a window down,
            less half its own height, which is 9/16 of the column's width (28.125cqw). Never
            higher than below the navigation, on a window too short to centre it. */}
        <div className="@container hidden lg:block">
          <div className="sticky top-[max(6rem,calc(50vh-28.125cqw))]">
            <div
              ref={frame}
              className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted shadow-lg"
            >
              {/* Stacked in step order. A step's screenshot fades in over the one before it, and
                  out again over it on the way back, so there is always an opaque one beneath. */}
              {STEPS.map((step, index) => (
                <LoopingImage
                  key={step.key}
                  image={image(step)}
                  sizes={zoomSizes(step.shot, FRAME_PX)}
                  faded={index > active}
                  hidden={index !== active}
                  running={inView && allowed && index === active}
                  className={index === 0 ? undefined : "absolute inset-0"}
                />
              ))}
              <MotionToggle className="absolute right-3 bottom-3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
