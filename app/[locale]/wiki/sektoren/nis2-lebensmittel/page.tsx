import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("sectorFood.meta.title");
  const description = t("sectorFood.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/sektoren/nis2-lebensmittel", locale),
    ...pageOg({
      slug: "wiki/sektoren/nis2-lebensmittel",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const assetKeys = [
  "erp",
  "production",
  "coldChain",
  "logistics",
  "lab",
  "endpoints",
] as const;
const priorityKeys = [
  "registration",
  "assets",
  "incidents",
  "suppliers",
  "access",
] as const;
const faqKeys = ["q1", "q2", "q3", "q4"] as const;

export default async function SectorFoodPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`sectorFood.faq.${key}.q`),
    acceptedAnswer: { "@type": "Answer" as const, text: t(`sectorFood.faq.${key}.a`) },
  }));

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="sektoren"
          slug="nis2-lebensmittel"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung in der Lebensmittelbranche"
          citationKeys={["nis2", "bsig", "cir-2024-2690"]}
          aboutKeys={["nis2"]}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs,
          }}
        />
        <header>
          <Badge variant="secondary" className="mb-3">
            {t("sectorFood.badge")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{t("sectorFood.title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("sectorFood.subtitle")}</p>
        </header>
        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
        />
        <Separator />
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("sectorFood.why.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("sectorFood.why.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("sectorFood.why.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("sectorFood.why.p3")}
          </p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>{t("sectorFood.assets.heading")}</CardTitle>
            <CardDescription>{t("sectorFood.assets.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assetKeys.map((key) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    {t(`sectorFood.assets.items.${key}.title`)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`sectorFood.assets.items.${key}.detail`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("sectorFood.priorities.heading")}</CardTitle>
            <CardDescription>{t("sectorFood.priorities.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityKeys.map((key, index) => (
                <div key={key} className="flex gap-4 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {t(`sectorFood.priorities.items.${key}.title`)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(`sectorFood.priorities.items.${key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("sectorFood.specifics.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("sectorFood.specifics.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("sectorFood.specifics.p2")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("sectorFood.specifics.p3")}
            </p>
          </CardContent>
        </Card>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("sectorFood.faq.heading")}
          </h2>
          <div className="space-y-3">
            {faqKeys.map((key) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold">{t(`sectorFood.faq.${key}.q`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`sectorFood.faq.${key}.a`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <WalkSteps codes={["12.2", "2.2", "2.3"]} />
      </div>
    </GlossedProse>
  );
}
