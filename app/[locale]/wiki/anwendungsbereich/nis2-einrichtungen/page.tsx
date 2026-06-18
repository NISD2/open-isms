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
  const title = t("entityTypes.meta.title");
  const description = t("entityTypes.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/anwendungsbereich/nis2-einrichtungen", locale),
    ...pageOg({
      slug: "wiki/anwendungsbereich/nis2-einrichtungen",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const classificationKeys = ["size", "sectors", "sizeIndependent"] as const;
const edgeCaseKeys = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"] as const;
const comparisonKeys = ["measures", "reporting", "registration", "management", "supervision", "fineBase", "fineRevenue", "attackDetection", "complianceProof"] as const;
const kritisExtraKeys = ["attackDetection", "enhancedRegistration", "complianceProof"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function EntityTypesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`entityTypes.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`entityTypes.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="anwendungsbereich"
        slug="nis2-einrichtungen"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Compliance-Verantwortliche"
        citationKeys={["nis2", "bsig", "cir-2024-2690"]}
        aboutKeys={["nis2"]}
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
        <h1 className="text-3xl font-bold tracking-tight">{t("entityTypes.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("entityTypes.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale} />

      <Separator />

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("entityTypes.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.overview.p2")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.overview.p3")}</p>
      </section>

      {/* Classification criteria */}
      <Card>
        <CardHeader>
          <CardTitle>{t("entityTypes.classification.heading")}</CardTitle>
          <CardDescription>{t("entityTypes.classification.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("entityTypes.classification.headers.criterion")}</TableHead>
                <TableHead>{t("entityTypes.classification.headers.important")}</TableHead>
                <TableHead>{t("entityTypes.classification.headers.essential")}</TableHead>
                <TableHead>{t("entityTypes.classification.headers.kritis")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classificationKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="whitespace-normal font-medium">{t(`entityTypes.classification.rows.${key}.criterion`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`entityTypes.classification.rows.${key}.important`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`entityTypes.classification.rows.${key}.essential`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`entityTypes.classification.rows.${key}.kritis`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edge cases — size threshold examples */}
      <Card>
        <CardHeader>
          <CardTitle>{t("entityTypes.edgeCases.heading")}</CardTitle>
          <CardDescription>{t("entityTypes.edgeCases.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.edgeCases.intro")}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("entityTypes.edgeCases.headers.scenario")}</TableHead>
                <TableHead>{t("entityTypes.edgeCases.headers.employees")}</TableHead>
                <TableHead>{t("entityTypes.edgeCases.headers.turnover")}</TableHead>
                <TableHead>{t("entityTypes.edgeCases.headers.balanceSheet")}</TableHead>
                <TableHead>{t("entityTypes.edgeCases.headers.sector")}</TableHead>
                <TableHead>{t("entityTypes.edgeCases.headers.result")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edgeCaseKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="whitespace-normal font-medium text-sm">{t(`entityTypes.edgeCases.rows.${key}.scenario`)}</TableCell>
                  <TableCell className="text-sm">{t(`entityTypes.edgeCases.rows.${key}.employees`)}</TableCell>
                  <TableCell className="text-sm">{t(`entityTypes.edgeCases.rows.${key}.turnover`)}</TableCell>
                  <TableCell className="text-sm">{t(`entityTypes.edgeCases.rows.${key}.balanceSheet`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`entityTypes.edgeCases.rows.${key}.sector`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm font-medium">{t(`entityTypes.edgeCases.rows.${key}.result`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("entityTypes.edgeCases.legalBasis")}</p>
        </CardContent>
      </Card>

      {/* The key insight: same compliance work */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("entityTypes.sameWork.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.sameWork.p1")}</p>
        <ul className="space-y-2">
          {(t.raw("entityTypes.sameWork.items") as string[]).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.sameWork.p2")}</p>
      </section>

      {/* Full comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("entityTypes.comparison.heading")}</CardTitle>
          <CardDescription>{t("entityTypes.comparison.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("entityTypes.comparison.headers.obligation")}</TableHead>
                <TableHead>{t("entityTypes.comparison.headers.important")}</TableHead>
                <TableHead>{t("entityTypes.comparison.headers.essential")}</TableHead>
                <TableHead>{t("entityTypes.comparison.headers.kritis")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="whitespace-normal font-medium">{t(`entityTypes.comparison.rows.${key}.obligation`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`entityTypes.comparison.rows.${key}.important`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`entityTypes.comparison.rows.${key}.essential`)}</TableCell>
                  <TableCell className="whitespace-normal text-sm">{t(`entityTypes.comparison.rows.${key}.kritis`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* KRITIS extras explained */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("entityTypes.kritisExtras.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.kritisExtras.intro")}</p>
        <div className="space-y-3">
          {kritisExtraKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`entityTypes.kritisExtras.items.${key}.title`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(`entityTypes.kritisExtras.items.${key}.detail`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Practical takeaway */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("entityTypes.takeaway.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.takeaway.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("entityTypes.takeaway.p2")}</p>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("entityTypes.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`entityTypes.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(`entityTypes.faq.${key}.a`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("entityTypes.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("entityTypes.sources.items") as string[]).map((source, i) => (
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
          <CardTitle>{t("entityTypes.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("entityTypes.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("entityTypes.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
