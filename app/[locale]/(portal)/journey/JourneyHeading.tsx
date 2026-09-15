type Locale = "en" | "de" | "nl";

/**
 * The journey page's title block and its progress figure.
 *
 * Shared with the /journey-preview design route, which renders the same two
 * layouts and had grown its own copy of both. One definition, so a wording or
 * rounding change cannot land on only one of them.
 */
export function JourneyHeading({ locale }: { locale: Locale }) {
  const de = locale === "de";
  return (
    <div className="space-y-0.5">
      <h1 className="text-2xl font-semibold tracking-tight">
        {de ? "Ihr Weg" : "Your path"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {de
          ? "Ein Schritt nach dem anderen. Hier ist Ihr nächster."
          : "One step at a time. Here is your next one."}
      </p>
    </div>
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
