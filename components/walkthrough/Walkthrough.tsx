"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WalkthroughStep } from "./types";

const CARD_WIDTH = 288;
const CARD_MARGIN = 12;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function Walkthrough({
  isOpen,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
  ns,
}: {
  isOpen: boolean;
  step: WalkthroughStep | null;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  ns: string;
}) {
  const t = useTranslations(ns);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen || !step) {
      setRect(null);
      return;
    }
    const target = document.getElementById(step.targetId);
    if (!target) {
      setRect(null);
      return;
    }

    const reduce = prefersReducedMotion();
    target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(target.getBoundingClientRect()));
    };
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(target);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen && step) cardRef.current?.focus();
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onSkip]);

  if (!mounted || !isOpen || !step || !rect) return null;

  const placement = step.placement ?? "bottom";
  const cardPos = cardPosition(rect, placement);
  const isLast = stepIndex >= totalSteps - 1;

  return createPortal(
    <>
      <div
        aria-hidden
        className={cn(
          "fixed z-[100] rounded-md pointer-events-none",
          prefersReducedMotion() ? "" : "transition-[top,left,width,height] duration-200",
        )}
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          outline: "2px solid var(--primary)",
          outlineOffset: 2,
        }}
      />
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-label={t(step.titleKey)}
        className="fixed z-[101] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden"
        style={cardPos}
      >
        <p className="text-xs font-medium text-muted-foreground">
          {t("common.stepProgress", { current: stepIndex + 1, total: totalSteps })}
        </p>
        <p className="mt-1 text-sm font-semibold">{t(step.titleKey)}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(step.bodyKey)}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
            {t("common.skip")}
          </Button>
          <Button type="button" size="sm" onClick={onNext}>
            {isLast ? t("common.done") : t("common.next")}
          </Button>
        </div>
      </div>
    </>,
    document.body,
  );
}

function cardPosition(
  rect: DOMRect,
  placement: NonNullable<WalkthroughStep["placement"]>,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top: number;
  let left: number;

  switch (placement) {
    case "top":
      top = rect.top - CARD_MARGIN;
      left = rect.left + rect.width / 2 - CARD_WIDTH / 2;
      top -= 120; // approximate card height so it sits above the target
      break;
    case "left":
      top = rect.top;
      left = rect.left - CARD_WIDTH - CARD_MARGIN;
      break;
    case "right":
      top = rect.top;
      left = rect.right + CARD_MARGIN;
      break;
    case "bottom":
    default:
      top = rect.bottom + CARD_MARGIN;
      left = rect.left + rect.width / 2 - CARD_WIDTH / 2;
      break;
  }

  left = Math.min(Math.max(left, CARD_MARGIN), vw - CARD_WIDTH - CARD_MARGIN);
  top = Math.min(Math.max(top, CARD_MARGIN), vh - CARD_MARGIN);

  return { top, left };
}
