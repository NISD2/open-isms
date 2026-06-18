import type { Metadata } from "next";
import type { ComponentProps, ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
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
  const title = t("faq.meta.title");
  const description = t("faq.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/faq", locale),
    ...pageOg({
      slug: "wiki/grundlagen/faq",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

const categoryKeys = ["basics", "scope", "duties", "frameworks", "supplychain", "registration", "incidents", "penalties", "liability", "implementation", "sectors"] as const;

const questionsByCategory = {
  basics: ["q1", "q2", "q3", "q4", "q5"],
  scope: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19", "q20", "q21", "q22", "q23", "q24", "q25", "q26"],
  duties: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"],
  frameworks: ["q1", "q2", "q3", "q4", "q5"],
  supplychain: ["q1", "q2"],
  registration: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"],
  incidents: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"],
  penalties: ["q1"],
  liability: ["q1", "q2", "q3", "q4", "q5"],
  implementation: ["q1", "q2", "q3", "q4"],
  sectors: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19", "q20", "q21", "q22", "q23", "q24", "q25"],
} as const;

// Answers may contain inline markdown links to sibling wiki pages. Render internal
// links via the localized next-intl Link (so EN/NL routes resolve correctly) and keep
// the JSON-LD answer text as plain prose.
function stripLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

function renderAnswer(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2];
    if (/^https?:\/\//.test(href)) {
      nodes.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
          {label}
        </a>,
      );
    } else {
      nodes.push(
        <Link key={key} href={href as ComponentProps<typeof Link>["href"]} className="font-medium underline underline-offset-2">
          {label}
        </Link>,
      );
    }
    last = m.index + m[0].length;
    key += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");

  const allFaqs = categoryKeys.flatMap((cat) =>
    questionsByCategory[cat].map((qKey) => ({
      "@type": "Question" as const,
      name: t(`faq.${cat}.${qKey}.q`),
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: stripLinks(t(`faq.${cat}.${qKey}.a`)),
      },
    }))
  );

  return (
    <GlossedProse locale={locale}>
    <div className="space-y-10">
      <WikiPageJsonLd
        category="grundlagen"
        slug="faq"
        locale={locale}
        authorSlug="simon-orzel"
        proficiencyLevel="Beginner"
        audienceType="Geschäftsführung und IT-Verantwortliche im Mittelstand"
        citationKeys={["nis2", "bsig"]}
        aboutKeys={["nis2"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: allFaqs,
        }}
      />

      <header>
        <Badge variant="secondary" className="mb-3">NIS2 / BSIG</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t("faq.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("faq.subtitle")}</p>
      </header>

      <WikiPageMeta authorSlug="simon-orzel" locale={locale === "nl" ? "de" : (locale as "de" | "en")} />

      <Separator />

      {/* Table of contents */}
      <nav>
        <ul className="flex flex-wrap gap-2">
          {categoryKeys.map((cat) => (
            <li key={cat}>
              <a
                href={`#${cat}`}
                className="inline-block rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t(`faq.categories.${cat}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {categoryKeys.map((cat) => (
        <section key={cat} id={cat} className="space-y-4 scroll-mt-24">
          <h2 className="text-xl font-semibold tracking-tight">{t(`faq.categories.${cat}`)}</h2>
          <div className="space-y-3">
            {questionsByCategory[cat].map((qKey) => (
              <Card key={qKey}>
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold">{t(`faq.${cat}.${qKey}.q`)}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {renderAnswer(t(`faq.${cat}.${qKey}.a`))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-lg font-semibold">{t("faq.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("faq.meta.description")}
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">{t("faq.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </GlossedProse>
  );
}
