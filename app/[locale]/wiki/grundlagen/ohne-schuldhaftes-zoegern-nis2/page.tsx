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
  const title = t("nis2WithoutUndueDelay.meta.title");
  const description = t("nis2WithoutUndueDelay.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/grundlagen/ohne-schuldhaftes-zoegern-nis2",
      locale,
    ),
    ...pageOg({
      slug: "wiki/grundlagen/ohne-schuldhaftes-zoegern-nis2",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "transposition", "recital"] as const;
const clockKeys = ["undueDelay", "twentyFour", "awareness"] as const;
const allowedKeys = ["confirmation", "escalation", "batching"] as const;
const exampleKeys = ["discovery", "confirmation", "filing"] as const;

export default async function WithoutUndueDelayPage({
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
          slug="ohne-schuldhaftes-zoegern-nis2"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="CISO, IT-Leitung, Geschäftsführung"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            Art. 23(4)(a) NIS 2 + §32 BSIG + §121 BGB
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("nis2WithoutUndueDelay.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("nis2WithoutUndueDelay.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-06-04"
          sourceLocale="en"
        />

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("nis2WithoutUndueDelay.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2WithoutUndueDelay.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2WithoutUndueDelay.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2WithoutUndueDelay.overview.p3")}
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2WithoutUndueDelay.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2WithoutUndueDelay.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`nis2WithoutUndueDelay.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`nis2WithoutUndueDelay.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2WithoutUndueDelay.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2WithoutUndueDelay.twoClocks.heading")}</CardTitle>
            <CardDescription>
              {t("nis2WithoutUndueDelay.twoClocks.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {clockKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`nis2WithoutUndueDelay.twoClocks.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2WithoutUndueDelay.twoClocks.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2WithoutUndueDelay.whatUndueDelayAllows.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2WithoutUndueDelay.whatUndueDelayAllows.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allowedKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(
                      `nis2WithoutUndueDelay.whatUndueDelayAllows.items.${key}.title`,
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      `nis2WithoutUndueDelay.whatUndueDelayAllows.items.${key}.body`,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("nis2WithoutUndueDelay.workedExample.heading")}
            </CardTitle>
            <CardDescription>
              {t("nis2WithoutUndueDelay.workedExample.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exampleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`nis2WithoutUndueDelay.workedExample.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2WithoutUndueDelay.workedExample.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2WithoutUndueDelay.audit.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("nis2WithoutUndueDelay.audit.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("nis2WithoutUndueDelay.audit.p2")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2WithoutUndueDelay.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("nis2WithoutUndueDelay.sources.items") as string[]).map(
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
              {t("nis2WithoutUndueDelay.disclaimer")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2WithoutUndueDelay.ctaCard.heading")}</CardTitle>
            <CardDescription>
              {t("nis2WithoutUndueDelay.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">{t("nis2WithoutUndueDelay.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
