import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("cloudAnbieterAusgefallenNis2.meta.title");
  const description = t("cloudAnbieterAusgefallenNis2.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/troubleshooting/cloud-anbieter-ausgefallen-nis2",
      locale,
    ),
    ...pageOg({
      slug: "wiki/troubleshooting/cloud-anbieter-ausgefallen-nis2",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "regulation", "transposition"] as const;
const elementKeys = ["assess", "dependency", "report"] as const;
const principleKeys = ["continuity", "recoverableBackup"] as const;
const nationalKeys = ["bsi", "sector", "enisa"] as const;
const pitfallKeys = ["cloudIsOutOfScope", "waitForSla", "noPostIncidentReview"] as const;

export default async function CloudAnbieterAusgefallenNis2Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="troubleshooting"
          slug="cloud-anbieter-ausgefallen-nis2"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="IT-Leitung und Geschäftsführung"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            Art. 23 NIS 2
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("cloudAnbieterAusgefallenNis2.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("cloudAnbieterAusgefallenNis2.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-06-01"
          sourceLocale="en"
        />

        <Separator />

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("cloudAnbieterAusgefallenNis2.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("cloudAnbieterAusgefallenNis2.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("cloudAnbieterAusgefallenNis2.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("cloudAnbieterAusgefallenNis2.overview.p3")}
          </p>
        </section>

        {/* Legal anchor */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cloudAnbieterAusgefallenNis2.legalAnchor.heading")}</CardTitle>
            <CardDescription>
              {t("cloudAnbieterAusgefallenNis2.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`cloudAnbieterAusgefallenNis2.legalAnchor.${key}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`cloudAnbieterAusgefallenNis2.legalAnchor.${key}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cloudAnbieterAusgefallenNis2.legalAnchor.${key}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Elements */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cloudAnbieterAusgefallenNis2.elements.heading")}</CardTitle>
            <CardDescription>
              {t("cloudAnbieterAusgefallenNis2.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(`cloudAnbieterAusgefallenNis2.elements.items.${key}.section`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`cloudAnbieterAusgefallenNis2.elements.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cloudAnbieterAusgefallenNis2.elements.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Principles */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cloudAnbieterAusgefallenNis2.principles.heading")}</CardTitle>
            <CardDescription>
              {t("cloudAnbieterAusgefallenNis2.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`cloudAnbieterAusgefallenNis2.principles.items.${key}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cloudAnbieterAusgefallenNis2.principles.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* National view */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("cloudAnbieterAusgefallenNis2.nationalView.heading")}
            </CardTitle>
            <CardDescription>
              {t("cloudAnbieterAusgefallenNis2.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(
                        `cloudAnbieterAusgefallenNis2.nationalView.items.${key}.country`,
                      )}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(`cloudAnbieterAusgefallenNis2.nationalView.items.${key}.label`)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cloudAnbieterAusgefallenNis2.nationalView.items.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pitfalls */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cloudAnbieterAusgefallenNis2.pitfalls.heading")}</CardTitle>
            <CardDescription>
              {t("cloudAnbieterAusgefallenNis2.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`cloudAnbieterAusgefallenNis2.pitfalls.items.${key}.myth`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`cloudAnbieterAusgefallenNis2.pitfalls.items.${key}.reality`)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Practitioner */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("cloudAnbieterAusgefallenNis2.practitioner.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("cloudAnbieterAusgefallenNis2.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("cloudAnbieterAusgefallenNis2.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cloudAnbieterAusgefallenNis2.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("cloudAnbieterAusgefallenNis2.sources.items") as string[]).map(
                (source) => (
                  <li
                    key={source}
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

        <WalkSteps codes={["4.2", "4.4", "5.2"]} />
      </div>
    </GlossedProse>
  );
}
