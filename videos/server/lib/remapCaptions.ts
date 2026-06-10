export type RemovedInterval = { startMs: number; endMs: number };
export type Caption = { text: string; startMs: number; endMs: number };

/**
 * Given word-level captions and a sorted list of removed time intervals,
 * shifts all caption timestamps to reflect the new (gap-edited) timeline.
 */
export function remapCaptions(
  captions: Caption[],
  removedIntervals: RemovedInterval[],
): Caption[] {
  // Intervals must be sorted by startMs
  const sorted = [...removedIntervals].sort((a, b) => a.startMs - b.startMs);

  function cumulativeRemovedBefore(ms: number): number {
    let total = 0;
    for (const interval of sorted) {
      if (interval.endMs <= ms) {
        total += interval.endMs - interval.startMs;
      } else if (interval.startMs < ms) {
        total += ms - interval.startMs;
      } else {
        break;
      }
    }
    return total;
  }

  function isRemoved(startMs: number, endMs: number): boolean {
    for (const interval of sorted) {
      if (interval.startMs <= startMs && interval.endMs >= endMs) return true;
      if (interval.startMs > endMs) break;
    }
    return false;
  }

  const remapped: Caption[] = [];
  for (const caption of captions) {
    if (isRemoved(caption.startMs, caption.endMs)) continue;
    remapped.push({
      text: caption.text,
      startMs: caption.startMs - cumulativeRemovedBefore(caption.startMs),
      endMs: caption.endMs - cumulativeRemovedBefore(caption.endMs),
    });
  }
  return remapped;
}
