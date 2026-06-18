import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
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
    openGraph: {
      type: "website",
      images: [
        {
          url: `/og/home-${locale}.png`,
          width: 1200,
          height: 630,
          alt: "nisd2.eu: kostenlose NIS 2 Plattform",
        },
      ],
    },
  };
}

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <>
      <PublicNav />
      <main className="min-h-screen px-6 pt-24 pb-24 sm:pt-[18vh]">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          {/* Left: the pitch */}
          <div>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>

            <p className="mb-3 text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.rich("title", {
                blue: (chunks) => <span className="text-primary">{chunks}</span>,
              })}
            </h1>

            <p className="mt-4 max-w-xl text-muted-foreground">{t("subtitle")}</p>

            {/* CTAs */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/training/nis2-ceo">{t("startTraining")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/auth/signin">{t("ctaStart")}</Link>
              </Button>
            </div>

            {/* Supplier door */}
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/portal/supplier" className="underline underline-offset-4 hover:text-foreground">
                {t("supplierDoor")}
              </Link>
            </p>

            {/* Quiet authority strip (replaces the framework badges) */}
            <p className="mt-8 text-xs text-muted-foreground/70">{t("regLine")}</p>
          </div>

          {/* Right: credibility card. A 20-30s founder voice/video clip drops in at the top of this card later. */}
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("trust1")}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("trust2")}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("trust3")}</span>
              </li>
            </ul>
            <div className="mt-5 border-t border-border/60 pt-5">
              <p className="text-sm font-semibold">{t("cardWhyFreeTitle")}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("cardWhyFree")}</p>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
