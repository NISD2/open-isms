import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { SignInCard } from "@/components/auth/SignInCard";
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

export default async function SignInPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="sr-only">{t("title")}</h1>
      <SignInCard />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="underline hover:text-foreground">
          {t("backToHome")}
        </Link>
      </p>
    </div>
  );
}
