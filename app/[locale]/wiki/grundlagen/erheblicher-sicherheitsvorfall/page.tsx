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
  const title = t("significantIncident.meta.title");
  const description = t("significantIncident.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/grundlagen/erheblicher-sicherheitsvorfall",
      locale,
    ),
    ...pageOg({
      slug: "wiki/grundlagen/erheblicher-sicherheitsvorfall",
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
const exampleKeys = [
  "ransomware",
  "phishingNoCreds",
  "cloudOutage",
  "ddosPortal",
  "dataLeakDualReport",
  "supplierBreach",
] as const;
const nationalKeys = ["bsi", "enisa", "transposition"] as const;
const pitfallKeys = [
  "blanketTransfer",
  "noAssets",
  "noAcceptanceCriteria",
] as const;

export default async function SignificantIncidentPage({
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
          slug="erheblicher-sicherheitsvorfall"
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
            Art. 23(3) NIS 2 + CIR Art. 3
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("significantIncident.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("significantIncident.subtitle")}
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
            {t("significantIncident.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("significantIncident.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("significantIncident.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("significantIncident.overview.p3")}
          </p>
        </section>

        {/* Legal anchor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("significantIncident.legalAnchor.heading")}
            </CardTitle>
            <CardDescription>
              {t("significantIncident.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`significantIncident.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`significantIncident.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`significantIncident.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CIR articles */}
        <Card>
          <CardHeader>
            <CardTitle>{t("significantIncident.elements.heading")}</CardTitle>
            <CardDescription>
              {t("significantIncident.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(`significantIncident.elements.items.${key}.section`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`significantIncident.elements.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`significantIncident.elements.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two NIS 2 triggers */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("significantIncident.principles.heading")}
            </CardTitle>
            <CardDescription>
              {t("significantIncident.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`significantIncident.principles.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`significantIncident.principles.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Examples — reportable vs not */}
        <Card>
          <CardHeader>
            <CardTitle>{t("significantIncident.examples.heading")}</CardTitle>
            <CardDescription>
              {t("significantIncident.examples.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exampleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`significantIncident.examples.items.${key}.verdict`)}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(`significantIncident.examples.items.${key}.title`)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`significantIncident.examples.items.${key}.body`)}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs leading-relaxed">
                  {t("significantIncident.examples.uncertainHint")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voluntary reporting — Art. 30 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("significantIncident.voluntaryReporting.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.voluntaryReporting.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.voluntaryReporting.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Customer notification — Art. 23(2) */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("significantIncident.customerNotification.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.customerNotification.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.customerNotification.p2")}
            </p>
          </CardContent>
        </Card>

        {/* National operationalisation */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("significantIncident.nationalView.heading")}
            </CardTitle>
            <CardDescription>
              {t("significantIncident.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`significantIncident.nationalView.items.${key}.country`)}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(`significantIncident.nationalView.items.${key}.label`)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`significantIncident.nationalView.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle>{t("significantIncident.pitfalls.heading")}</CardTitle>
            <CardDescription>
              {t("significantIncident.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`significantIncident.pitfalls.items.${key}.myth`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`significantIncident.pitfalls.items.${key}.reality`)}
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
              {t("significantIncident.practitioner.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Platform recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>{t("significantIncident.platform.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.platform.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("significantIncident.platform.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{t("significantIncident.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("significantIncident.sources.items") as string[]).map(
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
            <CardTitle>{t("significantIncident.ctaCard.heading")}</CardTitle>
            <CardDescription>
              {t("significantIncident.ctaCard.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">{t("significantIncident.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
