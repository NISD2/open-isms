import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SetupAccessCard } from "@/components/auth/SetupAccessCard";
import { Link } from "@/i18n/navigation";
import { readOpenSetupToken } from "@/lib/auth/setup-link";
import { db } from "@/lib/db";

/**
 * Where an account setup link lands (door two, lib/billing/close-deal.ts). The token is checked on
 * the server; the page shows the address it belongs to, so the customer sees whose account they
 * are setting up. Not indexed.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("setup.title"), robots: { index: false, follow: false } };
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getTranslations("auth");
  const link = token ? await readOpenSetupToken(db, token) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="sr-only">{t("setup.title")}</h1>
      {link && token ? (
        <SetupAccessCard token={token} email={link.email} />
      ) : (
        <div className="max-w-md space-y-3 text-center">
          <p className="font-semibold text-lg">{t("setup.invalidTitle")}</p>
          <p className="text-muted-foreground text-sm">{t("setup.invalidDescription")}</p>
          <p className="flex justify-center gap-4 text-sm">
            <Link href="/auth/signin" className="underline">
              {t("signIn")}
            </Link>
            <Link href="/auth/forgot-password" className="underline">
              {t("forgotPasswordLink")}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
