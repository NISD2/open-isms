import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Check, X } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("costs.meta.title");
  const description = t("costs.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/umsetzung/kosten", locale),
    ...pageOg({
      slug: "wiki/umsetzung/kosten",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const approachKeys = ["consultants", "enterprise", "usPlatforms", "diy"] as const;
const costBreakdownKeys = ["assessment", "documentation", "technical", "training", "maintenance", "total"] as const;

export default async function CostsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="umsetzung"
        slug="kosten"
        locale={locale}
        authorSlug="cory-hisey"
        proficiencyLevel="Intermediate"
        audienceType="Geschäftsführung und IT-Budget-Verantwortliche"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["nis2"]}
      />
      {/* Header */}
      <header>
        <Badge variant="secondary" className="mb-3">NIS2</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("costs.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("costs.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="cory-hisey" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("costs.overview.heading")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("costs.overview.p1")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("costs.overview.p2")}</p>
      </section>

      {/* Approaches */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">{t("costs.approaches.heading")}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {approachKeys.map((key) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t(`costs.approaches.${key}.title`)}</CardTitle>
                  <Badge variant="outline">{t(`costs.approaches.${key}.price`)}</Badge>
                </div>
                <CardDescription>{t(`costs.approaches.${key}.description`)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("costs.approaches.prosLabel")}</p>
                  <ul className="space-y-1.5">
                    {(t.raw(`costs.approaches.${key}.pros`) as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("costs.approaches.consLabel")}</p>
                  <ul className="space-y-1.5">
                    {(t.raw(`costs.approaches.${key}.cons`) as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Realistic Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("costs.breakdown.heading")}</CardTitle>
          <CardDescription>{t("costs.breakdown.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("costs.breakdown.headers.item")}</TableHead>
                <TableHead className="text-right">{t("costs.breakdown.headers.oneTime")}</TableHead>
                <TableHead className="text-right">{t("costs.breakdown.headers.annual")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costBreakdownKeys.map((key) => (
                <TableRow key={key} className={key === "total" ? "font-bold" : ""}>
                  <TableCell className="whitespace-normal">{t(`costs.breakdown.rows.${key}.item`)}</TableCell>
                  <TableCell className="text-right">{t(`costs.breakdown.rows.${key}.oneTime`)}</TableCell>
                  <TableCell className="text-right">{t(`costs.breakdown.rows.${key}.annual`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* NISD2.eu Approach */}
      <Card>
        <CardHeader>
          <CardTitle>{t("costs.nisd2Approach.heading")}</CardTitle>
          <CardDescription>{t("costs.nisd2Approach.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {(t.raw("costs.nisd2Approach.items") as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="text-center">
        <CardContent className="space-y-4 py-8">
          <p className="text-lg font-semibold">{t("costs.cta.heading")}</p>
          <p className="text-sm text-muted-foreground">{t("costs.cta.description")}</p>
          <Button asChild size="lg">
            <Link href="/auth/signin">{t("costs.cta.button")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
