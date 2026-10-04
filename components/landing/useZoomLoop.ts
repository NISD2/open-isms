import { useEffect, useState } from "react";

/** One zoom, in or out. Slower than an interface reply, because it moves the whole screen. */
export const ZOOM_MS = 1400;
/**
 * Ease in and out: the zoom starts by itself from rest and comes back to rest, so both ends
 * ease. The walk's ease-out curve is for motion that answers a click.
 */
export const ZOOM_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
/** The whole screen shows this long first, so the zoom reads as moving into it. */
const FIRST_LOOK_MS = 1600;
/** Zoomed in long enough to read the part that matters. */
const HOLD_MS = 2600;
/** Whole again before the next zoom, so the eye finds the screen before it moves. */
const REST_MS = 1800;

/**
 * The zoom loop. While `running`: the whole screen, zoom in, hold, zoom out, rest, and again.
 * Returns the number of the zoom being held (0, 1, 2 …), so several screenshots can take turns,
 * or null while the screen shows whole. Stopping shows it whole and starts over.
 */
export function useZoomLoop(running: boolean): number | null {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!running) {
      setPhase(0);
      return;
    }
    const wait =
      phase === 0 ? FIRST_LOOK_MS : ZOOM_MS + (phase % 2 === 1 ? HOLD_MS : REST_MS);
    const timer = window.setTimeout(() => setPhase((p) => p + 1), wait);
    return () => window.clearTimeout(timer);
  }, [running, phase]);

  return running && phase % 2 === 1 ? (phase - 1) / 2 : null;
}
