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
  const title = t("penalties.meta.title");
  const description = t("penalties.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/recht-und-folgen/nis2-bussgelder", locale),
    ...pageOg({
      slug: "wiki/recht-und-folgen/nis2-bussgelder",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const tierKeys = ["essential", "important", "registration", "reporting"] as const;
const exampleKeys = ["small", "medium", "large"] as const;
const scenarioKeys = ["lateRegistration", "noIncidentReport", "noRiskManagement", "supplyChainGap"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export default async function PenaltiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`penalties.faq.${key}.q`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`penalties.faq.${key}.a`),
    },
  }));

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="recht-und-folgen"
        slug="nis2-bussgelder"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und Vorstand"
        citationKeys={["nis2", "bsig"]}
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
        <Badge variant="secondary" className="mb-3">{"\u00A7"}65 BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("penalties.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("penalties.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("penalties.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("penalties.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("penalties.overview.p2")}</p>
      </section>

      {/* Penalty tiers */}
      <Card>
        <CardHeader>
          <CardTitle>{t("penalties.tiers.heading")}</CardTitle>
          <CardDescription>{t("penalties.tiers.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {tierKeys.map((key) => (
              <div key={key} className="rounded-lg border p-4 text-center">
                <p className="text-xl font-bold text-destructive">{t(`penalties.tiers.items.${key}.amount`)}</p>
                <p className="mt-1 text-sm font-medium">{t(`penalties.tiers.items.${key}.label`)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(`penalties.tiers.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calculation examples */}
      <Card>
        <CardHeader>
          <CardTitle>{t("penalties.examples.heading")}</CardTitle>
          <CardDescription>{t("penalties.examples.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("penalties.examples.headers.company")}</TableHead>
                <TableHead>{t("penalties.examples.headers.turnover")}</TableHead>
                <TableHead>{t("penalties.examples.headers.maxEssential")}</TableHead>
                <TableHead>{t("penalties.examples.headers.maxImportant")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exampleKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{t(`penalties.examples.rows.${key}.company`)}</TableCell>
                  <TableCell>{t(`penalties.examples.rows.${key}.turnover`)}</TableCell>
                  <TableCell className="text-destructive">{t(`penalties.examples.rows.${key}.maxEssential`)}</TableCell>
                  <TableCell className="text-destructive">{t(`penalties.examples.rows.${key}.maxImportant`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Real scenarios */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("penalties.scenarios.heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("penalties.scenarios.description")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {scenarioKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`penalties.scenarios.items.${key}.title`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`penalties.scenarios.items.${key}.description`)}
                </p>
                <p className="mt-2 text-xs font-medium text-destructive">
                  {t(`penalties.scenarios.items.${key}.consequence`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Management liability */}
      <Card>
        <CardHeader>
          <CardTitle>{t("penalties.managementLiability.heading")}</CardTitle>
          <CardDescription>{t("penalties.managementLiability.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("penalties.managementLiability.p1")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("penalties.managementLiability.p2")}</p>
        </CardContent>
      </Card>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("penalties.faq.heading")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">{t(`penalties.faq.${key}.q`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t(`penalties.faq.${key}.a`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>{t("penalties.sources.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(t.raw("penalties.sources.items") as string[]).map((source, i) => (
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
          <CardTitle>{t("penalties.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("penalties.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">{t("penalties.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
