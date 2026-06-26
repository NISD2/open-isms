import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";

const NS = "whatIsNisd2";
const SLUG = "was-ist-nisd2";
const sectionKeys = ["problem", "contents", "funding", "notUs"] as const;
const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t(`${NS}.meta.title`);
  const description = t(`${NS}.meta.description`);
  return {
    title,
    description,
    alternates: pageAlternates(`wiki/open-source/${SLUG}`, locale),
    ...pageOg({ slug: `wiki/open-source/${SLUG}`, locale, title, description, type: "article" }),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const faqs = faqKeys.map((key) => ({
    "@type": "Question" as const,
    name: t(`${NS}.faq.${key}.q`),
    acceptedAnswer: { "@type": "Answer" as const, text: t(`${NS}.faq.${key}.a`) },
  }));

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="open-source"
          slug={SLUG}
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType="Geschäftsführung, CISO, Compliance-Verantwortliche"
          citationKeys={["nis2", "bsig"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs }} />

        <header>
          <Badge variant="secondary" className="mb-3">nisd2.eu</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{t(`${NS}.title`)}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t(`${NS}.subtitle`)}</p>
        </header>

        <WikiPageMeta authorSlug="simon-orzel" locale={locale} />

        <Separator />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t(`${NS}.overview.heading`)}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t(`${NS}.overview.p1`)}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t(`${NS}.overview.p2`)}</p>
        </section>

        {sectionKeys.map((key) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{t(`${NS}.sections.${key}.heading`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`${NS}.sections.${key}.p1`)}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`${NS}.sections.${key}.p2`)}</p>
            </CardContent>
          </Card>
        ))}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{t(`${NS}.faq.heading`)}</h2>
          <div className="space-y-3">
            {faqKeys.map((key) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold">{t(`${NS}.faq.${key}.q`)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`${NS}.faq.${key}.a`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t(`${NS}.ctaCard.heading`)}</CardTitle>
            <CardDescription>{t(`${NS}.ctaCard.description`)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={{ pathname: "/auth/signin", query: { callbackUrl: "/gap-assessment" } }}>
                {t(`${NS}.cta`)}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
