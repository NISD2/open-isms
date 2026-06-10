import Link from "next/link";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session?.user?.email);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-xl border border-border bg-card p-8 shadow-md">
        <h1 className="text-4xl font-semibold">open-isms</h1>
        <p className="mt-3 text-muted-foreground">
          Open-source NIS 2 ISMS platform. Self-hostable, AGPL-3.0.
        </p>

        <div className="mt-6 flex gap-3">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to dashboard →
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
          <a
            href="https://github.com/NISD2/open-isms"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            GitHub
          </a>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Maintained by{" "}
          <a
            href="https://www.nisd2.eu"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            nisd2.eu
          </a>
          .
        </p>
      </div>
    </main>
  );
}
