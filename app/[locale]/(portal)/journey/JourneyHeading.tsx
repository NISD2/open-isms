type Locale = "en" | "de" | "nl";

/**
 * The journey page's title and its progress figure.
 *
 * Shared with the /journey-preview design route, which renders the same two
 * layouts and had grown its own copy of both. One definition, so a wording or
 * rounding change cannot land on only one of them.
 *
 * The title carried a subtitle, "one step at a time, here is your next one",
 * which promised exactly what the bar one line below it delivers by name. Both
 * layouts now show the live step in their own chrome, so the sentence was
 * describing the page to someone already looking at it.
 */
export function JourneyHeading({ locale }: { locale: Locale }) {
  const de = locale === "de";
  return (
    <h1 className="text-2xl font-semibold tracking-tight">
      {de ? "Ihr Weg" : "Your path"}
    </h1>
  );
}

/** Compact overall-progress indicator for the header (no full-width bar). */
export function ProgressChip({
  done,
  total,
  locale,
}: {
  done: number;
  total: number;
  locale: Locale;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="shrink-0 text-right">
      <div className="text-xl font-semibold leading-none tabular-nums">{pct}%</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {done}/{total} {locale === "de" ? "erledigt" : "done"}
      </div>
    </div>
  );
}
