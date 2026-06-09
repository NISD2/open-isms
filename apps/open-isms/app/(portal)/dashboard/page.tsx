import { db, ensureDbConnected } from "@/lib/db";
import { sql } from "drizzle-orm";

export const metadata = {
  title: "Dashboard — open-isms",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureDbConnected();

  const requirementResult = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM requirement`,
  );
  const frameworkResult = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM compliance_framework`,
  );
  const requirementCount = requirementResult.rows[0]?.count ?? "0";
  const frameworkCount = frameworkResult.rows[0]?.count ?? "0";

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Status summary of your ISMS.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Frameworks loaded</div>
          <div className="mt-2 text-4xl font-semibold tabular-nums">
            {frameworkCount}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Seeded from <code>@nisd2/grc-data-model</code>.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Requirements seeded</div>
          <div className="mt-2 text-4xl font-semibold tabular-nums">
            {requirementCount}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Articles across the loaded frameworks.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">What&apos;s next</p>
        <p className="mt-2">
          The compliance page is live (see sidebar). Asset inventory, risk
          register, supplier portal, incident reporting, and training are
          being ported in from the upstream nisd2.eu monorepo.
        </p>
      </section>
    </div>
  );
}
