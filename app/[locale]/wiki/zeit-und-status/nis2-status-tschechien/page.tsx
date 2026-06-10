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
  const title = t("nis2StatusTschechien.meta.title");
  const description = t("nis2StatusTschechien.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/zeit-und-status/nis2-status-tschechien",
      locale,
    ),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-status-tschechien",
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
const nationalKeys = ["nukib", "sectoral", "enisa"] as const;
const pitfallKeys = ["sameAsGermany", "noRegistry", "onlySector"] as const;

export default async function Nis2StatusTschechienPage({
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
          slug="nis2-status-tschechien"
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
            NIS 2 Status Tschechien
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("nis2StatusTschechien.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("nis2StatusTschechien.subtitle")}
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
            {t("nis2StatusTschechien.overview.heading")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusTschechien.overview.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusTschechien.overview.p2")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusTschechien.overview.p3")}</p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.legalAnchor.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusTschechien.legalAnchor.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anchorKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(`nis2StatusTschechien.legalAnchor.${key}.label`)}</p>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">{t(`nis2StatusTschechien.legalAnchor.${key}.quote`)}</blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusTschechien.legalAnchor.${key}.context`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.elements.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusTschechien.elements.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {elementKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <Badge variant="outline" className="mb-2 text-[10px]">{t(`nis2StatusTschechien.elements.items.${key}.section`)}</Badge>
                  <p className="text-sm font-semibold">{t(`nis2StatusTschechien.elements.items.${key}.title`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusTschechien.elements.items.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.principles.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusTschechien.principles.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {principleKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">{t(`nis2StatusTschechien.principles.items.${key}.title`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusTschechien.principles.items.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.nationalView.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusTschechien.nationalView.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nationalKeys.map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="outline" className="text-[10px]">{t(`nis2StatusTschechien.nationalView.items.${key}.country`)}</Badge>
                    <p className="text-sm font-semibold">{t(`nis2StatusTschechien.nationalView.items.${key}.label`)}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusTschechien.nationalView.items.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.pitfalls.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusTschechien.pitfalls.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pitfallKeys.map((key) => (
                <li key={key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">{t(`nis2StatusTschechien.pitfalls.items.${key}.myth`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`nis2StatusTschechien.pitfalls.items.${key}.reality`)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.practitioner.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusTschechien.practitioner.p1")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusTschechien.practitioner.p2")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.platform.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusTschechien.platform.p1")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("nis2StatusTschechien.platform.p2")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nis2StatusTschechien.sources.heading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(t.raw("nis2StatusTschechien.sources.items") as string[]).map((source, i) => (
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
            <CardTitle>{t("nis2StatusTschechien.ctaCard.heading")}</CardTitle>
            <CardDescription>{t("nis2StatusTschechien.ctaCard.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/applicability?country=CZ` as never}>{t("nis2StatusTschechien.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
