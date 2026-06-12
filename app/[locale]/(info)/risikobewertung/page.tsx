import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExamplePreview } from "@/components/risk-assessment/ExamplePreview";
import { RiskAssessmentTool } from "@/components/risk-assessment/RiskAssessmentTool";
import { scoreMatrix } from "@/lib/risk-assessment/scoring";
import { pageAlternates } from "@/lib/seo";

// Example answers shown above the form so visitors see the output shape
// before they start. Picked to land on Standard with visible spread on the
// radar (internet exposure + customer data trigger the security-domain
// hard-stop and the compliance lift; everything else stays moderate).
const EXAMPLE_ANSWERS = {
  internetExposure: "internetExposed",
  userCount: "large",
  vendorSupport: "active",
  incidentHistory: "none",
  downtimeTolerance: "weeks",
  replaceability: "oneWeek",
  personalData: "customer",
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
    <>
      <JsonLd />

      <header className="mb-6 space-y-2 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("page.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("page.subtitle")}</p>
        <p className="text-xs text-muted-foreground italic">
          {t("intro.trustLine")}
        </p>
      </header>

      <ExamplePreview result={exampleResult} />

      <RiskAssessmentTool />
    </>
  );
}
