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
  const title = t("cooperationGroup.meta.title");
  const description = t("cooperationGroup.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/nis-2-kooperationsgruppe", locale),
    ...pageOg({
      slug: "wiki/grundlagen/nis-2-kooperationsgruppe",
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
  "justAnotherCommittee",
  "neverInteract",
  "enisaRuns",
] as const;

export default async function Nis2KooperationsgruppePage({
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
          slug="nis-2-kooperationsgruppe"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung, CISO und IT-Verantwortliche"
          citationKeys={["nis2"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["nis2"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            Art. 14 NIS 2
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("cooperationGroup.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("cooperationGroup.subtitle")}
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
            {t("cooperationGroup.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("cooperationGroup.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("cooperationGroup.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("cooperationGroup.overview.p3")}
          </p>
        </section>

        {/* Legal anchor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("cooperationGroup.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("cooperationGroup.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`cooperationGroup.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`cooperationGroup.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cooperationGroup.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Three building blocks */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cooperationGroup.elements.heading")}</CardTitle>
            <CardDescription>
              {t("cooperationGroup.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(`cooperationGroup.elements.items.${key}.section`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`cooperationGroup.elements.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cooperationGroup.elements.items.${key}.body`)}
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
              {t("cooperationGroup.principles.heading")}
            </CardTitle>
            <CardDescription>
              {t("cooperationGroup.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`cooperationGroup.principles.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cooperationGroup.principles.items.${key}.body`)}
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
              {t("cooperationGroup.nationalView.heading")}
            </CardTitle>
            <CardDescription>
              {t("cooperationGroup.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`cooperationGroup.nationalView.items.${key}.country`)}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(`cooperationGroup.nationalView.items.${key}.label`)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cooperationGroup.nationalView.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cooperationGroup.pitfalls.heading")}</CardTitle>
            <CardDescription>
              {t("cooperationGroup.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`cooperationGroup.pitfalls.items.${key}.myth`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cooperationGroup.pitfalls.items.${key}.reality`)}
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
              {t("cooperationGroup.practitioner.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("cooperationGroup.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("cooperationGroup.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Platform recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cooperationGroup.platform.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("cooperationGroup.platform.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("cooperationGroup.platform.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cooperationGroup.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("cooperationGroup.sources.items") as string[]).map(
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
            <CardTitle>{t("cooperationGroup.ctaCard.heading")}</CardTitle>
            <CardDescription>
              {t("cooperationGroup.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">{t("cooperationGroup.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
