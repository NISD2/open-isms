/**
 * The preference centre, reached from the footer of any optional email.
 *
 * Sits outside the [locale] segment like its sibling /email/unsubscribed,
 * because it is opened from a mail client with no session and no locale
 * cookie worth trusting. The language rides in the URL (`lang`), set at send
 * time from the same resolution the email body used, so the page speaks
 * whatever the email spoke.
 *
 * Credential is the HMAC-signed token from the email link. It grants exactly
 * one thing: managing that person's own email settings.
 */

import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { mailSupportEmail } from "@/lib/env";
import { buildEmailConsent } from "@/lib/mail/consent";
import { PAGE_COPY, parsePreferenceLocale } from "@/lib/mail/email-type-labels";
import { optionalEmailTypesByCategory } from "@/lib/mail/email-types";
import { emailPreference, user } from "@/schema";
import { PreferenceForm } from "./PreferenceForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email settings | NISD2",
  robots: { index: false, follow: false },
};

export default async function EmailPreferencesPage(props: {
  searchParams: Promise<{ u?: string; t?: string; lang?: string }>;
}) {
  const { u: userId, t: token, lang } = await props.searchParams;
  const locale = parsePreferenceLocale(lang);
  const copy = PAGE_COPY[locale];
  const supportEmail = mailSupportEmail();

  const valid = Boolean(userId && token && verifyUnsubscribeToken(userId, token));
  const recipient = valid
    ? await db.query.user.findFirst({
        where: eq(user.id, userId as string),
        columns: { id: true, email: true, emailFollowupsDisabled: true },
      })
    : undefined;

  if (!recipient) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-semibold">{copy.invalid}</h1>
          <p className="text-muted-foreground leading-relaxed">{copy.invalidHelp}</p>
          <p className="text-sm text-muted-foreground">
            <a className="underline" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </p>
          <div className="pt-4">
            <Link href="/" className="text-sm underline">
              nisd2.eu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const rows = await db
    .select({ scope: emailPreference.scope })
    .from(emailPreference)
    .where(eq(emailPreference.userId, recipient.id));
  const consent = buildEmailConsent({
    followupsDisabled: recipient.emailFollowupsDisabled,
    scopes: rows.map((r) => r.scope),
  });

  return (
    <main className="min-h-screen px-6 py-12 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{copy.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{copy.intro}</p>
          <p className="text-sm text-muted-foreground">{recipient.email}</p>
        </div>

        <PreferenceForm
          userId={recipient.id}
          token={token as string}
          locale={locale}
          groups={optionalEmailTypesByCategory()}
          allOptionalDisabled={consent.allOptionalDisabled}
          optedOutScopes={Array.from(consent.optedOutScopes)}
        />

        <div className="pt-4">
          <Link href="/" className="text-sm underline">
            nisd2.eu
          </Link>
        </div>
      </div>
    </main>
  );
}
