import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db, ensureDbConnected } from "@/lib/db";
import { sql } from "drizzle-orm";

export const metadata = {
  title: "Dashboard — open-isms",
};

// Force dynamic so the session check happens per-request and we don't try
// to render at build time (no DB at build time).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  await ensureDbConnected();

  // Two raw counts to prove the GRC + ISMS schemas are wired up. When
  // the actual ISMS UI is ported in, replace these with the tRPC
  // dashboard router from the upstream app.
  const requirementResult = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM requirement`,
  );
  const frameworkResult = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM compliance_framework`,
  );
  const requirementCount = requirementResult.rows[0]?.count ?? "0";
  const frameworkCount = frameworkResult.rows[0]?.count ?? "0";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-mono">{session.user.email}</span>
          </p>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Frameworks loaded</div>
          <div className="mt-2 text-4xl font-semibold tabular-nums">
            {frameworkCount}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            From <code>@nisd2/grc-data-model</code> (NIS 2, GDPR, EU AI Act,
            CRA, ISO 27001).
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
          This dashboard is a stub. The full ISMS portal (compliance tracking,
          asset inventory, risk register, supplier portal, incident reporting,
          training) is being ported in from the upstream nisd2.eu monorepo.
        </p>
      </section>
    </main>
  );
}
