import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { FrameworkBadges } from "@/components/landing/FrameworkBadges";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isDE = locale === "de";
  const isNL = locale === "nl";
  return {
    title: isDE
      ? "Kostenlose NIS 2 Plattform: Gap-Analyse, Vorlagen, Training"
      : isNL
        ? "Gratis NIS 2 platform: gap assessment, sjablonen, training"
        : "Free NIS 2 platform: gap assessment, templates, training",
    description: isDE
      ? "Selbsteinschätzung mit 116 Fragen, Vorlagen für § 30 BSIG und Artikel 21 NIS 2, BSI-Registrierung und Schulung der Geschäftsführung. Open Source, kein Lock-in."
      : isNL
        ? "Zelfbeoordeling met 116 vragen, sjablonen voor Artikel 21 NIS 2, registratiehulp en bestuurstraining. Open source, geen lock-in."
        : "Self-assessment with 116 questions, templates for Article 21 NIS 2, BSI registration guide, and management training. Open Source, no lock-in.",
    alternates: pageAlternates("", locale),
  };
}

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <>
    <PublicNav />
    <main className="min-h-screen px-6 pt-24 pb-24 sm:pt-[20vh]">
      <div className="mx-auto w-full max-w-6xl">
        {/* Logo */}
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          <Link
            href="/about"
            className="underline decoration-2 decoration-foreground/30 underline-offset-[10px] transition-colors hover:decoration-foreground"
          >
            {t.rich("title", {
              blue: (chunks) => <span className="text-primary">{chunks}</span>,
            })}
          </Link>
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          {t.rich("subtitle", {
            link: (chunks) => (
              <a
                href="https://www.frontier-economics.com/media/izyk5rgz/assessing-the-economic-cost-of-eu-initiatives-on-cybersecurity.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        {/* Product line */}
        <p className="mt-4 max-w-lg text-sm font-medium text-foreground">
          {t("productLine")}
        </p>

        {/* Frameworks */}
        <FrameworkBadges />

        {/* Urgency */}
        <p className="mt-8 text-xs text-muted-foreground">
          {t("stats.urgency")}
        </p>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/training/nis2-ceo">{t("startTraining")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/applicability">{t("checkApplicability")}</Link>
          </Button>
        </div>
      </div>
    </main>
    <PublicFooter />
    </>
  );
}
