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
/** Held at each stop long enough to read the part that matters. */
const HOLD_MS = 2600;
/** Whole again before the next round, so the eye finds the screen before it moves. */
const REST_MS = 1800;

/**
 * One beat of the loop. A round is: the whole screen, each stop in turn (zooming into the first,
 * gliding on to the next), then zooming back out. `stop` is the stop shown (null: the whole
 * screen) and `wait` how long until the next beat; null once every round is played.
 */
export const loopBeat = (
  phase: number,
  stops: number,
  rounds: number,
): { readonly stop: number | null; readonly wait: number | null } => {
  const length = stops + 2;
  if (phase >= rounds * length) return { stop: null, wait: null };
  const beat = phase % length;
  if (beat === 0) return { stop: null, wait: phase === 0 ? FIRST_LOOK_MS : REST_MS };
  if (beat <= stops) return { stop: beat - 1, wait: ZOOM_MS + HOLD_MS };
  return { stop: null, wait: ZOOM_MS };
};

/**
 * The zoom loop, for as long as `running`, `rounds` times (unlimited by default). Pausing or
 * scrolling away shows the screen whole and starts the current round over; rounds already played
 * stay played. Returns the stop shown, the round it belongs to (so several screenshots can take
 * turns), whether every round is played, and `replay` to start again from the first.
 */
export function useZoomLoop(
  running: boolean,
  stops = 1,
  rounds = Number.POSITIVE_INFINITY,
) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const { wait } = loopBeat(phase, stops, rounds);
    if (wait === null) return;
    if (!running) {
      setPhase(phase - (phase % (stops + 2)));
      return;
    }
    const timer = window.setTimeout(() => setPhase((p) => p + 1), wait);
    return () => window.clearTimeout(timer);
  }, [running, phase, stops, rounds]);

  const { stop, wait } = loopBeat(phase, stops, rounds);
  const shown = running ? stop : null;
  return {
    stop: shown,
    round: shown === null ? null : Math.floor(phase / (stops + 2)),
    ended: wait === null,
    replay: () => setPhase(0),
  };
}
