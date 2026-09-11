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
  const stuck = users.filter(
    (u) =>
      !u.disposable &&
      u.verified &&
      u.inOrg &&
      u.activatedDay === null &&
      u.signupDay <= addDays(w.today, -7),
  );
  if (stuck.length < 3) return null;

  const addedThisWeek = users.filter(
    (u) =>
      !u.disposable &&
      u.verified &&
      u.inOrg &&
      u.activatedDay === null &&
      within(u.signupDay, addDays(w.today, -13), addDays(w.today, -7)),
  ).length;

  return {
    id: "draft-shell-backlog",
    severity: Math.min(75, 30 + stuck.length + addedThisWeek * 4),
    tone: "act",
    headline: `${stuck.length} verified accounts never named their organisation`,
    detail:
      addedThisWeek > 0
        ? `${addedThisWeek} of them arrived in the week before last, so the backlog is still growing.`
        : "The backlog stopped growing this week, but nobody worked it down either.",
    action:
      "The activation nudge on the Emails tab was built for exactly these people. Review the queue and send a batch.",
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
  const stalled = users.filter((u) => {
    if (u.disposable || u.workEvents === 0 || u.signOffs > 0) return false;
    const last = u.activeDays[u.activeDays.length - 1];
    if (last === undefined) return false;
    return last < addDays(w.today, -13) && last >= addDays(w.today, -60);
  });
  if (stalled.length < 2) return null;

  return {
    id: "stalled-workers",
    severity: Math.min(80, 35 + stalled.length * 3),
    tone: "act",
    headline: `${stalled.length} people started work and went quiet`,
    detail:
      "Each did something in the platform, nothing in the last two weeks, and has never signed a requirement off.",
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
    severity: Math.min(78, 30 + idle.length * 4),
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
    severity: Math.min(70, 25 + due.length * 5 + untouched * 5),
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
    severity: 60,
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

export function weeklyInsights(
  users: UserFact[],
  companies: CompanyFact[],
  work: DailyWorkRow[],
  today: string,
): Insight[] {
  const facts: Facts = { users, companies, work, window: buildWindow(today) };
  return RULES.map((rule) => rule(facts))
    .filter((insight): insight is Insight => insight !== null)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, MAX_INSIGHTS);
}

/** The window the panel reports on, for the card's subtitle. */
export function insightWindow(today: string): { from: string; to: string } {
  return { from: addDays(today, -6), to: today };
}
