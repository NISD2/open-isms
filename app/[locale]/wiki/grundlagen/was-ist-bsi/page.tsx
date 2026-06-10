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
  const title = t("wasIstBsi.meta.title");
  const description = t("wasIstBsi.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/was-ist-bsi", locale),
    ...pageOg({
      slug: "wiki/grundlagen/was-ist-bsi",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["errichtung", "aufgaben", "nis2"] as const;
const roleKeys = [
  "registration",
  "reporting",
  "csirt",
  "supervision",
  "information",
] as const;
const boundaryKeys = ["noLegalAdvice", "noCertifier", "noConsultant"] as const;

export default async function WasIstBsiPage({
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
          category="grundlagen"
          slug="was-ist-bsi"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["bsig"]}
          mentionsKeys={["nis2"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            §1 BSIG + Art. 8 NIS 2
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("wasIstBsi.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("wasIstBsi.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-06-04"
          sourceLocale="de"
        />

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("wasIstBsi.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("wasIstBsi.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("wasIstBsi.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("wasIstBsi.overview.p3")}
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("wasIstBsi.legalAnchor.heading")}</CardTitle>
            <CardDescription>
              {t("wasIstBsi.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`wasIstBsi.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`wasIstBsi.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`wasIstBsi.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("wasIstBsi.roles.heading")}</CardTitle>
            <CardDescription>
              {t("wasIstBsi.roles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {roleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`wasIstBsi.roles.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`wasIstBsi.roles.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("wasIstBsi.boundaries.heading")}</CardTitle>
            <CardDescription>
              {t("wasIstBsi.boundaries.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {boundaryKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`wasIstBsi.boundaries.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`wasIstBsi.boundaries.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("wasIstBsi.practitioner.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("wasIstBsi.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("wasIstBsi.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("wasIstBsi.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("wasIstBsi.sources.items") as string[]).map(
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

        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("wasIstBsi.disclaimer")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("wasIstBsi.ctaCard.heading")}</CardTitle>
            <CardDescription>
              {t("wasIstBsi.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/applicability">{t("wasIstBsi.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
