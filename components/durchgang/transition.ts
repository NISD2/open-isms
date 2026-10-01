import type { CSSProperties } from "react";
import { flushSync } from "react-dom";

export type Direction = "forward" | "back";

/** Only the stage takes part in the screen transition; header, rail and footer stay put. */
export const STAGE: CSSProperties = { viewTransitionName: "dg-stage" };
export const PROGRESS: CSSProperties = { viewTransitionName: "dg-progress" };

/**
 * Run a state change as a screen transition where the browser supports it. The direction decides
 * which way the stage slides (see transitions.css); without support, or with reduced motion, the
 * change simply happens.
 */
export function transition(direction: Direction, update: () => void): void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("startViewTransition" in document)) {
    update();
    window.scrollTo({ top: 0 });
    return;
  }
  const root = document.documentElement;
  root.dataset.dgDir = direction;
  const run = document.startViewTransition(() => {
    flushSync(update);
    window.scrollTo({ top: 0 });
  });
  run.finished.finally(() => {
    delete root.dataset.dgDir;
  });
}
