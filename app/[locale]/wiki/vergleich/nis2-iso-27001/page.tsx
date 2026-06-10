import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { Check, X, Minus } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("isoMapping.meta.title");
  const description = t("isoMapping.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/vergleich/nis2-iso-27001", locale),
    ...pageOg({
      slug: "wiki/vergleich/nis2-iso-27001",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const overlapKeys = ["risk", "access", "incident", "continuity", "crypto", "supplier", "awareness"] as const;
const gapKeys = ["registration", "reporting", "management", "penalties", "supply", "governance"] as const;
const mappingKeys = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"] as const;

export default async function IsoMappingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="vergleich"
        slug="nis2-iso-27001"
        locale={locale}
        authorSlug="cory-hisey"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und IT-Verantwortliche"
        citationKeys={["nis2", "bsig", "enisa-tig"]}
        aboutKeys={["nis2"]}
      />
      <header>
        <Badge variant="secondary" className="mb-3">ISO 27001</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("isoMapping.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("isoMapping.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="cory-hisey" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("isoMapping.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("isoMapping.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("isoMapping.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("isoMapping.overview.p3")}</p>
      </section>

      {/* What Overlaps */}
      <Card>
        <CardHeader>
          <CardTitle>{t("isoMapping.overlap.heading")}</CardTitle>
          <CardDescription>{t("isoMapping.overlap.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overlapKeys.map((key) => (
              <div key={key} className="flex items-start gap-2 rounded-lg border p-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{t(`isoMapping.overlap.items.${key}.title`)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(`isoMapping.overlap.items.${key}.detail`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* The Gaps */}
      <Card>
        <CardHeader>
          <CardTitle>{t("isoMapping.gaps.heading")}</CardTitle>
          <CardDescription>{t("isoMapping.gaps.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gapKeys.map((key) => (
              <div key={key} className="flex items-start gap-2 rounded-lg border border-destructive/20 p-3">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium">{t(`isoMapping.gaps.items.${key}.title`)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(`isoMapping.gaps.items.${key}.detail`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("isoMapping.mapping.heading")}</CardTitle>
          <CardDescription>{t("isoMapping.mapping.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("isoMapping.mapping.headers.nis2")}</TableHead>
                <TableHead>{t("isoMapping.mapping.headers.iso")}</TableHead>
                <TableHead>{t("isoMapping.mapping.headers.coverage")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappingKeys.map((key) => {
                const coverage = t("isoMapping.mapping.rows." + key + ".coverage");
                return (
                  <TableRow key={key}>
                    <TableCell className="whitespace-normal text-sm">{t(`isoMapping.mapping.rows.${key}.nis2`)}</TableCell>
                    <TableCell className="whitespace-normal text-sm">{t(`isoMapping.mapping.rows.${key}.iso`)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {coverage === "full" && <Check className="h-4 w-4 text-primary" />}
                        {coverage === "partial" && <Minus className="h-4 w-4 text-yellow-500" />}
                        {coverage === "none" && <X className="h-4 w-4 text-destructive" />}
                        <span className="text-xs text-muted-foreground">
                          {t(`isoMapping.mapping.rows.${key}.coverageLabel`)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("isoMapping.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("isoMapping.sources.items") as string[]).map((source, i) => (
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
          <CardTitle>{t("isoMapping.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("isoMapping.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("isoMapping.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
