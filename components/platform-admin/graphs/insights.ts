/**
 * The weekly read: up to three things worth doing something about.
 *
 * Rules, not a language model. The hard part of a panel like this is not the
 * writing, it is deciding which of twenty metrics matters this week — and a
 * model handed twenty numbers with no sense of what is normal here produces
 * confident, unstable filler that reads differently every week from data that
 * barely moved. A rule has a threshold you can argue with in review, gives the
 * same answer twice, costs nothing, and works on a self-hosted instance with no
 * API key. Every number below is computed, never phrased by anything.
 *
 * Deliberately **up to** three. A quiet week says so. Forcing three findings
 * out of a week where nothing crossed a line is how a panel becomes wallpaper.
 *
 * Fixed weekly window, independent of the range selector: a weekly check wants
 * a weekly answer, and findings that reshuffled while you browsed the charts
 * would be unreadable. That is why the panel sits above the filter row.
 */

import type { CompanyFact, DailyWorkRow, UserFact } from "@/lib/platform-admin/growth";
import { activePeople, percent } from "./derive";
import { addDays } from "./range";

export interface Insight {
  /** Stable across weeks, so a repeat finding is recognisable. */
  id: string;
  /** 0-100, for ranking only. Never shown. */
  severity: number;
  tone: "act" | "watch" | "good";
  /**
   * Whether this finding can change from one week to the next.
   *
   * "acute" describes something that happened in the window: activity
   * collapsed, the conversion rate moved, somebody signed off for the first
   * time in a month. "chronic" describes a standing population: people stuck
   * on a draft shell, course finishers who never came back. Both are worth
   * saying, but a panel that fills all three slots with chronic findings reads
   * identically every Monday, which is the failure this field exists to stop.
   */
  kind: "acute" | "chronic";
  /** What is true, in one line. */
  headline: string;
  /** The numbers behind it. */
  detail: string;
  /** What to do about it. */
  action: string;
}

interface Window {
  today: string;
  weekStart: string;
  /** The four whole weeks before this one, newest first. */
  baselineWeeks: Array<{ from: string; to: string }>;
}

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

const within = (day: string | null, from: string, to: string): boolean =>
  day !== null && day >= from && day <= to;

function buildWindow(today: string): Window {
  const weekStart = addDays(today, -6);
  return {
    today,
    weekStart,
    baselineWeeks: [1, 2, 3, 4].map((i) => ({
      from: addDays(weekStart, -7 * i),
      to: addDays(today, -7 * i),
    })),
  };
}

interface Facts {
  users: UserFact[];
  companies: CompanyFact[];
  work: DailyWorkRow[];
  window: Window;
}

/**
 * A chronic count and the same count a week ago, so the finding can report
 * movement rather than a level that never changes.
 *
 * Rewound from the facts themselves, never from stored history: a person's
 * signup day and activation day are both dates, so "was this account stuck
 * last Monday" is answerable today. Only used where the rewind is exact. A
 * rule whose inputs are current-only counters (the supplier questionnaire
 * percentage, lifetime event totals) reports its level and says nothing about
 * movement, because a guessed delta is worse than no delta.
 */
function movement(
  matches: (asOf: string) => number,
  today: string,
): { now: number; change: number } {
  const now = matches(today);
  return { now, change: now - matches(addDays(today, -7)) };
}

/**
 * Severity for a chronic finding: the size of the problem sets the base, and
 * this week's movement shifts it within bounds.
 *
 * Symmetric on purpose. Rewarding growth without penalising shrinkage was the
 * first version, and it meant a backlog being actively worked down scored the
 * same as one nobody had touched — so acting on the finding changed nothing
 * about what the panel said. The shift is bounded so a large problem recedes
 * when it improves without dropping off the page after one good week.
 */
function chronicSeverity({
  base,
  now,
  per,
  change,
  ceiling,
}: {
  base: number;
  now: number;
  /** How many people one severity point of "size" is worth. */
  per: number;
  change: number;
  ceiling: number;
}): number {
  const level = base + Math.round(now / per);
  const shift = Math.max(-10, Math.min(15, change * 2));
  return Math.max(20, Math.min(ceiling, level + shift));
}

/** "six more than last week", "26 fewer than last week", or the flat case. */
function movementPhrase(change: number, capitalised = false): string {
  const phrase =
    change > 0
      ? `${change} more than last week`
      : change < 0
        ? `${Math.abs(change)} fewer than last week`
        : "unchanged on last week";
  return capitalised ? phrase.charAt(0).toUpperCase() + phrase.slice(1) : phrase;
}

/** A rule returns null when nothing about it is worth a reader's attention. */
type Rule = (facts: Facts) => Insight | null;

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/**
 * Nobody did anything this week.
 *
 * Ranked highest when it is absolute, because a platform that went completely
 * quiet is usually a broken deploy rather than a demand signal, and that is
 * worth ten minutes before drawing any conclusion from the charts below.
 */
const activityCollapsed: Rule = ({ users, window: w }) => {
  const now = activePeople(users, w.weekStart, w.today);
  const baseline = mean(
    w.baselineWeeks.map((week) => activePeople(users, week.from, week.to)),
  );
  if (baseline < 1) return null;

  if (now === 0) {
    return {
      id: "activity-zero",
      severity: 95,
      kind: "acute",
      tone: "act",
      headline: "Nobody did any work in the platform this week",
      detail: `${baseline.toFixed(1)} people a week were active over the previous four weeks. This week: none.`,
      action:
        "Check the deploy and sign-in before reading anything else on this page as a demand signal.",
    };
  }

  const drop = (baseline - now) / baseline;
  if (drop < 0.4) return null;
  return {
    id: "activity-down",
    severity: Math.min(88, 45 + Math.round(drop * 50)),
    kind: "acute",
    tone: "act",
    headline: "Far fewer people did any work this week",
    detail: `${now} active this week against a four-week average of ${baseline.toFixed(1)}, down ${Math.round(drop * 100)} percent.`,
    action:
      "Open the Users tab and check whether the quiet accounts are recent signups who never got started, or regulars who stopped.",
  };
};

/**
 * Verified, given an organisation shell, never named it.
 *
 * The structural funnel gap: everyone who verifies gets a draft company
 * automatically, so this counts people who arrived, got a workspace, and never
 * described their organisation. Chronic rather than news, so the base severity
 * is moderate and only growth this week pushes it up — otherwise it would win
 * every week and the panel would stop being read.
 */
const draftShellBacklog: Rule = ({ users, window: w }) => {
  // Rewindable exactly: an account was stuck on a given day if it existed a
  // week before that day and had not been activated by it.
  const stuckOn = (asOf: string) =>
    users.filter(
      (u) =>
        !u.disposable &&
        u.verified &&
        u.inOrg &&
        (u.activatedDay === null || u.activatedDay > asOf) &&
        u.signupDay <= addDays(asOf, -7),
    ).length;

  const { now, change } = movement(stuckOn, w.today);
  if (now < 3) return null;

  return {
    id: "draft-shell-backlog",
    severity: chronicSeverity({ base: 30, now, per: 8, change, ceiling: 75 }),
    kind: "chronic",
    tone: "act",
    headline: `${now} verified accounts never named their organisation`,
    detail:
      change === 0
        ? "Unchanged on last week: none arrived, none were worked down."
        : `${movementPhrase(change)}.`,
    action:
      change < 0
        ? "It is moving. The activation nudge on the Emails tab is the lever; keep sending batches."
        : "The activation nudge on the Emails tab was built for exactly these people. Review the queue and send a batch.",
  };
};

/**
 * People who were working and stopped.
 *
 * Active at some point, silent for a fortnight, nothing signed off. This is the
 * week-three abandonment shape, and it is the warmest list on the page: they
 * already know what the product is and got far enough to use it.
 */
const stalledWorkers: Rule = ({ users, window: w }) => {
  // Rewindable exactly: activity is a list of days, so "had this person been
  // quiet a fortnight as of last Monday" is answerable from the same facts.
  const stalledOn = (asOf: string) =>
    users.filter((u) => {
      if (u.disposable || u.workEvents === 0 || u.signOffs > 0) return false;
      const lastByThen = u.activeDays.filter((day) => day <= asOf).at(-1);
      if (lastByThen === undefined) return false;
      return lastByThen < addDays(asOf, -13) && lastByThen >= addDays(asOf, -60);
    }).length;

  const { now, change } = movement(stalledOn, w.today);
  if (now < 2) return null;

  return {
    id: "stalled-workers",
    severity: chronicSeverity({ base: 35, now, per: 3, change, ceiling: 80 }),
    kind: "chronic",
    tone: "act",
    headline: `${now} people started work and went quiet`,
    detail: `Each did something, nothing in the last two weeks, and has never signed a requirement off. ${movementPhrase(change, true)}.`,
    action:
      "Warmest list you have. Ask one of them what stopped them before writing any new copy.",
  };
};

/**
 * Finished a course, never touched the platform.
 *
 * The course is the wedge that brings people in; someone who completed every
 * lesson and then did nothing is a person who already trusts us and has not
 * been asked for the next step.
 */
const courseFinishersIdle: Rule = ({ users }) => {
  // complianceEvents, not workEvents: finishing a 47-lesson course IS work
  // events, so testing the total would mean this never fires for the exact
  // people it is about.
  const idle = users.filter(
    (u) => !u.disposable && u.coursesFinished.length > 0 && u.complianceEvents === 0,
  );
  const finishers = users.filter(
    (u) => !u.disposable && u.coursesFinished.length > 0,
  ).length;
  if (idle.length < 2) return null;

  return {
    id: "course-finishers-idle",
    // Ceiling below the rewindable rules on purpose: complianceEvents is a
    // lifetime counter, so this finding can never report movement and can
    // never show progress. It is a standing backlog item, and a backlog item
    // must not outrank a problem that visibly grew this week.
    severity: Math.min(55, 25 + idle.length * 2),
    kind: "chronic",
    tone: "act",
    headline: `${idle.length} course finishers have never used the platform`,
    detail: `${idle.length} of ${finishers} people who completed a course did no work afterwards (${percent(idle.length, finishers)}).`,
    action:
      "They sat through the whole course, so they are not cold. One mail offering the next concrete step.",
  };
};

/**
 * Suppliers sitting on an unfinished questionnaire.
 *
 * Only counts profiles older than a fortnight, so someone who signed up on
 * Tuesday is not chased for being mid-form.
 */
const supplierQuestionnaireGap: Rule = ({ companies, window: w }) => {
  const due = companies.filter(
    (c) =>
      c.actsAsSupplier &&
      c.questionnairePct !== null &&
      c.questionnairePct < 100 &&
      c.createdDay <= addDays(w.today, -14),
  );
  if (due.length === 0) return null;
  const untouched = due.filter((c) => c.questionnairePct === 0).length;

  return {
    id: "supplier-questionnaire-gap",
    // Same ceiling reasoning: the questionnaire percentage is current-only.
    severity: Math.min(50, 20 + due.length * 4 + untouched * 4),
    kind: "chronic",
    tone: untouched > 0 ? "act" : "watch",
    headline: `${due.length} supplier profiles are still unfinished`,
    detail:
      untouched > 0
        ? `${untouched} of them have answered nothing at all, a fortnight after the profile was created.`
        : "All of them have started; none has finished the questions that apply to them.",
    action:
      "The Suppliers tab lists them by completeness. An unfinished profile is the thing their customer is waiting on.",
  };
};

/**
 * Work is happening but nothing is being signed off.
 *
 * Sign-off is where a completed requirement becomes evidence. Work without it
 * produces no defensible record, so a fortnight of one without the other is
 * worth knowing about.
 */
const signOffDrought: Rule = ({ work, window: w }) => {
  const from = addDays(w.today, -13);
  const recent = work.filter((row) => row.day >= from && row.day <= w.today);
  const completed = recent.reduce((sum, row) => sum + row.completed, 0);
  const signed = recent.reduce((sum, row) => sum + row.signedOff, 0);
  if (completed < 5 || signed > 0) return null;

  return {
    id: "signoff-drought",
    severity: 50,
    kind: "chronic",
    tone: "watch",
    headline: "Requirements are being completed but nothing is signed off",
    detail: `${completed} requirements marked complete in the last fortnight, zero sign-offs.`,
    action:
      "Sign-off is what turns a completed requirement into evidence. Worth checking the step is reachable.",
  };
};

/**
 * Recent signups are converting worse than the ones before them.
 *
 * Compares a cohort that has had at least a week to activate against the four
 * weeks before it. Guarded on cohort size, because at this volume a three-
 * person week swings any rate wildly and would fire constantly.
 */
const activationRateFalling: Rule = ({ users, window: w }) => {
  const recent = users.filter(
    (u) =>
      !u.disposable && within(u.signupDay, addDays(w.today, -20), addDays(w.today, -7)),
  );
  const before = users.filter(
    (u) =>
      !u.disposable && within(u.signupDay, addDays(w.today, -48), addDays(w.today, -21)),
  );
  if (recent.length < 5 || before.length < 5) return null;

  const rateOf = (rows: UserFact[]) =>
    rows.filter((u) => u.activatedDay !== null).length / rows.length;
  const now = rateOf(recent);
  const then = rateOf(before);
  if (then === 0 || now >= then * 0.75) return null;

  return {
    id: "activation-rate-falling",
    severity: Math.min(85, 40 + Math.round((1 - now / then) * 50)),
    kind: "acute",
    tone: "act",
    headline: "The latest signups are converting worse than the batch before",
    detail: `${Math.round(now * 100)} percent of the last ${recent.length} signups named an organisation, against ${Math.round(then * 100)} percent of the ${before.length} before them.`,
    action:
      "Same product, worse conversion, usually means the traffic changed. Check where the recent signups came from.",
  };
};

/**
 * Good news, so the panel is not purely a list of complaints. A week that is
 * genuinely better than the last four deserves to be said out loud.
 */
const growthUp: Rule = ({ users, window: w }) => {
  const countIn = (from: string, to: string) =>
    users.filter((u) => !u.disposable && within(u.signupDay, from, to)).length;
  const now = countIn(w.weekStart, w.today);
  const baseline = mean(w.baselineWeeks.map((week) => countIn(week.from, week.to)));
  if (now < 3 || baseline === 0 || now < baseline * 1.5) return null;

  return {
    id: "growth-up",
    severity: 40,
    kind: "acute",
    tone: "good",
    headline: "Signups were well up on the last four weeks",
    detail: `${now} new accounts this week against a four-week average of ${baseline.toFixed(1)}.`,
    action:
      "Worth knowing what caused it while you can still remember. Check the Users tab for where they clustered.",
  };
};

/**
 * A week where somebody signed something off for the first time in a while is
 * the single best signal the product is working. Cheap to detect, worth saying.
 */
const signOffsHappened: Rule = ({ work, window: w }) => {
  const signedThisWeek = work
    .filter((row) => row.day >= w.weekStart && row.day <= w.today)
    .reduce((sum, row) => sum + row.signedOff, 0);
  if (signedThisWeek < 1) return null;

  const before = work
    .filter((row) => row.day >= addDays(w.today, -34) && row.day < w.weekStart)
    .reduce((sum, row) => sum + row.signedOff, 0);
  if (before > 0) return null;

  return {
    id: "signoffs-resumed",
    severity: 45,
    kind: "acute",
    tone: "good",
    headline: "Someone signed off a requirement for the first time in a month",
    detail: `${signedThisWeek} sign-off${signedThisWeek === 1 ? "" : "s"} this week, after four quiet weeks.`,
    action:
      "Find out who, and what they were working on. That is the shape of a customer.",
  };
};

/**
 * Order matters only for ties: two findings with the same severity always come
 * out in the same order, so the panel does not reshuffle between refreshes.
 */
const RULES: Rule[] = [
  activityCollapsed,
  activationRateFalling,
  stalledWorkers,
  courseFinishersIdle,
  draftShellBacklog,
  supplierQuestionnaireGap,
  signOffDrought,
  signOffsHappened,
  growthUp,
];

/** How many the panel will ever show. */
export const MAX_INSIGHTS = 3;

/**
 * At most one standing problem on the panel at a time.
 *
 * Against real numbers every chronic rule fires at once and they are all
 * large, so ranking on severity alone filled all three slots with the same
 * findings every week: 224 accounts on a draft shell, 42 idle course
 * finishers, N stalled workers, none of which changes between Mondays. Two of
 * those slots said nothing the third had not. Capping chronic findings keeps
 * room for whatever actually happened this week, and the one that does appear
 * is the most severe, so nothing important is hidden — it is one line down the
 * page instead of three lines of the same news.
 */
const MAX_CHRONIC = 1;

/**
 * Every rule that fired, most severe first, before the panel's caps.
 *
 * Separate from the choosing below because they are different jobs: one asks
 * what is true, the other decides what is worth three lines of someone's
 * Monday. Exported so the caps can be tested against the full set.
 */
export function allInsights(
  users: UserFact[],
  companies: CompanyFact[],
  work: DailyWorkRow[],
  today: string,
): Insight[] {
  const facts: Facts = { users, companies, work, window: buildWindow(today) };
  return RULES.map((rule) => rule(facts))
    .filter((insight): insight is Insight => insight !== null)
    .sort((a, b) => b.severity - a.severity);
}

export function weeklyInsights(
  users: UserFact[],
  companies: CompanyFact[],
  work: DailyWorkRow[],
  today: string,
): Insight[] {
  const found = allInsights(users, companies, work, today);

  const chosen: Insight[] = [];
  let chronic = 0;
  for (const insight of found) {
    if (chosen.length === MAX_INSIGHTS) break;
    if (insight.kind === "chronic") {
      if (chronic === MAX_CHRONIC) continue;
      chronic += 1;
    }
    chosen.push(insight);
  }
  return chosen;
}

/** The window the panel reports on, for the card's subtitle. */
export function insightWindow(today: string): { from: string; to: string } {
  return { from: addDays(today, -6), to: today };
}
