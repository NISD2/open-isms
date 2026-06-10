import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("auth");

  return {
    title: t("forgotPassword.title"),
    description: t("forgotPassword.description"),
    robots: { index: false, follow: false },
    alternates: pageAlternates("auth/forgot-password", locale),
  };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="sr-only">{t("forgotPassword.title")}</h1>
      <ForgotPasswordCard />
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/auth/signin" className="underline hover:text-foreground">
          {t("forgotPassword.backToSignIn")}
        </Link>
      </p>
    </div>
  );
}
