import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
  internetExposure: "offline",
  userCount: "tiny",
  vendorSupport: "active",
  incidentHistory: "minor",
  downtimeTolerance: "days",
  replaceability: "oneDay",
  personalData: "employeeOnly",
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
    name: "NIS2 Risk Assessment Matrix",
    description:
      "Free self-assessment tool for NIS2 Art 21(2)(a) risk analysis. Maps to BSI Grundschutz 200-2 Schutzbedarfsfeststellung with three-domain max-of aggregation.",
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
    <div className="space-y-10">
      <JsonLd />

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

      <RiskAssessmentShell exampleResult={exampleResult} />
    </div>
  );
}
