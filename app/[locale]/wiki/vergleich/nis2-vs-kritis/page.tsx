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
import { JsonLd } from "@/components/JsonLd";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("kritisComparison.meta.title");
  const description = t("kritisComparison.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/vergleich/nis2-vs-kritis", locale),
    ...pageOg({
      slug: "wiki/vergleich/nis2-vs-kritis",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const comparisonKeys = ["scope", "threshold", "registration", "reporting", "penalties", "liability", "audit", "supply"] as const;
const newSectorKeys = ["waste", "food", "manufacturing", "postal", "chemicals", "research", "digital"] as const;
const faqKeys = ["q1", "q2", "q3", "q4"] as const;

export default async function KritisComparisonPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`kritisComparison.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`kritisComparison.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="vergleich"
        slug="nis2-vs-kritis"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und IT-Verantwortliche"
        citationKeys={["nis2", "bsig", "bsi-kritisv"]}
        aboutKeys={["bsig"]}
        mentionsKeys={["nis2"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs,
        }}
      />

      <header>
        <Badge variant="secondary" className="mb-3">BSIG 2025</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("kritisComparison.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("kritisComparison.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("kritisComparison.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("kritisComparison.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("kritisComparison.overview.p2")}</p>
      </section>

      {/* Side-by-side comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("kritisComparison.table.heading")}</CardTitle>
          <CardDescription>{t("kritisComparison.table.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("kritisComparison.table.headers.aspect")}</TableHead>
                <TableHead>{t("kritisComparison.table.headers.kritis")}</TableHead>
                <TableHead>{t("kritisComparison.table.headers.nis2")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="whitespace-normal font-medium">{t(`kritisComparison.table.rows.${key}.aspect`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`kritisComparison.table.rows.${key}.kritis`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`kritisComparison.table.rows.${key}.nis2`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Newly in scope sectors */}
      <Card>
        <CardHeader>
          <CardTitle>{t("kritisComparison.newSectors.heading")}</CardTitle>
          <CardDescription>{t("kritisComparison.newSectors.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newSectorKeys.map((key) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{t(`kritisComparison.newSectors.items.${key}.title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`kritisComparison.newSectors.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What stays the same */}
      <Card>
        <CardHeader>
          <CardTitle>{t("kritisComparison.unchanged.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("kritisComparison.unchanged.items") as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("kritisComparison.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`kritisComparison.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(`kritisComparison.faq.${key}.a`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("kritisComparison.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("kritisComparison.sources.items") as string[]).map((source, i) => (
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
          <CardTitle>{t("kritisComparison.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("kritisComparison.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("kritisComparison.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
