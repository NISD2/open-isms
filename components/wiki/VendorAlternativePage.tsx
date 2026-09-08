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
import { type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

const goodAtKeys = ["automation", "frameworks", "trust"] as const;
const gapKeys = ["pricing", "residency", "depth", "weight"] as const;
const differentKeys = ["register", "evidence", "selfhost", "cost"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export async function VendorAlternativePage({
  namespace,
  slug,
  badge,
  rawLocale,
}: {
  namespace: "vantaAlternative" | "drataAlternative";
  slug: string;
  badge: string;
  rawLocale: string;
}) {
  const locale: Locale =
    rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="vergleich"
          slug={slug}
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            {badge}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t(`${namespace}.title`)}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t(`${namespace}.subtitle`)}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-09-08"
          sourceLocale="en"
        />

        <Separator />

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t(`${namespace}.overview.heading`)}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`${namespace}.overview.p1`)}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`${namespace}.overview.p2`)}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`${namespace}.overview.p3`)}
          </p>
        </section>

        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle>{t(`${namespace}.goodAt.heading`)}</CardTitle>
            <CardDescription>
              {t(`${namespace}.goodAt.description`)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {goodAtKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`${namespace}.goodAt.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`${namespace}.goodAt.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gaps */}
        <Card>
          <CardHeader>
            <CardTitle>{t(`${namespace}.gaps.heading`)}</CardTitle>
            <CardDescription>
              {t(`${namespace}.gaps.description`)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {gapKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`${namespace}.gaps.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`${namespace}.gaps.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What open-isms does differently */}
        <Card>
          <CardHeader>
            <CardTitle>{t(`${namespace}.different.heading`)}</CardTitle>
            <CardDescription>
              {t(`${namespace}.different.description`)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {differentKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`${namespace}.different.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`${namespace}.different.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* When the vendor is still the right choice */}
        <Card>
          <CardHeader>
            <CardTitle>{t(`${namespace}.stay.heading`)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`${namespace}.stay.p1`)}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`${namespace}.stay.p2`)}
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>{t(`${namespace}.faq.heading`)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {faqKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`${namespace}.faq.items.${key}.q`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`${namespace}.faq.items.${key}.a`)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{t(`${namespace}.sources.heading`)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw(`${namespace}.sources.items`) as string[]).map(
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
            <CardTitle>{t(`${namespace}.ctaCard.heading`)}</CardTitle>
            <CardDescription>
              {t(`${namespace}.ctaCard.description`)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">{t(`${namespace}.cta`)}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
