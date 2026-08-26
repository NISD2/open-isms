"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Portal } from "radix-ui";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type { TourStep } from "./steps";

/** Breathing room between the highlighted element and the blurred surround. */
const SPOTLIGHT_PADDING = 6;

/**
 * Track the on-screen box of the element this step points at.
 *
 * Returns null until the element has been found and measured, which is also
 * what keeps the overlay off the server render and off the first client paint.
 */
function useTargetRect(target: string): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector(`[data-tour="${target}"]`);
    if (!(element instanceof HTMLElement)) {
      setRect(null);
      return;
    }

    // Instant rather than smooth: the card anchors to the measured box, and a
    // running smooth scroll leaves that measurement stale for its whole
    // duration. The blurred surround already makes the jump legible.
    //
    // A target taller than the viewport is left where it is. Centring one
    // scrolls its top off the screen, and for the board that top edge —
    // column headers and the first section — is the part worth looking at.
    if (element.getBoundingClientRect().height < window.innerHeight) {
      element.scrollIntoView({ block: "center", behavior: "auto" });
    }

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setRect(element.getBoundingClientRect()),
      );
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [target]);

  return rect;
}

/**
 * The lit area, clamped to the viewport.
 *
 * The board is taller than the screen, so its raw rect runs past the bottom
 * edge. Clamping keeps the ring on the part the user can actually see instead
 * of drawing three sides of a frame off into space, and gives the scrim the
 * same box so the two cannot disagree about where the hole is.
 */
function spotlight(rect: DOMRect) {
  const top = Math.max(rect.top - SPOTLIGHT_PADDING, 0);
  const bottom = Math.min(rect.bottom + SPOTLIGHT_PADDING, window.innerHeight);
  const left = Math.max(rect.left - SPOTLIGHT_PADDING, 0);
  const right = Math.min(rect.right + SPOTLIGHT_PADDING, window.innerWidth);
  return {
    top,
    left,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
    bottom,
    right,
  };
}

/** The clamped box as a style object for the ring. */
function spotlightBox(rect: DOMRect): CSSProperties {
  const { top, left, width, height } = spotlight(rect);
  return { top, left, width, height };
}

/**
 * The four panels that cover the viewport except for the target.
 *
 * A single element with a giant spread box-shadow is the shorter trick, but it
 * can only darken. Four real panels can carry a backdrop filter, so everything
 * except the thing being explained is actually blurred out.
 */
function scrimPanels(rect: DOMRect): readonly CSSProperties[] {
  const { top, left, bottom, right, height } = spotlight(rect);
  return [
    { top: 0, left: 0, right: 0, height: top },
    { top: bottom, left: 0, right: 0, bottom: 0 },
    { top, left: 0, width: left, height },
    { top, left: right, right: 0, height },
  ];
}

export function TourOverlay({
  step,
  index,
  total,
  onNext,
  onClose,
}: {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("guide");
  const rect = useTargetRect(step.target);

  if (!rect) return null;

  const isLast = index === total - 1;

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      {/*
        Portalled to the body: this renders from inside the sticky portal
        header, whose own z-index would otherwise trap a fixed child beneath
        the page content it is supposed to cover.
      */}
      <Portal.Root>
        {scrimPanels(rect).map((style, panel) => (
          <div
            key={panel}
            aria-hidden
            style={style}
            className="fixed z-50 bg-background/30 backdrop-blur-[1px]"
          />
        ))}
        <PopoverAnchor asChild>
          <div
            aria-hidden
            className="pointer-events-none fixed z-50 rounded-md ring-2 ring-primary"
            style={spotlightBox(rect)}
          />
        </PopoverAnchor>
      </Portal.Root>

      <PopoverContent
        data-testid="tour-card"
        side={step.side ?? "bottom"}
        collisionPadding={16}
        className="z-50 w-80"
      >
        <p
          data-testid="tour-progress"
          className="text-xs font-medium text-muted-foreground"
        >
          {t("tour.progress", { current: index + 1, total })}
        </p>
        <p className="mt-1 text-sm font-semibold">
          {t(`tour.steps.${step.key}.title`)}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t(`tour.steps.${step.key}.body`)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="tour-skip"
            onClick={onClose}
          >
            {t("tour.skip")}
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="tour-next"
            onClick={isLast ? onClose : onNext}
          >
            {isLast ? t("tour.done") : t("tour.next")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
