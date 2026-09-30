import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PromoNotice } from "@/components/auth/PromoNotice";
import { SignInCard } from "@/components/auth/SignInCard";
import { Link } from "@/i18n/navigation";
import { applyPromoToSession } from "@/lib/billing/promo-session";
import { mailSupportEmail } from "@/lib/env";

/**
 * Where the promo link lands (`/anmelden?promo=2400`, `/en/login?promo=2400`, …).
 * The sign-in card everyone uses, with what the link means said above it: the
 * price and its last day, or that the offer has ended. The code itself is
 * remembered by proxy.ts and applied at the next sign-in. Not indexed: it is for
 * people sent a link.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("promo.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function PromoSignInPage({
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
      <SignInCard supportEmail={mailSupportEmail()} />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="underline hover:text-foreground">
          {t("backToHome")}
        </Link>
      </p>
    </div>
  );
}
