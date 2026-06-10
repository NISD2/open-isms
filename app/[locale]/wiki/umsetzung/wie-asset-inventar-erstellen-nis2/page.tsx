import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("howToBuildAssetInventory.meta.title");
  const description = t("howToBuildAssetInventory.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/umsetzung/wie-asset-inventar-erstellen-nis2",
      locale,
    ),
    ...pageOg({
      slug: "wiki/umsetzung/wie-asset-inventar-erstellen-nis2",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "regulation", "transposition"] as const;
const elementKeys = ["processes", "systems", "classification"] as const;
const principleKeys = ["groupDontEnumerate", "processFirst"] as const;
const nationalKeys = ["bsi", "enisa", "iso"] as const;
const pitfallKeys = [
  "confluencePage",
  "everyServer",
  "skipProcessMap",
] as const;

export default async function HowToBuildAssetInventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale =
    rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="umsetzung"
          slug="wie-asset-inventar-erstellen-nis2"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung, CISO und IT-Verantwortliche"
          citationKeys={["nis2", "cir-2024-2690", "bsig"]}
          aboutKeys={["nis2", "cir-2024-2690"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            CIR §12.4 + BSI 200-2 §8.1
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("howToBuildAssetInventory.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("howToBuildAssetInventory.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-05-30"
          sourceLocale="en"
        />

        <Separator />

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("howToBuildAssetInventory.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("howToBuildAssetInventory.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("howToBuildAssetInventory.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("howToBuildAssetInventory.overview.p3")}
          </p>
        </section>

        {/* Legal anchor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToBuildAssetInventory.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`howToBuildAssetInventory.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`howToBuildAssetInventory.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToBuildAssetInventory.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Three build steps */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.elements.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToBuildAssetInventory.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(`howToBuildAssetInventory.elements.items.${key}.section`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`howToBuildAssetInventory.elements.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToBuildAssetInventory.elements.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two governing principles */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.principles.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToBuildAssetInventory.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`howToBuildAssetInventory.principles.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToBuildAssetInventory.principles.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* National operationalisation */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.nationalView.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToBuildAssetInventory.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(
                        `howToBuildAssetInventory.nationalView.items.${key}.country`,
                      )}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(
                        `howToBuildAssetInventory.nationalView.items.${key}.label`,
                      )}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `howToBuildAssetInventory.nationalView.items.${key}.body`,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.pitfalls.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToBuildAssetInventory.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`howToBuildAssetInventory.pitfalls.items.${key}.myth`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToBuildAssetInventory.pitfalls.items.${key}.reality`)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Practitioner view */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.practitioner.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToBuildAssetInventory.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToBuildAssetInventory.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Platform recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.platform.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToBuildAssetInventory.platform.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToBuildAssetInventory.platform.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.sources.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(
                t.raw("howToBuildAssetInventory.sources.items") as string[]
              ).map((source, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  {source}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToBuildAssetInventory.ctaCard.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToBuildAssetInventory.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">
                {t("howToBuildAssetInventory.cta")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
