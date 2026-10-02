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

/** How long a move to another page may hold the old screen before it simply switches. */
const ARRIVAL_LIMIT_MS = 4000;

/**
 * Moves to another item's page as the same screen transition: the browser holds the old stage
 * while the next page renders, then slides the new one in. `arrived` says when the new stage is
 * in the document; a page that takes too long switches without waiting further.
 */
export function transitionTo(
  direction: Direction,
  go: () => void,
  arrived: () => boolean,
): void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("startViewTransition" in document)) {
    go();
    return;
  }
  const root = document.documentElement;
  root.dataset.dgDir = direction;
  const run = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (arrived()) settle();
        });
        const limit = setTimeout(() => settle(), ARRIVAL_LIMIT_MS);
        function settle() {
          observer.disconnect();
          clearTimeout(limit);
          window.scrollTo({ top: 0 });
          resolve();
        }
        observer.observe(document.body, { childList: true, subtree: true });
        go();
      }),
  );
  run.finished.finally(() => {
    delete root.dataset.dgDir;
  });
}
