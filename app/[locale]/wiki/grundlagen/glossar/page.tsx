import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("glossary.meta.title");
  const description = t("glossary.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/glossar", locale),
    ...pageOg({
      slug: "wiki/grundlagen/glossar",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const termKeys = [
  "wesentlicheEinrichtung",
  "wichtigeEinrichtung",
  "kritis",
  "bsig",
  "nis2umsucg",
  "nis2Directive",
  "cir2024",
  "naceCode",
  "bsiRegistration",
  "muk",
  "significantIncident",
  "riskManagement",
  "supplyChainSecurity",
  "managementLiability",
  "itGrundschutz",
  "auditTrail",
  "mfa",
  "section30",
  "section32",
  "section33",
  "section38",
  "annex1",
  "annex2",
  "csirt",
] as const;


export default async function GlossaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const definitions = termKeys.map((key) => ({
    "@type": "DefinedTerm" as const,
    name: t(`glossary.terms.${key}.term`),
    description: t(`glossary.terms.${key}.definition`),
  }));

  const sources = t.raw("glossary.sources.items") as string[];

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="glossar"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Beginner"
        audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
        mentionsKeys={["nis2", "bsig", "cir-2024-2690", "gdpr", "cra", "dora"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          name: t("glossary.title"),
          hasDefinedTerm: definitions,
        }}
      />

      <header>
        <Badge variant="secondary" className="mb-3">NIS2 / BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("glossary.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("glossary.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{t("glossary.intro")}</p>
      </section>

      <div className="space-y-4">
        {termKeys.map((key) => (
          <Card key={key} id={key}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-sm font-semibold">{t(`glossary.terms.${key}.term`)}</p>
                  {/* t.has is load-bearing here, and for a reason worth
                      stating: i18n/request.ts fillMissing() merges English
                      into every non-en locale key by key, so t.has() can
                      never report "this LOCALE lacks the key" -- only "no
                      locale has it". That is exactly the question being asked.
                      `german` and `legalRef` are properties of the TERM, not
                      of the locale (17 of 24 entries have a German term, 23
                      have a statute reference, identically in all ten files),
                      so English's coverage is the right answer for every
                      locale. Do not copy this pattern to gate on translation
                      status: there it is always true and silently renders
                      English. */}
                  {t.has(`glossary.terms.${key}.german`) && (
                    <p className="text-xs text-muted-foreground/60 italic">{t(`glossary.terms.${key}.german`)}</p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`glossary.terms.${key}.definition`)}
                  </p>
                  {t.has(`glossary.terms.${key}.legalRef`) && (
                    <p className="mt-1 text-xs text-primary">{t(`glossary.terms.${key}.legalRef`)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("glossary.sources.heading")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {sources.map((source, i) => (
            <li key={i}>{source}</li>
          ))}
        </ul>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("glossary.ctaCard.heading")}</CardTitle>
          <CardDescription>{t("glossary.ctaCard.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/applicability">{t("glossary.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
