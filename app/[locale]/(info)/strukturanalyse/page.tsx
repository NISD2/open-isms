import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { MarketingHero, Underline } from "@/components/marketing/MarketingHero";
import { InventoryShell } from "@/components/asset-inventory/InventoryShell";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("assetInventory");
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: pageAlternates("strukturanalyse", locale),
    openGraph: {
      title: t("page.metaTitle"),
      description: t("page.metaDescription"),
      type: "website",
      images: ogImages("strukturanalyse", locale, t("page.metaTitle")),
    },
  };
}

export default async function StrukturanalysePage() {
  const t = await getTranslations("assetInventory");

  return (
    <div className="space-y-6">
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
        href="/risikobewertung"
        className="group block rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10 max-w-2xl"
      >
        <div className="flex items-center gap-3 text-sm">
          <ArrowRight className="h-4 w-4 flex-none text-primary" />
          <p className="text-foreground">
            {t("intro.riskAssessmentHint")}{" "}
            <span className="font-medium text-primary underline-offset-4 group-hover:underline">
              {t("intro.riskAssessmentLinkLabel")}
            </span>
          </p>
        </div>
      </Link>

      <InventoryShell />

      <p className="text-xs text-muted-foreground max-w-2xl pt-4 border-t border-border">
        {t("disclaimer.methodologyDisclosure")}
      </p>
    </div>
  );
}
