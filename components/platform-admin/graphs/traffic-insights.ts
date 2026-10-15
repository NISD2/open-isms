/**
 * Weekly findings about traffic. Same contract as the rules in insights.ts: pure, thresholds you
 * can argue with, null when nothing crossed a line.
 *
 * Everything is built on engaged visits, visits that viewed more than one page. Automated traffic
 * usually leaves after a single page (on nisd2.eu in October 2026 whole countries did, to the last
 * visit), so counting only the engaged ones keeps most of it out of the baseline without having to
 * recognise it, and a surge of it cannot read as growth. That it is automated is an inference from
 * the pattern, which is why the wording says "almost none read past one page" and not "bots".
 */

import type { TrafficPulse, WeekTraffic } from "@/lib/analytics/umami";
import type { UserFact } from "@/lib/platform-admin/growth";
import type { Insight } from "./insights";

/** Below this many engaged visits a week, a percentage change is noise. */
const MIN_BASELINE_ENGAGED = 50;
/** A country must send at least this many visits in the week before it is judged. */
const MIN_COUNTRY_VISITS = 50;
/** Share of a country's visits that left after one page before it is called single-page. */
const SINGLE_PAGE_SHARE = 0.9;
/** This week's count against its weekly baseline before a country counts as a surge. */
const SURGE_FACTOR = 1.5;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);

/** Visits that went beyond the first page. */
export const engagedVisits = (week: Pick<WeekTraffic, "visits" | "bounces">): number =>
  week.visits - week.bounces;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function listed(names: string[]): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const pct = (share: number): number => Math.round(share * 100);

/** Engaged visits well above or below the four weeks before. */
export function engagedVisitsMoved(pulse: TrafficPulse): Insight | null {
  const now = engagedVisits(pulse.thisWeek);
  const baseline = mean(pulse.baselineWeeks.map(engagedVisits));
  if (baseline < MIN_BASELINE_ENGAGED) return null;
  const change = (now - baseline) / baseline;

  if (change <= -0.25) {
    return {
      id: "engaged-visits-down",
      severity: Math.min(80, 50 + Math.round(-change * 60)),
      kind: "acute",
      tone: "act",
      headline: "Fewer people are reading past the first page",
      detail: `${now} visits viewed more than one page this week against a four-week average of ${Math.round(baseline)}, down ${pct(-change)} percent. Visits that left after one page are left out, so automated traffic cannot hide the drop.`,
      action:
        "Check the Google and Bing referrals first, since a ranking change shows up there, then whether a page people usually enter on has broken.",
    };
  }
  if (change >= 0.3) {
    return {
      id: "engaged-visits-up",
      severity: 42,
      kind: "acute",
      tone: "good",
      headline: "More people are reading past the first page",
      detail: `${now} visits viewed more than one page this week against a four-week average of ${Math.round(baseline)}, up ${pct(change)} percent.`,
      action:
        "Open the Traffic section and find which page or source brought them, then see whether signups moved with it.",
    };
  }
  return null;
}

/** Countries whose visits almost all leave after a single page: traffic that is not reading. */
export function singlePageTraffic(pulse: TrafficPulse): Insight | null {
  const weeks = pulse.baselineWeeks.length;
  const weeklyBefore = new Map(
    pulse.countriesBefore.map((c) => [c.code, c.count / weeks]),
  );
  const flagged = pulse.countries.filter(
    (c) => c.visits >= MIN_COUNTRY_VISITS && c.bounces / c.visits >= SINGLE_PAGE_SHARE,
  );
  if (flagged.length === 0 || pulse.thisWeek.visits === 0) return null;

  const visits = sum(flagged.map((c) => c.visits));
  const share = visits / pulse.thisWeek.visits;
  const surged = flagged.some(
    (c) => c.count >= SURGE_FACTOR * Math.max(weeklyBefore.get(c.code) ?? 0, 1),
  );
  const names = listed(flagged.map((c) => countryName(c.code)));

  return {
    id: "single-page-traffic",
    severity: surged
      ? Math.min(85, 55 + Math.round(share * 60))
      : Math.min(60, 35 + Math.round(share * 40)),
    kind: surged ? "acute" : "chronic",
    tone: surged ? "act" : "watch",
    headline: `${names} sent ${visits} visits this week and almost none read past one page`,
    detail: `${flagged
      .map(
        (c) =>
          `${countryName(c.code)}: ${c.visits} visits, ${pct(c.bounces / c.visits)} percent single page`,
      )
      .join(
        "; ",
      )}. Together ${pct(share)} percent of this week's ${pulse.thisWeek.visits} visits. ${
      surged
        ? "Up sharply on the four weeks before."
        : "Not new: about the same as before."
    }`,
    action:
      "Read traffic without them: the engaged-visits figure already leaves them out. If it is a country you sell to, open its landing pages before writing it off.",
  };
}

/** Signups per thousand engaged visits, this week against the four before. */
export function signupsPerVisitFalling(
  users: UserFact[],
  pulse: TrafficPulse,
): Insight | null {
  const signupsIn = (from: string, to: string) =>
    users.filter((u) => !u.disposable && u.signupDay >= from && u.signupDay <= to).length;
  const nowVisits = engagedVisits(pulse.thisWeek);
  const nowSignups = signupsIn(pulse.thisWeek.from, pulse.thisWeek.to);
  const baseVisits = sum(pulse.baselineWeeks.map(engagedVisits));
  const baseSignups = sum(pulse.baselineWeeks.map((w) => signupsIn(w.from, w.to)));
  if (baseSignups < 8 || baseVisits < 200 || nowVisits < MIN_BASELINE_ENGAGED)
    return null;

  const nowRate = (nowSignups / nowVisits) * 1000;
  const baseRate = (baseSignups / baseVisits) * 1000;
  if (nowRate > baseRate * 0.6) return null;

  return {
    id: "signups-per-visit-falling",
    severity: Math.min(80, 50 + Math.round((1 - nowRate / baseRate) * 40)),
    kind: "acute",
    tone: "act",
    headline: "Fewer visitors are signing up for each engaged visit",
    detail: `${nowSignups} ${nowSignups === 1 ? "signup" : "signups"} from ${nowVisits} engaged visits this week (${nowRate.toFixed(1)} per 1,000), against ${baseRate.toFixed(1)} per 1,000 over the four weeks before.`,
    action:
      "Traffic grew faster than interest, or the sign-up path broke. Register once yourself to rule that out, then see which page most signups registered from on the Graphs tab.",
  };
}
