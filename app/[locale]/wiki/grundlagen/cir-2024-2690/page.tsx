import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("cir.meta.title");
  const description = t("cir.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/cir-2024-2690", locale),
    ...pageOg({
      slug: "wiki/grundlagen/cir-2024-2690",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const scopeKeys = ["dns", "tld", "cloud", "managed", "marketplaces", "social", "trust"] as const;
const articleKeys = ["a2", "a3", "a4", "a5", "a6", "a7"] as const;
const measureKeys = ["policy", "risk", "incidents", "continuity", "supply", "acquisition", "effectiveness", "hygiene", "crypto", "hr", "access", "assets", "physical"] as const;

export default async function CirPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="cir-2024-2690"
        locale={locale}
        authorSlug="cory-hisey"
        proficiencyLevel="Expert"
        audienceType="IT-Verantwortliche und Compliance-Beauftragte"
        citationKeys={["nis2", "cir-2024-2690"]}
        aboutKeys={["cir-2024-2690"]}
        mentionsKeys={["nis2"]}
      />
      <header>
        <Badge variant="secondary" className="mb-3">EU 2024/2690</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("cir.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("cir.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="cory-hisey" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("cir.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("cir.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("cir.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("cir.overview.p3")}</p>
      </section>

      {/* Who It Applies To */}
      <Card>
        <CardHeader>
          <CardTitle>{t("cir.scope.heading")}</CardTitle>
          <CardDescription>{t("cir.scope.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scopeKeys.map((key) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{t(`cir.scope.items.${key}`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Articles */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("cir.articles.heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cir.articles.description")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articleKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`cir.articles.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`cir.articles.items.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 13 Thematic Measure Points from the Annex */}
      <Card>
        <CardHeader>
          <CardTitle>{t("cir.measures.heading")}</CardTitle>
          <CardDescription>{t("cir.measures.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {measureKeys.map((key, index) => (
              <div key={key} className="flex gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`cir.measures.items.${key}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`cir.measures.items.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relationship to BSIG */}
      <Card>
        <CardHeader>
          <CardTitle>{t("cir.relationship.heading")}</CardTitle>
          <CardDescription>{t("cir.relationship.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("cir.relationship.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("cir.relationship.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("cir.relationship.p3")}</p>
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("cir.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("cir.sources.items") as string[]).map((source, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
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
          <CardTitle>{t("cir.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("cir.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("cir.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
