import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContinueNotice } from "@/components/auth/ContinueNotice";
import { PromoNotice } from "@/components/auth/PromoNotice";
import { SignInCard } from "@/components/auth/SignInCard";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { callbackDestination } from "@/lib/auth/callback-destination";
import { applyPromoToSession } from "@/lib/billing/promo-session";
import { isSellerInstance } from "@/lib/billing/seller";
import { NISD2_ORIGIN } from "@/lib/edition";
import { mailSupportEmail } from "@/lib/env";
import { replyAddress } from "@/lib/mail/templates";
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
  searchParams: Promise<{ promo?: string | string[]; callbackUrl?: string | string[] }>;
}) {
  const t = await getTranslations("auth");
  const { promo, callbackUrl } = await searchParams;
  const fromLink = typeof promo === "string" ? promo : undefined;
  const destination = callbackDestination(
    typeof callbackUrl === "string" ? callbackUrl : undefined,
  );
  // Someone already signed in gets it now, not at a sign-in that may come too late.
  await applyPromoToSession(fromLink);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="sr-only">{t("title")}</h1>
      <PromoNotice fromLink={fromLink} />
      <ContinueNotice destination={destination} />
      <SignInCard
        supportEmail={mailSupportEmail()}
        contactEmail={replyAddress()}
        independentInstall={!isSellerInstance()}
      />
      <LegalNotice className="mt-6 max-w-sm" />
      <p className="mt-6 text-sm text-muted-foreground">
        {/* nisd2.eu itself, also from a self-hosted install, whose own home is this sign-in. */}
        <a href={NISD2_ORIGIN} className="underline hover:text-foreground">
          {t("backToHome")}
        </a>
      </p>
    </div>
  );
}
