"use client";

/**
 * The weekly read, at the top of the tab and above the range filter, because
 * it reports on a fixed seven-day window and must not reshuffle while someone
 * browses the charts underneath.
 *
 * Tone is carried by a written label, never by the stripe colour alone: two of
 * the three status colours sit under 3:1 on a white card, and a reader who
 * cannot separate orange from yellow still gets the meaning from the words.
 */

import type { Insight } from "./insights";

const TONE = {
  act: { label: "Act on this", color: "#ec835a" },
  watch: { label: "Worth watching", color: "#fab219" },
  good: { label: "Good news", color: "#0ca30c" },
} as const satisfies Record<Insight["tone"], { label: string; color: string }>;

export function InsightsCard({
  insights,
  from,
  to,
}: {
  insights: Insight[];
  from: string;
  to: string;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">This week</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {from} to {to}. Up to three things worth acting on, ranked by how much they
          matter rather than by how recent they are. Not affected by the range selector
          below.
        </p>
      </div>

      {insights.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          Nothing crossed a threshold this week. That is a real answer, not an empty
          state: no collapse in activity, no backlog growing, nothing overdue for a nudge.
          The charts below still have the detail.
        </p>
      ) : (
        <ol className="space-y-5">
          {insights.map((insight) => {
            const tone = TONE[insight.tone];
            return (
              <li
                key={insight.id}
                className="border-l-[3px] pl-4"
                style={{ borderColor: tone.color }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: tone.color }}
                >
                  {tone.label}
                </p>
                <p className="mt-1 font-medium">{insight.headline}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{insight.detail}</p>
                <p className="mt-1.5 text-sm">
                  <span className="font-medium">Next:</span> {insight.action}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
