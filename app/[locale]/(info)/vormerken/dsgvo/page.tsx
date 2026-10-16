import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { SignInLink } from "@/components/auth/SignInLink";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  gdprWaitlistSince,
  joinGdprWaitlist,
  leaveGdprWaitlist,
} from "@/lib/newsletter/waitlist";

const PATH = "/vormerken/dsgvo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gdpr.waitlistPage");
  return {
    title: t("title"),
    description: t("lead"),
    robots: { index: false, follow: false },
  };
}

/** The account a waitlist action acts for: the signed-in person's own, never one the form names. */
async function signedInUserId(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Sign in to change the waitlist.");
  return session.user.id;
}

async function join() {
  "use server";
  await joinGdprWaitlist(db, await signedInUserId());
  revalidatePath("/[locale]/vormerken/dsgvo", "page");
}

async function leave() {
  "use server";
  await leaveGdprWaitlist(db, await signedInUserId());
  revalidatePath("/[locale]/vormerken/dsgvo", "page");
}

/**
 * Where the GDPR pages' "Vormerken" leads. A signed-in person joins or leaves with one click of
 * their own; anyone else registers or signs in and comes back here, since only that click puts an
 * account on the list.
 */
export default async function GdprWaitlistPage() {
  const [t, format, locale, session] = await Promise.all([
    getTranslations("gdpr.waitlistPage"),
    getFormatter(),
    getLocale(),
    getSession(),
  ]);
  const since = session ? await gdprWaitlistSince(db, session.user.id) : null;
  const callbackUrl = locale === "de" ? PATH : `/${locale}${PATH}`;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-balance">{t("title")}</h1>
      <p className="text-lg leading-relaxed text-muted-foreground">{t("lead")}</p>

      {!session && (
        <div className="space-y-3">
          <Button asChild size="lg" className="h-11 rounded-lg px-5">
            <SignInLink query={{ mode: "register", callbackUrl }}>
              {t("register")}
            </SignInLink>
          </Button>
          <p className="text-sm">
            <SignInLink
              query={{ callbackUrl }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("signIn")}
            </SignInLink>
          </p>
        </div>
      )}

      {session && !since && (
        <form action={join}>
          <Button type="submit" size="lg" className="h-11 rounded-lg px-5">
            {t("join")}
          </Button>
        </form>
      )}

      {session && since && (
        <div className="space-y-3 rounded-xl border p-4">
          <p className="text-sm font-medium">
            {t("joined", { date: format.dateTime(since, { dateStyle: "long" }) })}
          </p>
          <form action={leave}>
            <Button type="submit" variant="outline">
              {t("leave")}
            </Button>
          </form>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("privacy")}{" "}
        <Link
          href="/datenschutz"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t("privacyLink")}
        </Link>
      </p>
    </div>
  );
}
