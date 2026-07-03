import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { getSession } from "@/lib/auth";
import { verifyDeletionRequestToken } from "@/lib/email/deletion-request";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";
import { DataDeletionForm, type DataDeletionMode } from "@/components/info/DataDeletionForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("dataDeletion");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("loeschung", locale),
    robots: { index: false, follow: false },
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      images: ogImages("loeschung", locale, t("meta.title")),
    },
  };
}

interface Resolved {
  mode: DataDeletionMode;
  email: string | null;
  token: string | null;
  userId: string | null;
}

/**
 * Establish identity server-side so the secret/token never leaves the server
 * and the client only receives the pass-through values it already had in the
 * URL. The submit mutation re-verifies; nothing here is trusted downstream.
 */
async function resolve(searchParams: Record<string, string | string[] | undefined>): Promise<Resolved> {
  const rawU = searchParams.u;
  const rawT = searchParams.t;
  const userId = typeof rawU === "string" ? rawU : null;
  const token = typeof rawT === "string" ? rawT : null;

  if (userId && token && verifyDeletionRequestToken(userId, token)) {
    const row = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { email: true },
    });
    if (!row) return { mode: "gone", email: null, token: null, userId: null };
    return { mode: "verified", email: row.email, token, userId };
  }

  const session = await getSession();
  if (session?.user.email) {
    return { mode: "verified", email: session.user.email, token: null, userId: null };
  }

  return { mode: "public", email: null, token: null, userId: null };
}

export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("dataDeletion");
  const { mode, email, token, userId } = await resolve(await searchParams);

  return (
    <article className="max-w-xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </header>

      {mode === "gone" ? (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-5">
          <h2 className="font-semibold">{t("alreadyDone.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("alreadyDone.body")}</p>
        </div>
      ) : (
        <DataDeletionForm mode={mode} email={email} token={token} userId={userId} />
      )}
    </article>
  );
}
