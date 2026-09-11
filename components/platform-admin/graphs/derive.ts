/**
 * Derivations for the Graphs tab.
 *
 * Every number on the tab is folded out of the same two fact lists the server
 * returns, so two cards can never disagree about the same quantity. All pure:
 * given the same facts and the same window they return the same rows.
 */

import type { CompanyFact, CourseId, UserFact } from "@/lib/platform-admin/growth";

/** One bar: a label, its value, and an optional second line under it. */
export interface Bar {
  label: string;
  value: number;
  /** Shown under the label — a conversion rate, a share, a caveat. */
  hint?: string;
  /** Drawn in the accent rather than the neutral track colour. */
  emphasis?: boolean;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lower = sorted[mid - 1];
  const upper = sorted[mid];
  if (sorted.length % 2 === 1) return upper ?? null;
  return lower === undefined || upper === undefined ? null : (lower + upper) / 2;
}

export function percent(part: number, whole: number): string {
  if (whole <= 0) return "—";
  if (part === 0) return "0%";
  const share = part / whole;
  return `${(share * 100).toFixed(share >= 0.1 ? 0 : 1)}%`;
}

/** Whole days between two calendar days; negative if `to` precedes `from`. */
export function dayGap(from: string, to: string): number {
  const ms = Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Calendar months between two "YYYY-MM" keys. */
export function monthGap(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  if (!fy || !fm || !ty || !tm) return 0;
  return (ty - fy) * 12 + (tm - fm);
}

// ---------------------------------------------------------------------------
// Banding
// ---------------------------------------------------------------------------

/**
 * Company-size bands on the statutory lines rather than round numbers: 50 and
 * 250 employees are where NIS 2's size-cap rule changes the answer, and 50-249
 * is also who we sell to, which is why that band is the emphasised one.
 */
const SIZE_BANDS = ["Under 50", "50 to 249", "250 or more", "Not stated"] as const;

function sizeBand(employeeCount: number | null): (typeof SIZE_BANDS)[number] {
  if (employeeCount === null) return "Not stated";
  if (employeeCount < 50) return "Under 50";
  if (employeeCount < 250) return "50 to 249";
  return "250 or more";
}

const LAG_BANDS = [
  "Same day",
  "1 to 3 days",
  "4 to 7 days",
  "8 to 30 days",
  "Over 30 days",
] as const;

function lagBand(days: number): (typeof LAG_BANDS)[number] {
  if (days <= 0) return "Same day";
  if (days <= 3) return "1 to 3 days";
  if (days <= 7) return "4 to 7 days";
  if (days <= 30) return "8 to 30 days";
  return "Over 30 days";
}

const SEAT_BANDS = ["1 person", "2 people", "3 to 5", "6 to 10", "11 or more"] as const;

function seatBand(seats: number): (typeof SEAT_BANDS)[number] {
  if (seats <= 1) return "1 person";
  if (seats === 2) return "2 people";
  if (seats <= 5) return "3 to 5";
  if (seats <= 10) return "6 to 10";
  return "11 or more";
}

const PROGRESS_BANDS = [
  "Nothing yet",
  "1 to 24%",
  "25 to 49%",
  "50 to 74%",
  "75 to 99%",
  "All 49 done",
] as const;

function progressBand(pct: number): (typeof PROGRESS_BANDS)[number] {
  if (pct <= 0) return "Nothing yet";
  if (pct < 25) return "1 to 24%";
  if (pct < 50) return "25 to 49%";
  if (pct < 75) return "50 to 74%";
  if (pct < 100) return "75 to 99%";
  return "All 49 done";
}

/** Count occurrences into a fixed, ordered band list. Empty bands stay. */
function tally<T extends string>(values: T[], bands: readonly T[], total: number): Bar[] {
  const counts = new Map<T, number>(bands.map((b) => [b, 0]));
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return bands.map((band) => ({
    label: band,
    value: counts.get(band) ?? 0,
    hint: percent(counts.get(band) ?? 0, total),
  }));
}

/**
 * Free-text categories (sector, country, language): biggest first, with
 * everything past `top` folded into one row rather than given its own hue.
 */
function rank(values: Array<string | null>, top: number, unknown: string): Bar[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const label = raw && raw.trim() !== "" ? raw : unknown;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const total = values.length;
  const sorted = Array.from(counts, ([label, value]) => ({ label, value })).sort(
    (a, b) => b.value - a.value || a.label.localeCompare(b.label),
  );
  const head = sorted.slice(0, top);
  const tail = sorted.slice(top);
  const rows = [...head];
  if (tail.length > 0) {
    rows.push({
      label: `Other (${tail.length})`,
      value: tail.reduce((sum, r) => sum + r.value, 0),
    });
  }
  return rows.map((r) => ({ ...r, hint: percent(r.value, total) }));
}

// ---------------------------------------------------------------------------
// Funnels
// ---------------------------------------------------------------------------

/**
 * Signup to signed-off work, as strictly nested sets: every stage filters the
 * one above it, so the bars can only ever shrink and a conversion rate always
 * means what it says.
 *
 * Disposable-address signups are dropped before stage one. They are recorded
 * deliberately (so bot traffic is visible) but can never verify, so leaving
 * them in would understate every rate below.
 */
export function signupFunnel(users: UserFact[]): Bar[] {
  const real = users.filter((u) => !u.disposable);
  const verified = real.filter((u) => u.verified);
  const activated = verified.filter((u) => u.activatedDay !== null);
  const worked = activated.filter((u) => u.workEvents > 0);
  const signed = worked.filter((u) => u.signOffs > 0);

  const stages: Array<{ label: string; rows: UserFact[] }> = [
    { label: "Signed up", rows: real },
    { label: "Verified their address", rows: verified },
    { label: "Named their organisation", rows: activated },
    { label: "Did any work in it", rows: worked },
    { label: "Signed off a requirement", rows: signed },
  ];

  const excluded = users.length - real.length;
  return stages.map((stage, i) => {
    const previous = stages[i - 1];
    return {
      label: stage.label,
      value: stage.rows.length,
      hint:
        previous === undefined
          ? excluded > 0
            ? `${excluded} disposable-address signups excluded`
            : "every signup in range"
          : `${percent(stage.rows.length, previous.rows.length)} of the step above`,
    };
  });
}

/** The same shape for one course: signed up, opened it, finished every lesson. */
export function courseFunnel(users: UserFact[], courseId: CourseId): Bar[] {
  const real = users.filter((u) => !u.disposable);
  const started = real.filter((u) => u.coursesStarted.includes(courseId));
  const finished = started.filter((u) =>
    u.coursesFinished.some((c) => c.courseId === courseId),
  );
  const stages = [
    { label: "Signed up", rows: real },
    { label: "Opened a lesson", rows: started },
    { label: "Finished every lesson", rows: finished },
  ];
  return stages.map((stage, i) => {
    const previous = stages[i - 1];
    return {
      label: stage.label,
      value: stage.rows.length,
      hint:
        previous === undefined
          ? "all signups in range"
          : `${percent(stage.rows.length, previous.rows.length)} of the step above`,
    };
  });
}

// ---------------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------------

export function sectorBars(companies: CompanyFact[]): Bar[] {
  return rank(
    companies.map((c) => c.sector),
    9,
    "Not stated",
  );
}

export function countryBars(companies: CompanyFact[]): Bar[] {
  return rank(
    companies.map((c) => c.country?.toUpperCase() ?? null),
    7,
    "Not stated",
  );
}

export function localeBars(users: UserFact[]): Bar[] {
  return rank(
    users.map((u) => (u.locale === "unknown" ? null : u.locale.toUpperCase())),
    7,
    "Never set",
  );
}

export function sizeBars(companies: CompanyFact[]): Bar[] {
  return tally(
    companies.map((c) => sizeBand(c.employeeCount)),
    SIZE_BANDS,
    companies.length,
  ).map((bar) => ({ ...bar, emphasis: bar.label === "50 to 249" }));
}

export function seatBars(companies: CompanyFact[]): Bar[] {
  return tally(
    companies.map((c) => seatBand(c.seats)),
    SEAT_BANDS,
    companies.length,
  );
}

export function progressBars(companies: CompanyFact[]): Bar[] {
  return tally(
    companies.map((c) => progressBand(c.compliancePct)),
    PROGRESS_BANDS,
    companies.length,
  );
}

const QUESTIONNAIRE_BANDS = [
  "Nothing yet",
  "1 to 24%",
  "25 to 49%",
  "50 to 74%",
  "75 to 99%",
  "Everything answered",
] as const;

function questionnaireBand(pct: number): (typeof QUESTIONNAIRE_BANDS)[number] {
  if (pct <= 0) return "Nothing yet";
  if (pct < 25) return "1 to 24%";
  if (pct < 50) return "25 to 49%";
  if (pct < 75) return "50 to 74%";
  if (pct < 100) return "75 to 99%";
  return "Everything answered";
}

/**
 * How far through the supplier questionnaire each supplier has got. Companies
 * that are not suppliers are absent rather than zero: they were never asked.
 */
export function questionnaireBars(companies: CompanyFact[]): Bar[] {
  const suppliers = companies.flatMap((c) =>
    c.questionnairePct === null ? [] : [questionnaireBand(c.questionnairePct)],
  );
  return tally(suppliers, QUESTIONNAIRE_BANDS, suppliers.length);
}

/** Answered percentages, suppliers only — the input to a median. */
export function questionnairePercents(companies: CompanyFact[]): number[] {
  return companies.flatMap((c) =>
    c.questionnairePct === null ? [] : [c.questionnairePct],
  );
}

export function activationLagBars(users: UserFact[]): Bar[] {
  const lags = activationLags(users);
  return tally(lags.map(lagBand), LAG_BANDS, lags.length);
}

export function firstWorkLagBars(users: UserFact[]): Bar[] {
  const lags = firstWorkLags(users);
  return tally(lags.map(lagBand), LAG_BANDS, lags.length);
}

/** Days from signup to the org being named, for everyone who got there. */
export function activationLags(users: UserFact[]): number[] {
  return users.flatMap((u) =>
    u.activatedDay === null ? [] : [Math.max(0, dayGap(u.signupDay, u.activatedDay))],
  );
}

/** Days from signup to the first recorded piece of work. */
export function firstWorkLags(users: UserFact[]): number[] {
  return users.flatMap((u) => {
    const first = u.activeDays[0];
    return first === undefined ? [] : [Math.max(0, dayGap(u.signupDay, first))];
  });
}

/** Distinct people with at least one work event inside the window. */
export function activePeople(users: UserFact[], start: string, end: string): number {
  return users.filter((u) => u.activeDays.some((day) => day >= start && day <= end))
    .length;
}

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

export interface CohortRow {
  /** "YYYY-MM". */
  cohort: string;
  size: number;
  /**
   * People from this cohort with recorded work in month N after signup.
   * `null` for months that have not happened yet, so an unfinished month
   * reads as blank rather than as a month where nobody came back.
   */
  retained: Array<number | null>;
}

/**
 * Monthly signup cohorts against the months they did work in.
 *
 * Month 0 is the signup month itself, which is why it is never 100%: plenty of
 * people sign up and never touch anything. That gap is the point of the chart.
 */
export function cohortMatrix(
  users: UserFact[],
  currentMonth: string,
  maxOffset = 6,
): CohortRow[] {
  const byCohort = new Map<string, UserFact[]>();
  for (const u of users) {
    if (u.disposable) continue;
    const cohort = u.signupDay.slice(0, 7);
    byCohort.set(cohort, [...(byCohort.get(cohort) ?? []), u]);
  }

  return Array.from(byCohort.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cohort, members]) => {
      const elapsed = monthGap(cohort, currentMonth);
      const retained = Array.from({ length: maxOffset + 1 }, (_, offset) => {
        if (offset > elapsed) return null;
        return members.filter((m) =>
          m.activeDays.some((day) => monthGap(cohort, day.slice(0, 7)) === offset),
        ).length;
      });
      return { cohort, size: members.length, retained };
    });
}
