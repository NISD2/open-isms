import { AdvisoryPartners } from "@/components/platform-admin/AdvisoryPartners";
import { AdvisoryRequestsTable } from "@/components/platform-admin/AdvisoryRequestsTable";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";

export const dynamic = "force-dynamic";

/** A count list, the widest bar being the largest row rather than the page. */
function Breakdown({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-2 text-sm">
              <span className="w-8 shrink-0 tabular-nums text-muted-foreground">
                {row.count}
              </span>
              <span
                className="h-2 shrink-0 rounded-full bg-primary/70"
                style={{ width: `${(row.count / max) * 30}%` }}
                aria-hidden="true"
              />
              <span className="truncate" title={row.key}>
                {row.key}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Requests raised from /hilfe, what they add up to, and where each has been sent. */
export default async function AdvisoryRequestsRoute() {
  await requirePlatformAdmin();
  const [requests, stats] = await Promise.all([
    api.platformAdmin.advisoryRequests(),
    api.platformAdmin.advisoryStats(),
  ]);

  const unsent = requests.filter((r) => r.referrals.length === 0).length;
  const earned = requests
    .flatMap((r) => r.referrals)
    .reduce((sum, ref) => sum + (ref.feeCents ?? 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Advisory requests</h1>
        <p className="text-sm text-muted-foreground">
          {requests.length} request{requests.length === 1 ? "" : "s"}, {unsent} not sent
          to anyone yet, {(earned / 100).toFixed(0)} EUR recorded across all referrals.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Which page produced the request"
          rows={stats.sources}
          empty="Nothing yet."
        />
        <Breakdown
          title="Where they were before that"
          rows={stats.referrers}
          empty="Nothing yet."
        />
        <Breakdown
          title="What they asked about"
          rows={stats.topics}
          empty="Nothing yet."
        />
        <Breakdown
          title="Requests per week"
          rows={stats.weeks}
          empty="Nothing yet. This is the only number that matters."
        />
      </div>

      <AdvisoryPartners />

      <AdvisoryRequestsTable requests={requests} />
    </div>
  );
}
