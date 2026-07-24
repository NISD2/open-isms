"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WalkthroughStep } from "./types";

/** Bump a tour's version to force it to re-show even for users who already dismissed it. */
const TOUR_VERSIONS: Record<string, number> = {
  journey: 1,
  requirement: 1,
};

function storageKey(tourId: string): string {
  return `walkthrough:${tourId}:v${TOUR_VERSIONS[tourId] ?? 1}`;
}

function isStepAvailable(step: WalkthroughStep): boolean {
  if (typeof document === "undefined") return false;
  const target = document.getElementById(step.targetId);
  // offsetParent is null for display:none elements, e.g. legend/columns hidden
  // below a breakpoint or on the non-swimlane ordering — skip those steps too.
  const present = target !== null && target.offsetParent !== null;
  if (!present && step.optional === false && process.env.NODE_ENV !== "production") {
    console.warn(
      `[walkthrough] required target #${step.targetId} not found for step "${step.id}"`,
    );
  }
  return present;
}

function firstAvailableFrom(steps: WalkthroughStep[], startIndex: number): number {
  for (let i = startIndex; i < steps.length; i++) {
    if (isStepAvailable(steps[i])) return i;
  }
  return -1;
}

export type UseWalkthroughResult = {
  isOpen: boolean;
  currentStep: WalkthroughStep | null;
  stepIndex: number;
  totalSteps: number;
  next: () => void;
  skip: () => void;
  restart: () => void;
};

/** Owns the open/step/persistence state for a single anchored coach-mark tour. */
export function useWalkthrough(tourId: string, steps: WalkthroughStep[]): UseWalkthroughResult {
  const [isOpen, setIsOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const open = useCallback(() => {
    const index = firstAvailableFrom(stepsRef.current, 0);
    if (index === -1) return;
    setCurrentId(stepsRef.current[index].id);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(storageKey(tourId))) return;
    // Let the page finish its first paint before anchoring to elements.
    const timer = setTimeout(open, 300);
    return () => clearTimeout(timer);
  }, [tourId, open]);

  const finish = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(tourId), "seen");
    }
    setIsOpen(false);
    setCurrentId(null);
  }, [tourId]);

  const next = useCallback(() => {
    const list = stepsRef.current;
    const currentIndex = list.findIndex((s) => s.id === currentId);
    const nextIndex = firstAvailableFrom(list, currentIndex + 1);
    if (nextIndex === -1) {
      finish();
      return;
    }
    setCurrentId(list[nextIndex].id);
  }, [currentId, finish]);

  const availableSteps = isOpen ? steps.filter(isStepAvailable) : [];
  const stepIndex = availableSteps.findIndex((s) => s.id === currentId);
  const currentStep = stepIndex >= 0 ? availableSteps[stepIndex] : null;

  return {
    isOpen: isOpen && currentStep !== null,
    currentStep,
    stepIndex: Math.max(stepIndex, 0),
    totalSteps: availableSteps.length,
    next,
    skip: finish,
    restart: open,
  };
}
