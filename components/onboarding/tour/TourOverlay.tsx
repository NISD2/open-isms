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
function useTargetRect(target: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const element = document.querySelector(`[data-tour="${target}"]`);
    if (!(element instanceof HTMLElement)) {
      setRect(null);
      return;
    }

    // Instant rather than smooth: the card anchors to the measured box, and a
    // running smooth scroll leaves that measurement stale for its whole
    // duration. The blurred surround already makes the jump legible.
    element.scrollIntoView({ block: "center", behavior: "auto" });

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
 * The four panels that cover the viewport except for the target.
 *
 * A single element with a giant spread box-shadow is the shorter trick, but it
 * can only darken. Four real panels can carry a backdrop filter, so everything
 * except the thing being explained is actually blurred out.
 */
function scrimPanels(rect: DOMRect): readonly CSSProperties[] {
  const top = Math.max(rect.top - SPOTLIGHT_PADDING, 0);
  const bottom = Math.min(rect.bottom + SPOTLIGHT_PADDING, window.innerHeight);
  const left = Math.max(rect.left - SPOTLIGHT_PADDING, 0);
  const right = Math.min(rect.right + SPOTLIGHT_PADDING, window.innerWidth);
  const height = Math.max(bottom - top, 0);

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

  // A targeted step waits for its measurement; an establishing step has
  // nothing to measure and renders immediately.
  if (step.target && !rect) return null;

  const isLast = index === total - 1;

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      {/*
        Portalled to the body: this renders from inside the sticky portal
        header, whose own z-index would otherwise trap a fixed child beneath
        the page content it is supposed to cover.
      */}
      <Portal.Root>
        {rect ? (
          scrimPanels(rect).map((style, panel) => (
            <div
              key={panel}
              aria-hidden
              style={style}
              className="fixed z-50 bg-background/30 backdrop-blur-[1px]"
            />
          ))
        ) : (
          <div
            aria-hidden
            className="fixed inset-0 z-50 bg-background/30 backdrop-blur-[1px]"
          />
        )}
        <PopoverAnchor asChild>
          {rect ? (
            <div
              aria-hidden
              className="pointer-events-none fixed z-50 rounded-md ring-2 ring-primary"
              style={{
                top: rect.top - SPOTLIGHT_PADDING,
                left: rect.left - SPOTLIGHT_PADDING,
                width: rect.width + SPOTLIGHT_PADDING * 2,
                height: rect.height + SPOTLIGHT_PADDING * 2,
              }}
            />
          ) : (
            /* Zero-size anchor at the centre of the viewport, so the card
               lands in the middle of the dimmed screen. */
            <div
              aria-hidden
              className="pointer-events-none fixed left-1/2 top-1/2 z-50 size-0"
            />
          )}
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
