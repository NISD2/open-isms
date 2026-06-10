import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("whatIsNis2.meta.title");
  const description = t("whatIsNis2.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/what-is-nis2", locale),
    ...pageOg({
      slug: "wiki/grundlagen/what-is-nis2",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const timelineKeys = ["published", "inForce", "transposition", "registries", "review"] as const;
const comparisonKeys = ["scope", "sectors", "classification", "penalties", "management", "reporting", "supplyChain", "supervision"] as const;
const annexIKeys = ["energy", "transport", "banking", "financial", "health", "water", "wastewater", "digital", "ict", "publicAdmin", "space"] as const;
const annexIIKeys = ["postal", "waste", "chemicals", "food", "manufacturing", "digitalProviders", "research"] as const;
const sizeKeys = ["large", "medium", "small"] as const;
const obligationKeys = ["risk", "reporting", "management", "supplyChain", "registration", "audit"] as const;

export default async function WhatIsNis2Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="what-is-nis2"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Beginner"
        audienceType="Geschäftsführung ohne Vorkenntnisse"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["nis2"]}
      />
      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">EU 2022/2555</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("whatIsNis2.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("whatIsNis2.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("whatIsNis2.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("whatIsNis2.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("whatIsNis2.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("whatIsNis2.overview.p3")}</p>
      </section>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("whatIsNis2.timeline.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">{t("features.badges.date")}</TableHead>
                <TableHead>{t("features.badges.event")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timelineKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{t(`whatIsNis2.timeline.items.${key}.date`)}</TableCell>
                  <TableCell className="whitespace-normal">{t(`whatIsNis2.timeline.items.${key}.event`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3">
            <Link href={"/wiki/zeit-und-status/nis2-timeline" as never} className="text-sm text-primary hover:underline">
              {t("whatIsNis2.timeline.seeFullTimeline")} &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* NIS1 vs NIS2 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("whatIsNis2.nis1VsNis2.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">{t("whatIsNis2.nis1VsNis2.headers.aspect")}</TableHead>
                <TableHead>{t("whatIsNis2.nis1VsNis2.headers.nis1")}</TableHead>
                <TableHead>{t("whatIsNis2.nis1VsNis2.headers.nis2")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{t(`whatIsNis2.nis1VsNis2.rows.${key}.aspect`)}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{t(`whatIsNis2.nis1VsNis2.rows.${key}.nis1`)}</TableCell>
                  <TableCell className="whitespace-normal">{t(`whatIsNis2.nis1VsNis2.rows.${key}.nis2`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sectors */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">{t("whatIsNis2.sectors.heading")}</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("whatIsNis2.sectors.annexI.heading")}</CardTitle>
            <CardDescription>{t("whatIsNis2.sectors.annexI.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 text-sm sm:grid-cols-2">
              {annexIKeys.map((key, i) => (
                <li key={key} className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t(`whatIsNis2.sectors.annexI.items.${key}`)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("whatIsNis2.sectors.annexII.heading")}</CardTitle>
            <CardDescription>{t("whatIsNis2.sectors.annexII.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 text-sm sm:grid-cols-2">
              {annexIIKeys.map((key, i) => (
                <li key={key} className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t(`whatIsNis2.sectors.annexII.items.${key}`)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Size Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>{t("whatIsNis2.sizeThresholds.heading")}</CardTitle>
          <CardDescription>{t("whatIsNis2.sizeThresholds.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("whatIsNis2.sizeThresholds.headers.size")}</TableHead>
                <TableHead>{t("whatIsNis2.sizeThresholds.headers.employees")}</TableHead>
                <TableHead>{t("whatIsNis2.sizeThresholds.headers.financial")}</TableHead>
                <TableHead>{t("whatIsNis2.sizeThresholds.headers.scope")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizeKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{t(`whatIsNis2.sizeThresholds.rows.${key}.size`)}</TableCell>
                  <TableCell>{t(`whatIsNis2.sizeThresholds.rows.${key}.employees`)}</TableCell>
                  <TableCell className="whitespace-normal">{t(`whatIsNis2.sizeThresholds.rows.${key}.financial`)}</TableCell>
                  <TableCell>
                    <Badge variant={key === "small" ? "outline" : "default"}>
                      {t(`whatIsNis2.sizeThresholds.rows.${key}.scope`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">{t("whatIsNis2.sizeThresholds.note")}</p>
        </CardContent>
      </Card>

      {/* Obligations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("whatIsNis2.obligations.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {obligationKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {t(`whatIsNis2.obligations.items.${key}`)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
