import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MarketingHero, Underline } from "@/components/marketing/MarketingHero";
import { RiskAssessmentShell } from "@/components/risk-assessment/RiskAssessmentShell";
import { scoreMatrix } from "@/lib/risk-assessment/scoring";
import { pageAlternates } from "@/lib/seo";

// Canned example used both for SEO crawlers (the radar card renders something
// useful before any JS runs) and as the "before you start" preview. Picked
// to land on Basic — a low-risk Mittelstand-typical offline HR workstation
// — so first-time visitors see a friendly green result rather than a
// red/amber alarm before they've even started.
const EXAMPLE_ANSWERS = {
  personalData: "employeeOnly",
  integrity: "moderate",
  downtimeTolerance: "days",
  userCount: "tiny",
  internetExposure: "offline",
  vendorSupport: "active",
  incidentHistory: "minor",
  replaceability: "oneDay",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("riskAssessment");
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: pageAlternates("risikobewertung", locale),
    openGraph: {
      title: t("page.metaTitle"),
      description: t("page.metaDescription"),
      type: "website",
      images: [
        {
          url: `/og/risikobewertung-${locale}.png`,
          width: 1200,
          height: 630,
          alt: t("page.metaTitle"),
        },
      ],
    },
  };
}

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "NIS2 Risk Assessment",
    description:
      "Free self-assessment heuristic in the spirit of BSI Grundschutz 200-2 §8.2 Schutzbedarfsfeststellung. Classifies V/I/A protection-need per asset (normal/hoch/sehr hoch) and recommends an Absicherungsvariante.",
    url: "https://www.nisd2.eu/risikobewertung",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "NIS2 Compliance Platform",
      url: "https://www.nisd2.eu",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function RiskAssessmentPage() {
  const t = await getTranslations("riskAssessment");
  const exampleResult = scoreMatrix({ ...EXAMPLE_ANSWERS });

  return (
    <div className="space-y-6">
      <JsonLd />

      <div className="space-y-3">
        <MarketingHero
          eyebrow={t("hero.eyebrow")}
          headline={t.rich("hero.headline", {
            u: (chunks) => <Underline>{chunks}</Underline>,
          })}
          accent={t.rich("hero.headlineAccent", {
            u: (chunks) => <Underline>{chunks}</Underline>,
          })}
          subhead={t("hero.subhead")}
        />

        <p className="text-xs text-muted-foreground italic max-w-2xl">
          {t("intro.trustLine")}
        </p>
      </div>

      <Link
        href="/training/nis2-ceo"
        className="group block rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10 max-w-2xl"
      >
        <div className="flex items-center gap-3 text-sm">
          <BookOpen className="h-4 w-4 flex-none text-primary" />
          <p className="text-foreground">
            {t("intro.inventoryHint")}{" "}
            <span className="font-medium text-primary underline-offset-4 group-hover:underline">
              {t("intro.courseLinkLabel")} →
            </span>
          </p>
        </div>
      </Link>

      <RiskAssessmentShell exampleResult={exampleResult} />

      <p className="text-xs text-muted-foreground max-w-2xl pt-4 border-t border-border">
        {t("disclaimer.methodologyDisclosure")}
      </p>
    </div>
  );
}
