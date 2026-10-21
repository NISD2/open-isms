/**
 * When a person is likely at their desk, read from when they did things on the platform, for the
 * line "Good time to message or call" at the top of the admin's user dialog.
 *
 * Counted in distinct days, never in actions: a person who answers sixty quiz questions in one
 * afternoon was there once, so a long sitting cannot outvote the mornings they come back to. Read
 * in Berlin time, because that is the clock of whoever calls; the person's own time zone is not
 * stored (a company's country is mostly empty), and it is the same one in much of Europe.
 */
export const REACH_ZONE = "Europe/Berlin";

/** How far back the habit is read: older work says little about this month's mornings. */
export const REACH_DAYS = 90;

/** Fewer days than this is a coincidence, not a habit. */
export const MIN_ACTIVE_DAYS = 3;

/** A window backed by one day only is where they happened to be once, not a time to call. */
const MIN_WINDOW_DAYS = 2;

const WINDOW_HOURS = 2;
const WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as const;
const NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface ReachWindow {
  readonly fromHour: number;
  readonly toHour: number;
  /** On how many different days they did something in these hours. */
  readonly days: number;
}

export type Reach =
  | {
      readonly kind: "unknown";
      readonly activeDays: number;
      readonly lastSeen: Date | null;
    }
  | {
      readonly kind: "known";
      /** The best window first, then at most one more that is nearly as busy. */
      readonly windows: readonly ReachWindow[];
      /** ISO weekdays (1 Monday to 7 Sunday) on which they did something at least once. */
      readonly weekdays: readonly number[];
      readonly activeDays: number;
      readonly lastSeen: Date;
    };

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: REACH_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

function slotOf(at: Date) {
  const found = Object.fromEntries(parts.formatToParts(at).map((p) => [p.type, p.value]));
  const weekday = WEEKDAYS[found.weekday as keyof typeof WEEKDAYS];
  return {
    day: `${found.year}-${found.month}-${found.day}`,
    hour: Number(found.hour),
    weekday,
  };
}

const hoursOf = (from: number) =>
  Array.from({ length: WINDOW_HOURS }, (_, i) => (from + i) % 24);

/** Whether two windows share an hour, around midnight too. */
const overlap = (a: number, b: number) =>
  hoursOf(a).some((hour) => hoursOf(b).includes(hour));

export function bestTimeToReach(times: readonly Date[]): Reach {
  const slots = times.map(slotOf);
  const lastSeen = times.reduce<Date | null>(
    (latest, t) => (latest === null || t > latest ? t : latest),
    null,
  );
  const activeDays = new Set(slots.map((s) => s.day));
  if (lastSeen === null || activeDays.size < MIN_ACTIVE_DAYS) {
    return { kind: "unknown", activeDays: activeDays.size, lastSeen };
  }

  const daysAtHour = Array.from(
    { length: 24 },
    (_, hour) => new Set(slots.filter((s) => s.hour === hour).map((s) => s.day)),
  );
  const candidates = Array.from({ length: 24 }, (_, from) => ({
    from,
    days: new Set(hoursOf(from).flatMap((hour) => [...(daysAtHour[hour] ?? [])])).size,
    // A tie goes to the window that starts on the busier hour, so someone who is always on at
    // 07:30 gets 07:00 to 09:00 and not 06:00 to 08:00.
    firstHour: daysAtHour[from]?.size ?? 0,
  })).sort((a, b) => b.days - a.days || b.firstHour - a.firstHour || a.from - b.from);

  const best = candidates[0];
  if (!best || best.days < MIN_WINDOW_DAYS) {
    return { kind: "unknown", activeDays: activeDays.size, lastSeen };
  }
  const second = candidates.find(
    (c) => !overlap(c.from, best.from) && c.days >= Math.max(2, Math.ceil(best.days / 2)),
  );
  const windows = [best, ...(second ? [second] : [])]
    .map((c) => ({
      fromHour: c.from,
      toHour: (c.from + WINDOW_HOURS) % 24,
      days: c.days,
    }))
    .sort((a, b) => a.fromHour - b.fromHour);

  return {
    kind: "known",
    windows,
    weekdays: [...new Set(slots.map((s) => s.weekday))].sort((a, b) => a - b),
    activeDays: activeDays.size,
    lastSeen,
  };
}

const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** "07:00–09:00" */
export const formatWindow = (w: ReachWindow) => `${hour(w.fromHour)}–${hour(w.toHour)}`;

/** The weekdays as runs: "Tue–Fri", "Mon–Wed, Fri". */
export function formatWeekdays(days: readonly number[]): string {
  // `days` is sorted and unique: a run starts where the day before is missing, and ends at the
  // last day that follows on without a gap.
  return days
    .filter((day, i) => i === 0 || day !== (days[i - 1] ?? 0) + 1)
    .map((start) => {
      const end = days.reduce((last, day) => (day === last + 1 ? day : last), start);
      return start === end
        ? (NAMES[start] ?? "")
        : `${NAMES[start] ?? ""}–${NAMES[end] ?? ""}`;
    })
    .join(", ");
}
