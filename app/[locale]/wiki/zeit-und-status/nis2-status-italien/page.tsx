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
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
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
  const title = t("nis2StatusItalien.meta.title");
  const description = t("nis2StatusItalien.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/zeit-und-status/nis2-status-italien", locale),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-status-italien",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const anchorKeys = ["directive", "regulation", "transposition"] as const;
const elementKeys = ["law", "authority", "deadlines"] as const;
const principleKeys = ["lexLocalis", "euFloor"] as const;
const nationalKeys = ["acn", "csirtIt", "enisa"] as const;
const pitfallKeys = ["sameAsGermany", "noRegistry", "onlySector"] as const;

export default async function Nis2StatusItalienPage({
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
          category="zeit-und-status"
          slug="nis2-status-italien"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="EU-weite Unternehmen"
          citationKeys={["nis2"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <WikiAnswerHeader
          badge="NIS 2 Status Italien"
          title={t("nis2StatusItalien.title")}
          answer={t("nis2StatusItalien.subtitle")}
          art="/images/wiki/nis2-europa.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-06-01"
          sourceLocale="en"
        />

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("nis2StatusItalien.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2StatusItalien.overview.p1")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2StatusItalien.overview.p2")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("nis2StatusItalien.overview.p3")}
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusItalien.legalAnchor.heading")}</CardTitle>
            <CardDescription>
              {t("nis2StatusItalien.legalAnchor.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`nis2StatusItalien.legalAnchor.${k}.label`)}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    {t(`nis2StatusItalien.legalAnchor.${k}.quote`)}
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2StatusItalien.legalAnchor.${k}.context`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusItalien.elements.heading")}</CardTitle>
            <CardDescription>
              {t("nis2StatusItalien.elements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">
                    {t(`nis2StatusItalien.elements.items.${k}.section`)}
                  </Badge>
                  <p className="text-sm font-semibold">
                    {t(`nis2StatusItalien.elements.items.${k}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2StatusItalien.elements.items.${k}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusItalien.principles.heading")}</CardTitle>
            <CardDescription>
              {t("nis2StatusItalien.principles.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`nis2StatusItalien.principles.items.${k}.title`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2StatusItalien.principles.items.${k}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusItalien.nationalView.heading")}</CardTitle>
            <CardDescription>
              {t("nis2StatusItalien.nationalView.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`nis2StatusItalien.nationalView.items.${k}.country`)}
                    </Badge>
                    <p className="text-sm font-semibold">
                      {t(`nis2StatusItalien.nationalView.items.${k}.label`)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2StatusItalien.nationalView.items.${k}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusItalien.pitfalls.heading")}</CardTitle>
            <CardDescription>
              {t("nis2StatusItalien.pitfalls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((k) => (
                <li key={k} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {t(`nis2StatusItalien.pitfalls.items.${k}.myth`)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(`nis2StatusItalien.pitfalls.items.${k}.reality`)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusItalien.practitioner.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("nis2StatusItalien.practitioner.p1")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("nis2StatusItalien.practitioner.p2")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusItalien.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("nis2StatusItalien.sources.items") as string[]).map((source) => (
                <li
                  key={source}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  {source}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <WalkSteps kind="national" />
      </div>
    </GlossedProse>
  );
}
