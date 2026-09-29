import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PromoNotice } from "@/components/auth/PromoNotice";
import { SignInCard } from "@/components/auth/SignInCard";
import { Link } from "@/i18n/navigation";
import { applyPromoToSession } from "@/lib/billing/promo-session";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("auth");

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
    alternates: pageAlternates("auth/signin", locale),
  };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string | string[] }>;
}) {
  const t = await getTranslations("auth");
  const { promo } = await searchParams;
  const fromLink = typeof promo === "string" ? promo : undefined;
  // Someone already signed in gets it now, not at a sign-in that may come too late.
  await applyPromoToSession(fromLink);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="sr-only">{t("title")}</h1>
      <PromoNotice fromLink={fromLink} />
      <SignInCard />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="underline hover:text-foreground">
          {t("backToHome")}
        </Link>
      </p>
    </div>
  );
}
