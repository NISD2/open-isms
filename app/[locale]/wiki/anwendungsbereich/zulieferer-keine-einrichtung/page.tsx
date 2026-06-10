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
  const title = t("suppliersNotInScope.meta.title");
  const description = t("suppliersNotInScope.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/anwendungsbereich/zulieferer-keine-einrichtung",
      locale,
    ),
    ...pageOg({
      slug: "wiki/anwendungsbereich/zulieferer-keine-einrichtung",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "regulation", "transposition"] as const;
const elementKeys = ["framework", "monitoring", "independent"] as const;
const principleKeys = ["allHazards", "proportionality"] as const;
const nationalKeys = ["bsi", "enisa", "transposition"] as const;
const pitfallKeys = [
  "blanketTransfer",
  "noAssets",
  "noAcceptanceCriteria",
] as const;

export default async function SuppliersNotInScopePage({
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
          category="anwendungsbereich"
          slug="zulieferer-keine-einrichtung"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung, Einkauf und Lieferantenmanagement"
          citationKeys={["nis2", "cir-2024-2690", "bsig"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["cir-2024-2690", "bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            NIS 2 Art. 2 + Annex I/II
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("suppliersNotInScope.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("suppliersNotInScope.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-05-29"
          sourceLocale="en"
        />

        <Separator />

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("suppliersNotInScope.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("suppliersNotInScope.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("suppliersNotInScope.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("suppliersNotInScope.overview.p3")}
          </p>
        </section>

        {/* Legal anchor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("suppliersNotInScope.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("suppliersNotInScope.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`suppliersNotInScope.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`suppliersNotInScope.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`suppliersNotInScope.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Three scope criteria */}
        <Card>
          <CardHeader>
            <CardTitle>{t("suppliersNotInScope.elements.heading")}</CardTitle>
            <CardDescription>
              {t("suppliersNotInScope.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(`suppliersNotInScope.elements.items.${key}.section`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`suppliersNotInScope.elements.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`suppliersNotInScope.elements.items.${key}.body`)}
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
              {t("suppliersNotInScope.principles.heading")}
            </CardTitle>
            <CardDescription>
              {t("suppliersNotInScope.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`suppliersNotInScope.principles.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`suppliersNotInScope.principles.items.${key}.body`)}
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
              {t("suppliersNotInScope.nationalView.heading")}
            </CardTitle>
            <CardDescription>
              {t("suppliersNotInScope.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(
                        `suppliersNotInScope.nationalView.items.${key}.country`,
                      )}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(`suppliersNotInScope.nationalView.items.${key}.label`)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`suppliersNotInScope.nationalView.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pitfalls / misreadings */}
        <Card>
          <CardHeader>
            <CardTitle>{t("suppliersNotInScope.pitfalls.heading")}</CardTitle>
            <CardDescription>
              {t("suppliersNotInScope.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`suppliersNotInScope.pitfalls.items.${key}.myth`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`suppliersNotInScope.pitfalls.items.${key}.reality`)}
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
              {t("suppliersNotInScope.practitioner.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("suppliersNotInScope.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("suppliersNotInScope.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Platform recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>{t("suppliersNotInScope.platform.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("suppliersNotInScope.platform.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("suppliersNotInScope.platform.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{t("suppliersNotInScope.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("suppliersNotInScope.sources.items") as string[]).map(
                (source, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    {source}
                  </li>
                ),
              )}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardHeader>
            <CardTitle>{t("suppliersNotInScope.ctaCard.heading")}</CardTitle>
            <CardDescription>
              {t("suppliersNotInScope.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">{t("suppliersNotInScope.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
