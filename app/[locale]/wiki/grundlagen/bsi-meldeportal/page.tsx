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
  const title = t("bsiMeldeportal.meta.title");
  const description = t("bsiMeldeportal.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/bsi-meldeportal", locale),
    ...pageOg({
      slug: "wiki/grundlagen/bsi-meldeportal",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["reporting", "registration"] as const;
const functionKeys = [
  "register",
  "earlyWarning",
  "incidentNotification",
  "intermediate",
  "final",
  "update",
  "info",
] as const;
const pitfallKeys = ["elsterTiming", "stalePerson", "noTestRun"] as const;

export default async function BsiMeldeportalPage({
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
          slug="bsi-meldeportal"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung, CISO, Datenschutzbeauftragte"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["bsig"]}
          mentionsKeys={["nis2"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            §32 + §33 BSIG · Art. 23 + Art. 3(4) NIS 2
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("bsiMeldeportal.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("bsiMeldeportal.subtitle")}
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
            {t("bsiMeldeportal.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("bsiMeldeportal.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("bsiMeldeportal.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("bsiMeldeportal.overview.p3")}
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("bsiMeldeportal.legalAnchor.heading")}</CardTitle>
            <CardDescription>
              {t("bsiMeldeportal.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`bsiMeldeportal.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`bsiMeldeportal.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`bsiMeldeportal.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bsiMeldeportal.functions.heading")}</CardTitle>
            <CardDescription>
              {t("bsiMeldeportal.functions.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {functionKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`bsiMeldeportal.functions.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`bsiMeldeportal.functions.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bsiMeldeportal.access.heading")}</CardTitle>
            <CardDescription>
              {t("bsiMeldeportal.access.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("bsiMeldeportal.access.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("bsiMeldeportal.access.p2")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("bsiMeldeportal.access.p3")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bsiMeldeportal.pitfalls.heading")}</CardTitle>
            <CardDescription>
              {t("bsiMeldeportal.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`bsiMeldeportal.pitfalls.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`bsiMeldeportal.pitfalls.items.${key}.body`)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bsiMeldeportal.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("bsiMeldeportal.sources.items") as string[]).map(
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
              {t("bsiMeldeportal.disclaimer")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bsiMeldeportal.ctaCard.heading")}</CardTitle>
            <CardDescription>
              {t("bsiMeldeportal.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/applicability">{t("bsiMeldeportal.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
