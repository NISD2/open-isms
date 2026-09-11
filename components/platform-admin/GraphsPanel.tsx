"use client";

/**
 * Graphs — where the platform is, over whatever window you pick.
 *
 * One fetch, all-time, and every chart below is folded out of it on the
 * client, so the range buttons are instant and no two cards can disagree
 * about the same number. The range row at the top scopes everything under it.
 */

import { useMemo, useState } from "react";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import {
  activationLagBars,
  activationLags,
  activePeople,
  cohortMatrix,
  countryBars,
  courseFunnel,
  firstWorkLagBars,
  localeBars,
  median,
  percent,
  progressBars,
  questionnaireBars,
  questionnairePercents,
  seatBars,
  sectorBars,
  signupFunnel,
  sizeBars,
} from "./graphs/derive";
import { InsightsCard } from "./graphs/InsightsCard";
import { insightWindow, weeklyInsights } from "./graphs/insights";
import { VIZ, VIZ_PALETTE_CSS } from "./graphs/palette";
import {
  barsTable,
  CategoryBars,
  ChartCard,
  CohortHeatmap,
  cohortTable,
  type SeriesSpec,
  StatTile,
  TrendColumns,
  TrendLines,
  trendTable,
} from "./graphs/primitives";
import {
  bucketSeries,
  eachDay,
  type GranularityChoice,
  parseDay,
  RANGES,
  type RangeKey,
  resolveWindow,
  todayUtc,
} from "./graphs/range";

type GrowthData = RouterOutputs["platformAdmin"]["growth"];

/** How a bucket is named in headings and table columns. */
const PERIOD_NAME = { day: "Day", week: "Week", month: "Month" } as const;

const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthName = (month: string) => MONTH_LABEL.format(parseDay(`${month}-01`));

function bump(map: Map<string, number>, day: string): void {
  map.set(day, (map.get(day) ?? 0) + 1);
}

/** Cumulative totals for every day from `from` to `to`, inclusive. */
function runningTotals(
  increments: Map<string, number>,
  from: string,
  to: string,
): Map<string, number> {
  const totals = new Map<string, number>();
  let carried = 0;
  for (const day of eachDay(from, to)) {
    carried += increments.get(day) ?? 0;
    totals.set(day, carried);
  }
  return totals;
}

const inWindow = (day: string | null, from: string, to: string): boolean =>
  day !== null && day >= from && day <= to;

export function GraphsPanel() {
  const query = trpc.platformAdmin.growth.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  if (query.isPending) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Reading the platform&rsquo;s history...
      </p>
    );
  }
  if (query.isError) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Could not load the numbers: {query.error.message}
      </p>
    );
  }
  return <GraphsView data={query.data} />;
}

function GraphsView({ data }: { data: GrowthData }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("all");
  const [granularity, setGranularity] = useState<GranularityChoice>("auto");

  const today = todayUtc();

  const earliest = useMemo(() => {
    const days = [
      ...data.users.map((u) => u.signupDay),
      ...data.companies.map((c) => c.createdDay),
      ...data.leads.map((l) => l.day),
    ];
    return days.length === 0 ? today : days.reduce((a, b) => (a < b ? a : b));
  }, [data, today]);

  const frame = useMemo(
    () => resolveWindow(rangeKey, granularity, earliest, today),
    [rangeKey, granularity, earliest, today],
  );
  const g = frame.granularity;
  const period = PERIOD_NAME[g];
  const days = useMemo(() => eachDay(frame.start, frame.end), [frame.start, frame.end]);

  // ── All-time day maps, built once ────────────────────────────────────────

  const marks = useMemo(() => {
    const signups = new Map<string, number>();
    const verified = new Map<string, number>();
    const activatedUsers = new Map<string, number>();
    for (const u of data.users) {
      bump(signups, u.signupDay);
      if (u.verified) bump(verified, u.signupDay);
      if (u.activatedDay !== null) bump(activatedUsers, u.activatedDay);
    }
    const orgsCreated = new Map<string, number>();
    const orgsActivated = new Map<string, number>();
    for (const c of data.companies) {
      bump(orgsCreated, c.createdDay);
      if (c.activatedDay !== null) bump(orgsActivated, c.activatedDay);
    }
    return { signups, verified, activatedUsers, orgsCreated, orgsActivated };
  }, [data]);

  const totals = useMemo(
    () => ({
      accounts: runningTotals(marks.signups, earliest, today),
      activated: runningTotals(marks.activatedUsers, earliest, today),
      orgsCreated: runningTotals(marks.orgsCreated, earliest, today),
      orgsActivated: runningTotals(marks.orgsActivated, earliest, today),
    }),
    [marks, earliest, today],
  );

  const byDay = useMemo(
    () => ({
      lessons: new Map(data.lessons.map((r) => [r.day, r])),
      work: new Map(data.work.map((r) => [r.day, r])),
      activity: new Map(data.activity.map((r) => [r.day, r])),
      leads: new Map(data.leads.map((r) => [r.day, r])),
      emails: new Map(data.emails.map((r) => [r.day, r])),
    }),
    [data],
  );

  // ── Series ───────────────────────────────────────────────────────────────

  const trends = useMemo(
    () => ({
      accounts: bucketSeries(
        days,
        g,
        (day) => ({
          accounts: totals.accounts.get(day) ?? 0,
          activated: totals.activated.get(day) ?? 0,
        }),
        "last",
      ),
      signups: bucketSeries(
        days,
        g,
        (day) => {
          const all = marks.signups.get(day) ?? 0;
          const ok = marks.verified.get(day) ?? 0;
          return { verified: ok, unverified: all - ok };
        },
        "sum",
      ),
      orgs: bucketSeries(
        days,
        g,
        (day) => ({
          created: totals.orgsCreated.get(day) ?? 0,
          named: totals.orgsActivated.get(day) ?? 0,
        }),
        "last",
      ),
      newOrgs: bucketSeries(
        days,
        g,
        (day) => ({
          created: marks.orgsCreated.get(day) ?? 0,
          named: marks.orgsActivated.get(day) ?? 0,
        }),
        "sum",
      ),
      activity: bucketSeries(
        days,
        g,
        (day) => ({ people: byDay.activity.get(day)?.users ?? 0 }),
        "sum",
      ),
      work: bucketSeries(
        days,
        g,
        (day) => {
          const row = byDay.work.get(day);
          return {
            completed: row?.completed ?? 0,
            signedOff: row?.signedOff ?? 0,
            evidence: row?.evidence ?? 0,
          };
        },
        "sum",
      ),
      lessons: bucketSeries(
        days,
        g,
        (day) => {
          const row = byDay.lessons.get(day);
          return { ceo: row?.ceo ?? 0, cra: row?.cra ?? 0, tabletop: row?.tabletop ?? 0 };
        },
        "sum",
      ),
      leads: bucketSeries(
        days,
        g,
        (day) => {
          const row = byDay.leads.get(day);
          return {
            entity: row?.entity ?? 0,
            supplier: row?.supplier ?? 0,
            both: row?.both ?? 0,
            unknown: row?.unknown ?? 0,
          };
        },
        "sum",
      ),
      emails: bucketSeries(
        days,
        g,
        (day) => ({ sent: byDay.emails.get(day)?.sent ?? 0 }),
        "sum",
      ),
    }),
    [days, g, totals, marks, byDay],
  );

  // ── Range-scoped facts ───────────────────────────────────────────────────

  const scoped = useMemo(() => {
    const newUsers = data.users.filter((u) =>
      inWindow(u.signupDay, frame.start, frame.end),
    );
    const namedOrgs = data.companies.filter((c) =>
      inWindow(c.activatedDay, frame.start, frame.end),
    );
    // Suppliers are scoped by when the company row appeared, not by when it
    // was activated: a supplier-only signup never runs the entity activation
    // flow, so activatedDay is null for them and scoping on it would show an
    // empty supplier chart.
    const suppliers = data.companies.filter(
      (c) => c.actsAsSupplier && inWindow(c.createdDay, frame.start, frame.end),
    );
    return {
      newUsers,
      namedOrgs,
      suppliers,
      verified: newUsers.filter((u) => u.verified).length,
      activated: newUsers.filter((u) => u.activatedDay !== null).length,
      medianActivationDays: median(activationLags(newUsers)),
      finishers: data.users.filter((u) =>
        u.coursesFinished.some((c) => inWindow(c.day, frame.start, frame.end)),
      ).length,
      active: activePeople(data.users, frame.start, frame.end),
      previous: {
        newUsers: data.users.filter((u) =>
          inWindow(u.signupDay, frame.previousStart, frame.previousEnd),
        ).length,
        namedOrgs: data.companies.filter((c) =>
          inWindow(c.activatedDay, frame.previousStart, frame.previousEnd),
        ).length,
        active: activePeople(data.users, frame.previousStart, frame.previousEnd),
      },
    };
  }, [data, frame]);

  const bars = useMemo(
    () => ({
      signupFunnel: signupFunnel(scoped.newUsers),
      ceoFunnel: courseFunnel(scoped.newUsers, "nis2-ceo"),
      activationLag: activationLagBars(scoped.newUsers),
      firstWorkLag: firstWorkLagBars(scoped.newUsers),
      locale: localeBars(scoped.newUsers),
      sector: sectorBars(scoped.namedOrgs),
      size: sizeBars(scoped.namedOrgs),
      country: countryBars(scoped.namedOrgs),
      seats: seatBars(scoped.namedOrgs),
      progress: progressBars(scoped.namedOrgs),
      questionnaire: questionnaireBars(scoped.suppliers),
    }),
    [scoped],
  );

  const cohorts = useMemo(
    () => cohortMatrix(data.users, today.slice(0, 7)),
    [data, today],
  );

  // Fixed seven-day window, deliberately not scoped by the range selector.
  const insights = useMemo(
    () => weeklyInsights(data.users, data.companies, data.work, today),
    [data, today],
  );
  const insightDays = insightWindow(today);

  const accountsNow = totals.accounts.get(frame.end) ?? 0;
  const ceoLessons = data.courseLessonCounts["nis2-ceo"];
  const supplierMedian = median(questionnairePercents(scoped.suppliers));

  /**
   * All time has no previous period worth naming: the window before the first
   * signup is empty by definition, so the delta would always be the whole
   * number again. Show it only when the comparison means something.
   */
  const deltaFor = (current: number, before: number) =>
    rangeKey === "all"
      ? undefined
      : { amount: current - before, period: "the previous period" };

  const series = {
    accounts: [
      { key: "accounts", label: "All accounts", color: VIZ.slot1 },
      { key: "activated", label: "In a named organisation", color: VIZ.slot2 },
    ],
    signups: [
      { key: "verified", label: "Verified", color: VIZ.slot1 },
      { key: "unverified", label: "Never verified", color: VIZ.slot2 },
    ],
    // Two labellings of the same two keys. On the running total, `created`
    // counts every organisation row that exists, named or not, so calling it
    // "draft shells" would be a lie: the drafts are the GAP between the lines.
    // On the per-period chart the same key really is "created this period".
    orgsTotal: [
      { key: "created", label: "All organisations", color: VIZ.slot2 },
      { key: "named", label: "Named", color: VIZ.slot1 },
    ],
    orgsNew: [
      { key: "created", label: "Created", color: VIZ.slot2 },
      { key: "named", label: "Named", color: VIZ.slot1 },
    ],
    activity: [{ key: "people", label: "People", color: VIZ.slot1 }],
    work: [
      { key: "completed", label: "Requirements completed", color: VIZ.slot1 },
      { key: "signedOff", label: "Sign-offs", color: VIZ.slot2 },
      { key: "evidence", label: "Evidence uploaded", color: VIZ.slot3 },
    ],
    lessons: [
      { key: "ceo", label: `CEO course (${ceoLessons})`, color: VIZ.slot1 },
      {
        key: "cra",
        label: `CRA and SBOM (${data.courseLessonCounts["cra-sbom"]})`,
        color: VIZ.slot2,
      },
      {
        key: "tabletop",
        label: `Tabletop (${data.courseLessonCounts["nis2-tabletop"]})`,
        color: VIZ.slot3,
      },
    ],
    leads: [
      { key: "entity", label: "Regulated entity", color: VIZ.slot1 },
      { key: "supplier", label: "Supplier", color: VIZ.slot2 },
      { key: "both", label: "Both", color: VIZ.slot3 },
      { key: "unknown", label: "Not declared", color: VIZ.slot4 },
    ],
    emails: [{ key: "sent", label: "Sent", color: VIZ.slot1 }],
  } satisfies Record<string, SeriesSpec[]>;

  return (
    <div data-viz className="space-y-6">
      <style>{VIZ_PALETTE_CSS}</style>

      <InsightsCard insights={insights} from={insightDays.from} to={insightDays.to} />

      {/* One filter row, scoping every card below it. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-muted/30 p-3">
        <FilterGroup
          legend="Range"
          options={RANGES.map((r) => ({ key: r.key, label: r.label }))}
          value={rangeKey}
          onChange={setRangeKey}
        />
        <FilterGroup
          legend="Bucket"
          options={[
            { key: "auto" as const, label: `Auto (${period.toLowerCase()})` },
            { key: "day" as const, label: "Day" },
            { key: "week" as const, label: "Week" },
            { key: "month" as const, label: "Month" },
          ]}
          value={granularity}
          onChange={setGranularity}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <StatTile label="Accounts" value={accountsNow} sub={`total on ${frame.end}`} />
        <StatTile
          label="New accounts"
          value={scoped.newUsers.length}
          delta={deltaFor(scoped.newUsers.length, scoped.previous.newUsers)}
        />
        <StatTile
          label="Verified"
          value={scoped.verified}
          sub={`${percent(scoped.verified, scoped.newUsers.length)} of new accounts`}
        />
        <StatTile
          label="Orgs named"
          value={scoped.namedOrgs.length}
          delta={deltaFor(scoped.namedOrgs.length, scoped.previous.namedOrgs)}
        />
        <StatTile
          label="Activation rate"
          value={percent(scoped.activated, scoped.newUsers.length)}
          sub="of accounts opened in range"
        />
        <StatTile
          label="People doing work"
          value={scoped.active}
          delta={deltaFor(scoped.active, scoped.previous.active)}
        />
        <StatTile
          label="Days to naming"
          value={scoped.medianActivationDays ?? "no data"}
          sub="median, accounts in range"
        />
        <StatTile
          label="Course finishers"
          value={scoped.finishers}
          sub="any course, finished in range"
        />
      </div>

      <SectionHeading
        title="Growth"
        blurb="How many people and organisations there are, and how fast that is changing."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Accounts over time"
          subtitle="Running total of every account ever created"
          note="The second line counts accounts whose organisation has been named. Verification and naming are read as they stand today, not as they stood on the day plotted."
          table={trendTable(trends.accounts, series.accounts, period)}
        >
          <TrendLines data={trends.accounts} series={series.accounts} />
        </ChartCard>

        <ChartCard
          title={`New accounts per ${period.toLowerCase()}`}
          subtitle="Signups, split by whether the address was ever verified"
          note="An address that was never verified cannot sign in with a password, so the verified half is the usable intake."
          table={trendTable(trends.signups, series.signups, period)}
        >
          <TrendColumns data={trends.signups} series={series.signups} />
        </ChartCard>

        <ChartCard
          title="Organisations over time"
          subtitle="Running total of every organisation row against the ones that got named"
          note="Every verified account gets a draft shell automatically, so the gap between the lines is the funnel gap: people who arrived and never described their organisation."
          table={trendTable(trends.orgs, series.orgsTotal, period)}
        >
          <TrendLines data={trends.orgs} series={series.orgsTotal} />
        </ChartCard>

        <ChartCard
          title={`Organisations created and named per ${period.toLowerCase()}`}
          subtitle="Side by side, because an org is often named long after it appears"
          note="Grouped rather than stacked: the same organisation can appear in one bar and, weeks later, in the other."
          table={trendTable(trends.newOrgs, series.orgsNew, period)}
        >
          <TrendColumns data={trends.newOrgs} series={series.orgsNew} stacked={false} />
        </ChartCard>

        <ChartCard
          title={`Applicability checks per ${period.toLowerCase()}`}
          subtitle="Leads from the public scope check, by the intent they declared"
          note="Top of the funnel. These are addresses left on the applicability tool, not accounts."
          table={trendTable(trends.leads, series.leads, period)}
        >
          <TrendColumns data={trends.leads} series={series.leads} />
        </ChartCard>
      </div>

      <SectionHeading
        title="Engagement"
        blurb="What people do once they are in. Work means lesson progress, requirement completions, sign-offs and evidence uploads. Crons and outbound mail are deliberately not counted, or our own batch jobs would read as customers being busy."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={`People doing work per ${period.toLowerCase()}`}
          subtitle="Distinct people with at least one recorded action that day"
          note="Summed over the days in a bucket, so one person active on three days of a week counts three times here. The range tile above counts each person once."
          table={trendTable(trends.activity, series.activity, period)}
        >
          <TrendLines data={trends.activity} series={series.activity} />
        </ChartCard>

        <ChartCard
          title={`Compliance work per ${period.toLowerCase()}`}
          subtitle="Requirements completed, sign-offs recorded, evidence uploaded"
          note="All frameworks, not NIS 2 alone: a policy written for ISO 27001 is still work someone did here."
          table={trendTable(trends.work, series.work, period)}
        >
          <TrendColumns data={trends.work} series={series.work} />
        </ChartCard>

        <ChartCard
          title={`Lessons completed per ${period.toLowerCase()}`}
          subtitle="Individual lessons across the three courses"
          table={trendTable(trends.lessons, series.lessons, period)}
        >
          <TrendColumns data={trends.lessons} series={series.lessons} />
        </ChartCard>

        <ChartCard
          title={`Email sent per ${period.toLowerCase()}`}
          subtitle="Everything the notification table records as delivered"
          note="Same scope as the Emails tab: digests, reminders, course follow-ups, lifecycle nudges, newsletter and test sends. Invites and welcome mail are not logged there."
          table={trendTable(trends.emails, series.emails, period)}
        >
          <TrendColumns data={trends.emails} series={series.emails} />
        </ChartCard>
      </div>

      <SectionHeading
        title="Conversion"
        blurb="Where people stop. Each funnel stage filters the one above it, so a rate always means what it says."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Signup to signed-off work"
          subtitle={`Accounts opened between ${frame.start} and ${frame.end}`}
          note="Accounts opened near the end of the range have had less time to get anywhere, so a short range flatters the top and starves the bottom."
          table={barsTable(bars.signupFunnel, "Stage")}
        >
          <CategoryBars bars={bars.signupFunnel} />
        </ChartCard>

        <ChartCard
          title="The CEO course"
          subtitle="NIS 2 for CEOs, for accounts opened in range"
          note={`Finished means every one of the ${ceoLessons} lessons in the current course definition, the same test the certificate uses.`}
          table={barsTable(bars.ceoFunnel, "Stage")}
        >
          <CategoryBars bars={bars.ceoFunnel} />
        </ChartCard>

        <ChartCard
          title="How long until they name the organisation"
          subtitle="Days from opening the account to activating it"
          note="Counts only the accounts that got there. Everyone still sitting on a draft shell is absent by construction."
          table={barsTable(bars.activationLag, "Delay")}
        >
          <CategoryBars bars={bars.activationLag} />
        </ChartCard>

        <ChartCard
          title="How long until the first piece of work"
          subtitle="Days from opening the account to the first recorded action"
          note="Time to first value. Same caveat: only people who ever did anything appear."
          table={barsTable(bars.firstWorkLag, "Delay")}
        >
          <CategoryBars bars={bars.firstWorkLag} />
        </ChartCard>
      </div>

      <ChartCard
        title="Do they come back"
        subtitle="Signup month against the months that cohort did work in, all time"
        note="Month zero is the signup month itself, which is why it is never 100 percent: plenty of people open an account and never touch anything. Dashed cells are months that have not happened yet. Not scoped by the range above, because a cohort grid needs whole months."
        table={cohortTable(cohorts, monthName)}
      >
        <CohortHeatmap rows={cohorts} monthLabel={monthName} />
      </ChartCard>

      <SectionHeading
        title="Who signed up"
        blurb="Named organisations only. Draft shells carry placeholder details, so counting them would drown every real answer."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Sector"
          subtitle="Organisations named in range"
          table={barsTable(bars.sector, "Sector")}
        >
          <CategoryBars bars={bars.sector} />
        </ChartCard>

        <ChartCard
          title="Company size"
          subtitle="Staff numbers as the organisation stated them"
          note="Bands sit on the statutory lines: 50 and 250 employees are where the NIS 2 size-cap rule changes the answer, and 50 to 249 is also who we sell to."
          table={barsTable(bars.size, "Employees")}
        >
          <CategoryBars bars={bars.size} />
        </ChartCard>

        <ChartCard
          title="Country"
          subtitle="From the organisation's registered address"
          table={barsTable(bars.country, "Country")}
        >
          <CategoryBars bars={bars.country} />
        </ChartCard>

        <ChartCard
          title="Interface language"
          subtitle="Accounts opened in range, by the language they read the platform in"
          note="Also the language their email goes out in. Accounts predating the column never set one."
          table={barsTable(bars.locale, "Language")}
        >
          <CategoryBars bars={bars.locale} />
        </ChartCard>

        <ChartCard
          title="People per organisation"
          subtitle="Seats attached to each organisation named in range"
          note="One seat means nobody was ever invited. A second seat is the first sign this is being used as a team tool rather than looked at once."
          table={barsTable(bars.seats, "Seats")}
        >
          <CategoryBars bars={bars.seats} />
        </ChartCard>

        <ChartCard
          title="NIS 2 progress per organisation"
          subtitle="Where each named organisation stands on its 49 requirements"
          note="Read from the stored compliance percentage on the NIS 2 assessment. An organisation with no assessment counts as nothing yet."
          table={barsTable(bars.progress, "Progress")}
        >
          <CategoryBars bars={bars.progress} />
        </ChartCard>

        <ChartCard
          title="Supplier questionnaire"
          subtitle={`How far through it the ${scoped.suppliers.length} supplier${
            scoped.suppliers.length === 1 ? "" : "s"
          } created in range have got${supplierMedian === null ? "" : `, median ${supplierMedian}%`}`}
          note="Counts only the questions that apply to each supplier: service-type blocks they did not tick are left out of their denominator, and a no counts as answered. Scoped by when the company row appeared, because a supplier-only signup never runs the entity activation flow."
          table={barsTable(bars.questionnaire, "Answered")}
        >
          <CategoryBars bars={bars.questionnaire} />
        </ChartCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function SectionHeading({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{blurb}</p>
    </div>
  );
}

function FilterGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{legend}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            aria-pressed={value === option.key}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              value === option.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
