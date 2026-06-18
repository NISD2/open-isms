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
import { JsonLd } from "@/components/JsonLd";
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
  const title = t("howToPrepareBsiAudit.meta.title");
  const description = t("howToPrepareBsiAudit.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/wie-bsi-audit-vorbereiten", locale),
    ...pageOg({
      slug: "wiki/umsetzung/wie-bsi-audit-vorbereiten",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "regulation", "transposition"] as const;
const elementKeys = ["evidenceLadder", "dryRun", "dataRoom"] as const;
const principleKeys = ["datedOverComprehensive", "operatedNotDocumented"] as const;
const nationalKeys = ["bsi", "enisa", "sector"] as const;
const pitfallKeys = [
  "policiesAreEnough",
  "lastWeekPrep",
  "onlyWhatWeHand",
] as const;

export default async function HowToPrepareBsiAuditPage({
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
          slug="wie-bsi-audit-vorbereiten"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung, CISO und IT-Verantwortliche"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2", "bsig"]}
          mentionsKeys={["bsig"]}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: t("howToPrepareBsiAudit.title"),
            description: t("howToPrepareBsiAudit.subtitle"),
            step: elementKeys.map((key, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: t(`howToPrepareBsiAudit.elements.items.${key}.title`),
              text: t(`howToPrepareBsiAudit.elements.items.${key}.body`),
            })),
          }}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            §64 + §65 BSIG
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("howToPrepareBsiAudit.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("howToPrepareBsiAudit.subtitle")}
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
            {t("howToPrepareBsiAudit.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("howToPrepareBsiAudit.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("howToPrepareBsiAudit.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("howToPrepareBsiAudit.overview.p3")}
          </p>
        </section>

        {/* Legal anchor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("howToPrepareBsiAudit.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToPrepareBsiAudit.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`howToPrepareBsiAudit.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`howToPrepareBsiAudit.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToPrepareBsiAudit.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Three prep steps */}
        <Card>
          <CardHeader>
            <CardTitle>{t("howToPrepareBsiAudit.elements.heading")}</CardTitle>
            <CardDescription>
              {t("howToPrepareBsiAudit.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(`howToPrepareBsiAudit.elements.items.${key}.section`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`howToPrepareBsiAudit.elements.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToPrepareBsiAudit.elements.items.${key}.body`)}
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
              {t("howToPrepareBsiAudit.principles.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToPrepareBsiAudit.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`howToPrepareBsiAudit.principles.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToPrepareBsiAudit.principles.items.${key}.body`)}
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
              {t("howToPrepareBsiAudit.nationalView.heading")}
            </CardTitle>
            <CardDescription>
              {t("howToPrepareBsiAudit.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`howToPrepareBsiAudit.nationalView.items.${key}.country`)}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(`howToPrepareBsiAudit.nationalView.items.${key}.label`)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToPrepareBsiAudit.nationalView.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle>{t("howToPrepareBsiAudit.pitfalls.heading")}</CardTitle>
            <CardDescription>
              {t("howToPrepareBsiAudit.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`howToPrepareBsiAudit.pitfalls.items.${key}.myth`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`howToPrepareBsiAudit.pitfalls.items.${key}.reality`)}
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
              {t("howToPrepareBsiAudit.practitioner.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToPrepareBsiAudit.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToPrepareBsiAudit.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Platform recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>{t("howToPrepareBsiAudit.platform.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToPrepareBsiAudit.platform.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("howToPrepareBsiAudit.platform.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{t("howToPrepareBsiAudit.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("howToPrepareBsiAudit.sources.items") as string[]).map(
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
            <CardTitle>{t("howToPrepareBsiAudit.ctaCard.heading")}</CardTitle>
            <CardDescription>
              {t("howToPrepareBsiAudit.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">{t("howToPrepareBsiAudit.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
