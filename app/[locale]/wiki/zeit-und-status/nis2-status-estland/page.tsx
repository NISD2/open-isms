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
  const title = t("nis2StatusEstland.meta.title");
  const description = t("nis2StatusEstland.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/zeit-und-status/nis2-status-estland",
      locale,
    ),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-status-estland",
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
const nationalKeys = ["authority", "csirt", "enisa"] as const;
const pitfallKeys = ["sameAsGermany", "noRegistry", "onlySector"] as const;

export default async function Nis2StatusEstlandPage({
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
          category="zeit-und-status"
          slug="nis2-status-estland"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="EU-weite Unternehmen"
          citationKeys={["nis2"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            NIS 2 Status Estland
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("nis2StatusEstland.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("nis2StatusEstland.subtitle")}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-06-01"
          sourceLocale="en"
        />

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("nis2StatusEstland.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusEstland.overview.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusEstland.overview.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusEstland.overview.p3")}</p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.legalAnchor.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusEstland.legalAnchor.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(`nis2StatusEstland.legalAnchor.${k}.label`)}</p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">{t(`nis2StatusEstland.legalAnchor.${k}.quote`)}</blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusEstland.legalAnchor.${k}.context`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.elements.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusEstland.elements.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">{t(`nis2StatusEstland.elements.items.${k}.section`)}</Badge>
                  <p className="text-sm font-semibold">{t(`nis2StatusEstland.elements.items.${k}.title`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusEstland.elements.items.${k}.body`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.principles.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusEstland.principles.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">{t(`nis2StatusEstland.principles.items.${k}.title`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusEstland.principles.items.${k}.body`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.nationalView.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusEstland.nationalView.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((k) => (
                <div key={k} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">{t(`nis2StatusEstland.nationalView.items.${k}.country`)}</Badge>
                    <p className="text-sm font-semibold">{t(`nis2StatusEstland.nationalView.items.${k}.label`)}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusEstland.nationalView.items.${k}.body`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.pitfalls.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusEstland.pitfalls.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((k) => (
                <li key={k} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">{t(`nis2StatusEstland.pitfalls.items.${k}.myth`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusEstland.pitfalls.items.${k}.reality`)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.practitioner.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusEstland.practitioner.p1")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusEstland.practitioner.p2")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.platform.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusEstland.platform.p1")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusEstland.platform.p2")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("nis2StatusEstland.sources.items") as string[]).map((source, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  {source}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusEstland.ctaCard.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusEstland.ctaCard.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/applicability?country=EE` as never}>{t("nis2StatusEstland.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
