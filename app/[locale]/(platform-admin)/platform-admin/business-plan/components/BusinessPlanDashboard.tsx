"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttMarker,
  GanttToday,
  type GanttFeature,
} from "@/components/kibo-ui/gantt";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BusinessPlanData,
  Call,
  Phase,
  ViralPost,
} from "@/lib/business-plan/data";
import { BusinessModelSection } from "./sections/BusinessModelSection";
import { MarketSizeSection } from "./sections/MarketSizeSection";
import { CompetitorMatrixSection } from "./sections/CompetitorMatrixSection";
import { SwotSection } from "./sections/SwotSection";
import { RevenueMixSection } from "./sections/RevenueMixSection";
import { BreakEvenSection } from "./sections/BreakEvenSection";
import { CostComparisonSection } from "./sections/CostComparisonSection";
import { AuditCoverageSection } from "./sections/AuditCoverageSection";
import { RevenueFunnelSection } from "./sections/RevenueFunnelSection";
import { SensitivitySection } from "./sections/SensitivitySection";

function GroupHeader({ label, chapters }: { label: string; chapters: string }) {
  return (
    <div className="border-b pb-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {chapters}
      </p>
      <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">{label}</h2>
    </div>
  );
}

interface Props {
  data: BusinessPlanData;
}

export function BusinessPlanDashboard({ data }: Props) {
  const isEn = useLocale() === "en";
  const dateLocale = isEn ? "en-US" : "de-DE";
  const dateLabel = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(dateLocale, {
      month: "short",
      day: "2-digit",
    });

  const engagementStartTs = new Date(data.engagementStart).getTime();
  const engagementEndTs = new Date(data.engagementEnd).getTime();

  const features: (GanttFeature & { lane: Phase })[] = useMemo(
    () =>
      data.tasks.map((t) => ({
        id: t.id,
        name: t.title,
        startAt: new Date(t.start),
        endAt: new Date(t.end),
        status: {
          id: t.phase,
          name: isEn ? data.phases[t.phase].labelEn : data.phases[t.phase].label,
          color: data.phases[t.phase].color,
        },
        lane: t.phase,
      })),
    [data, isEn]
  );

  const tasksByPhase = useMemo(() => {
    const grouped = new Map<Phase, typeof features>();
    for (const f of features) {
      const list = grouped.get(f.lane) ?? [];
      list.push(f);
      grouped.set(f.lane, list);
    }
    return grouped;
  }, [features]);

  const milestonesWithLane = useMemo(() => {
    const LANE_HEIGHT = 26;
    return data.milestones
      .slice()
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .map((m, idx) => ({
        ...m,
        verticalOffset: (idx % 3) * LANE_HEIGHT,
      }));
  }, [data]);

  const engagementStartTsRaw = new Date(data.engagementStart).getTime();

  const growthSeries = useMemo(
    () =>
      data.growth
        .map((g) => ({
          ts: new Date(g.date).getTime(),
          signups: g.signups,
          courseStarts: g.courseStarts,
        }))
        .filter((p) => p.ts >= engagementStartTsRaw)
        .sort((a, b) => a.ts - b.ts),
    [data, engagementStartTsRaw]
  );

  const viralScatter = useMemo(
    () =>
      data.viralPosts
        .map((p) => ({
          ts: new Date(p.date).getTime(),
          impressions: p.impressions,
          post: p,
        }))
        .filter((p) => p.ts >= engagementStartTsRaw)
        .sort((a, b) => a.ts - b.ts),
    [data, engagementStartTsRaw]
  );

  const callScatter = useMemo(
    () =>
      data.calls
        .map((c) => ({
          ts: new Date(c.date).getTime(),
          callY: -5,
          call: c,
        }))
        .filter((c) => c.ts >= engagementStartTsRaw)
        .sort((a, b) => a.ts - b.ts),
    [data, engagementStartTsRaw]
  );

  const lastGrowth = data.growth[data.growth.length - 1];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Founder Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Business Plan: Kardashev Catalyst UG
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEn
            ? "Implementation roadmap, viral LinkedIn posts and engagement growth from typed data in"
            : "Realisierungsfahrplan, virale LinkedIn-Posts und Engagement-Wachstum aus typisierten Daten in"}{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            lib/business-plan/data.ts
          </code>
          .
        </p>
      </header>

      <GroupHeader
        label={isEn ? "Business Model & Market" : "Geschäftsmodell & Markt"}
        chapters={isEn ? "Chapter 2 · Chapter 4" : "Kapitel 2 · Kapitel 4"}
      />
      <BusinessModelSection channels={data.revenueChannels} />
      <MarketSizeSection layers={data.marketLayers} />
      <CompetitorMatrixSection competitors={data.competitors} />
      <CostComparisonSection alternatives={data.costAlternatives} />
      <AuditCoverageSection findings={data.auditFindings} />

      <GroupHeader
        label={isEn ? "Opportunities & Risks" : "Chancen & Risiken"}
        chapters={isEn ? "Chapter 7" : "Kapitel 7"}
      />
      <SwotSection
        strengths={data.swot.strengths}
        weaknesses={data.swot.weaknesses}
        opportunities={data.swot.opportunities}
        threats={data.swot.threats}
      />
      <SensitivitySection
        planBaseline={data.sensitivity.planBaseline}
        planNote={data.sensitivity.planNote}
        planNoteEn={data.sensitivity.planNoteEn}
        drivers={data.sensitivity.drivers}
      />

      <GroupHeader
        label={isEn ? "Financials & Traction" : "Finanzen & Traktion"}
        chapters={isEn ? "Chapter 8" : "Kapitel 8"}
      />
      <RevenueMixSection
        year={data.revenueMix.year}
        total={data.revenueMix.total}
        slices={data.revenueMix.slices}
      />
      <BreakEvenSection points={data.breakEven} />
      <RevenueFunnelSection stages={data.funnel} />

      <GroupHeader
        label={isEn ? "Implementation Roadmap & Reach" : "Realisierungsfahrplan & Reichweite"}
        chapters={isEn ? "Chapter 5 · Chapter 6" : "Kapitel 5 · Kapitel 6"}
      />
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium tracking-wide text-muted-foreground">
              REF-07
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {isEn ? "Implementation Roadmap" : "Realisierungsfahrplan"}
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {data.tasks.length} {isEn ? "tasks" : "Aufgaben"} &middot;{" "}
            {data.milestones.length}{" "}
            {isEn ? "milestones" : "Meilensteine"} &middot; {data.ganttStartYear}-
            {data.ganttStartYear + data.ganttYearsCount - 1}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {(Object.entries(data.phases) as Array<[Phase, (typeof data.phases)[Phase]]>).map(
            ([phaseId, cfg]) => (
              <div key={phaseId} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: `${cfg.color}1f`, borderColor: cfg.color, borderWidth: 1, borderStyle: "solid" }}
                />
                <span className="font-medium">{isEn ? cfg.labelEn : cfg.label}</span>
              </div>
            )
          )}
        </div>
        <div className="h-[900px] overflow-hidden rounded-xl border bg-card">
          <GanttProvider
            range="quarterly"
            zoom={120}
            startYear={data.ganttStartYear}
            yearsCount={data.ganttYearsCount}
            className="h-full"
          >
            <GanttSidebar>
              {Array.from(tasksByPhase.entries()).map(([phase, items]) => (
                <GanttSidebarGroup
                  key={phase}
                  name={isEn ? data.phases[phase].labelEn : data.phases[phase].label}
                >
                  {items.map((item) => (
                    <GanttSidebarItem key={item.id} feature={item} />
                  ))}
                </GanttSidebarGroup>
              ))}
            </GanttSidebar>
            <GanttTimeline>
              <GanttHeader />
              <GanttFeatureList>
                {Array.from(tasksByPhase.entries()).map(([phase, items]) => (
                  <GanttFeatureListGroup key={phase}>
                    {items.map((item) => (
                      <GanttFeatureItem key={item.id} {...item} />
                    ))}
                  </GanttFeatureListGroup>
                ))}
              </GanttFeatureList>
              {milestonesWithLane.map((m) => (
                <GanttMarker
                  key={m.id}
                  id={m.id}
                  date={new Date(m.date)}
                  label={m.label}
                  verticalOffset={m.verticalOffset}
                />
              ))}
              <GanttToday />
            </GanttTimeline>
          </GanttProvider>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEn
            ? "Status reading: Platform-phase tasks are green (live), training orange (CEO course live, tabletop live, partner affiliate in preparation), reach green-active, funding pink (founder-grant application submitted 18.05.2026, further programme eligibilities under review). Source for dates: REF-08 (Engagement & Call data)."
            : "Status-Lesart: Aufgaben mit Phase Plattform sind grün (live), Schulungen orange (CEO-Kurs live, Tabletop live, Partner-Affiliate in Anbahnung), Reichweite grün-aktiv, Förderung pink (Gründungszuschuss-Antrag eingereicht 18.05.2026, weitere Programm-Eignungen werden geprüft). Quelle für Termine: REF-08 (Engagement & Call-Daten)."}
        </p>
      </section>

      <section className="space-y-3 max-w-6xl">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium tracking-wide text-muted-foreground">
              REF-08
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {isEn ? "Engagement & LinkedIn Reach" : "Engagement & LinkedIn-Reichweite"}
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {isEn ? "Today: " : "Heute: "}
            {lastGrowth?.signups}
            {isEn ? " sign-ups · " : " Sign-ups · "}
            {lastGrowth?.courseStarts}
            {isEn ? " CEO course starts" : " CEO-Kurs-Starts"}
          </span>
        </div>
        <div className="h-[480px] rounded-xl border bg-card p-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              margin={{ top: 24, right: 24, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={[engagementStartTs, engagementEndTs]}
                allowDataOverflow={true}
                tickFormatter={dateLabel}
                stroke="#d4d4d8"
                tick={{ fill: "#52525b", fontSize: 13 }}
                allowDuplicatedCategory={false}
              />
              <YAxis
                yAxisId="users"
                domain={[-15, 160]}
                stroke="#d4d4d8"
                tick={{ fill: "#52525b", fontSize: 13 }}
                ticks={[0, 40, 80, 120, 160]}
                label={{
                  value: isEn ? "Users" : "Nutzer",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#52525b",
                  fontSize: 13,
                }}
              />
              <YAxis
                yAxisId="impressions"
                orientation="right"
                stroke="#d4d4d8"
                tick={{ fill: "#52525b", fontSize: 13 }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
                label={{
                  value: isEn ? "LinkedIn impressions" : "LinkedIn Impressionen",
                  angle: 90,
                  position: "insideRight",
                  fill: "#52525b",
                  fontSize: 13,
                }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "#a1a1aa" }}
                content={<EngagementTooltipV3 isEn={isEn} />}
              />
              <Legend
                verticalAlign="top"
                align="left"
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: 12,
                  fontSize: 14,
                  color: "#52525b",
                }}
              />
              <Line
                yAxisId="users"
                data={growthSeries}
                type="monotone"
                dataKey="signups"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                name="Sign-ups"
              />
              <Line
                yAxisId="users"
                data={growthSeries}
                type="monotone"
                dataKey="courseStarts"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3.5, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                name={isEn ? "CEO course starts" : "CEO-Kurs-Starts"}
              />
              <Scatter
                yAxisId="impressions"
                data={viralScatter}
                dataKey="impressions"
                fill="#ef4444"
                stroke="#b91c1c"
                strokeWidth={1}
                name={isEn ? "LinkedIn post" : "LinkedIn-Post"}
                shape="circle"
              />
              <Scatter
                yAxisId="users"
                data={callScatter}
                dataKey="callY"
                fill="#f97316"
                stroke="#c2410c"
                strokeWidth={1}
                name={isEn ? "Call / insight" : "Call / Insight"}
                shape="triangle"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEn
            ? "Blue line = platform sign-ups, green line = started CEO courses, red dots = LinkedIn posts (height = impressions), orange triangles = calls/insights. Visible is the chain call → insight → post → user spike (e.g. first post batch 27.04. + Irmscher call 28.04. → IHK-advisor post 06.05. → first growth phase; 67-vs-42 viral 06.05. → 18,604 impr.; mega viral 80/20 DE 13.05. → 36,745 impr. → multi-day sign-up surge into 19-20 May). Data from LinkedIn Analytics + internal sign-up DB, as of 27.05.2026."
            : "Blaue Linie = Plattform-Anmeldungen, grüne Linie = gestartete CEO-Kurse, rote Punkte = LinkedIn-Posts (Höhe = Impressionen), orange Dreiecke = Calls/Insights. Sichtbar ist die Kette Call → Insight → Post → Nutzer-Spike (z.B. erster Post-Batch 27.04. + Irmscher-Call 28.04. → IHK-advisor-Post 06.05. → erste Wachstumsphase; 67-vs-42-Viral 06.05. → 18.604 Impr.; MEGA-Viral 80/20 DE 13.05. → 36.745 Impr. → mehrtägiger Anmelde-Schub bis 19./20.05.). Daten aus LinkedIn Analytics + interner Anmelde-DB, Stand 27.05.2026."}
        </p>
      </section>
    </div>
  );
}

function EngagementTooltipV3({
  active,
  payload,
  isEn,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: {
      ts: number;
      signups?: number;
      courseStarts?: number;
      impressions?: number;
      post?: ViralPost;
      call?: Call;
    };
  }>;
  isEn?: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const post = row.post;
  const call = row.call;
  const dateLocale = isEn ? "en-US" : "de-DE";
  const numberLocale = isEn ? "en-US" : "de-DE";
  return (
    <div className="max-w-xs rounded-lg border bg-card p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">
        {new Date(row.ts).toLocaleDateString(dateLocale, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
      <div className="mt-2 space-y-1 text-xs">
        {row.signups !== undefined && (
          <p>
            <span className="font-medium text-foreground">{row.signups}</span>{" "}
            {isEn ? "sign-ups" : "Sign-ups"} &middot;{" "}
            <span className="font-medium text-foreground">
              {row.courseStarts}
            </span>{" "}
            {isEn ? "CEO course starts" : "CEO-Kurs-Starts"}
          </p>
        )}
        {post && (
          <div className="space-y-1">
            <p className="font-medium leading-tight">{post.title}</p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {post.impressions.toLocaleString(numberLocale)}
              </span>{" "}
              {isEn ? "impressions" : "Impressionen"}
              {post.likes !== undefined && (
                <> &middot; {post.likes} Likes</>
              )}
            </p>
          </div>
        )}
        {call && (
          <div className="space-y-1">
            <p className="font-medium leading-tight">
              {call.name}
              {call.org && (
                <span className="text-muted-foreground"> &middot; {call.org}</span>
              )}
            </p>
            <p className="text-muted-foreground italic">{call.insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
