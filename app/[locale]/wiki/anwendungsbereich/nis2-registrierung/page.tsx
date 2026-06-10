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
  const title = t("registration.meta.title");
  const description = t("registration.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/anwendungsbereich/nis2-registrierung", locale),
    ...pageOg({
      slug: "wiki/anwendungsbereich/nis2-registrierung",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const statKeys = ["estimated", "awareness", "portalWindow", "deadline"] as const;
const reasonKeys = ["awareness", "complexity", "resources", "uncertainty"] as const;
const consequenceKeys = ["fines", "liability", "enforcement", "reputation"] as const;

export default async function RegistrationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="anwendungsbereich"
        slug="nis2-registrierung"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Compliance-Verantwortliche"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      <header>
        <Badge variant="secondary" className="mb-3">BSI</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("registration.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("registration.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{t("registration.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("registration.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("registration.overview.p3")}</p>
      </section>

      {/* Key Numbers */}
      <Card>
        <CardHeader>
          <CardTitle>{t("registration.stats.heading")}</CardTitle>
          <CardDescription>{t("registration.stats.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{t(`registration.stats.items.${key}.value`)}</p>
                <p className="mt-1 text-sm font-medium">{t(`registration.stats.items.${key}.label`)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(`registration.stats.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Why the Gap */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("registration.reasons.heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("registration.reasons.description")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {reasonKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`registration.reasons.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`registration.reasons.items.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Consequences */}
      <Card>
        <CardHeader>
          <CardTitle>{t("registration.consequences.heading")}</CardTitle>
          <CardDescription>{t("registration.consequences.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {consequenceKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{t(`registration.consequences.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`registration.consequences.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("registration.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("registration.sources.items") as string[]).map((source, i) => (
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
          <CardTitle>{t("registration.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("registration.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("registration.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
