/**
 * A page of log entries that fits an answer without being cut. An answer cut at its end would hide
 * the entries after the cut while its cursor still pointed past them, so a reader following the
 * cursor skipped those rows. Pure.
 */

export interface PageCursor {
  readonly at: string;
  readonly id: string;
}

export interface Paged {
  /** Where reading on from this entry starts. */
  readonly cursor: PageCursor;
}

export interface FittedPage<E> {
  readonly kept: readonly E[];
  /** Where the next page starts; null when this page reaches the end. */
  readonly nextCursor: PageCursor | null;
}

/**
 * The most entries from the front of `entries` for which `fits` holds, at least one: a single
 * entry too big for the answer is returned alone, as dropping it would end the log there.
 * `fits` must hold for fewer entries whenever it holds for more, which lets a search find the
 * cut with a few checks instead of one per entry.
 * `fallback` is the cursor of the page as asked for (null when it was the last page); it is used
 * unchanged when nothing had to be dropped.
 */
export function fitPage<E extends Paged>(
  entries: readonly E[],
  fits: (kept: readonly E[]) => boolean,
  fallback: PageCursor | null,
): FittedPage<E> {
  if (entries.length === 0 || fits(entries))
    return { kept: entries, nextCursor: fallback };
  // Invariant: `low` entries fit (or are the one entry that is kept regardless), `high` do not.
  const search = (low: number, high: number): number =>
    high - low <= 1
      ? low
      : fits(entries.slice(0, Math.floor((low + high) / 2)))
        ? search(Math.floor((low + high) / 2), high)
        : search(low, Math.floor((low + high) / 2));
  const keptCount = search(1, entries.length);
  const kept = entries.slice(0, keptCount);
  // Nothing dropped (one entry, too big alone): the page ends where it was asked to end.
  return {
    kept,
    nextCursor:
      keptCount === entries.length ? fallback : (kept.at(-1)?.cursor ?? fallback),
  };
}
