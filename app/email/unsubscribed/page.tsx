import type { Metadata } from "next";
import Link from "next/link";
import { mailSupportEmail } from "@/lib/env";

// Skip static rendering during `next build` — the Coolify build container
// occasionally hangs in worker-thread page generation and OOM-kills. This
// page has no expensive props so on-demand rendering is free.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribed | NISD2",
  robots: { index: false, follow: false },
};

export default async function UnsubscribedPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await props.searchParams;
  const supportEmail = mailSupportEmail();
  const isInvalid = status === "invalid";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md w-full text-center space-y-4">
        {isInvalid ? (
          <>
            <h1 className="text-2xl font-semibold">This link is no longer valid</h1>
            <p className="text-muted-foreground leading-relaxed">
              The unsubscribe link looks expired or incomplete. This usually happens when an
              email client cuts off the link or it gets copied incorrectly.
            </p>
            <p className="text-sm text-muted-foreground">
              To stop receiving emails, reply to any email or write to{" "}
              <a className="underline" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>{" "}
              and we&rsquo;ll take care of it.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">You&rsquo;re unsubscribed</h1>
            <p className="text-muted-foreground leading-relaxed">
              You won&rsquo;t receive follow-up emails about courses or other reminders from NISD2 anymore.
              You&rsquo;ll still receive the important ones (account, invites, deadline notifications).
            </p>
            <p className="text-sm text-muted-foreground">
              Changed your mind? Reply to any email or write to{" "}
              <a className="underline" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>{" "}
              and we&rsquo;ll flip it back.
            </p>
          </>
        )}
        <div className="pt-4">
          <Link href="/" className="text-sm underline">
            Back to nisd2.eu
          </Link>
        </div>
      </div>
    </main>
  );
}
