import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { itemShot } from "@/components/durchgang/itemShots";
import { JsonLd } from "@/components/JsonLd";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkHow } from "@/components/wiki/WalkHow";
import { WalkPriceCard } from "@/components/wiki/WalkPriceCard";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiAnswerHeader } from "@/components/wiki/WikiAnswerHeader";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import {
  faqJsonLd,
  LAW_CHIP,
  WikiExample,
  WikiFaq,
  type WikiQuestion,
  WikiSection,
  WikiSources,
} from "@/components/wiki/WikiSection";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("cir.meta.title");
  const description = t("cir.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/grundlagen/cir-2024-2690", locale),
    ...pageOg({
      slug: "wiki/grundlagen/cir-2024-2690",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

/** The walk's security policy step, which names the yearly review the regulation sets. */
const POLICY_STEP = "2.4";

interface AnnexSection {
  readonly title: string;
  readonly text: string;
  readonly law: string;
}

export default async function CirPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, w] = await Promise.all([
    getTranslations("info.cir"),
    getTranslations("info.wikiWalk"),
  ]);
  const faq = t.raw("faq.items") as WikiQuestion[];
  const scope = t.raw("scope.items") as string[];
  const annex = t.raw("annex.items") as AnnexSection[];
  const shot = itemShot(POLICY_STEP, rawLocale, t("walk.seeItAlt"));
  if (!shot) throw new Error(`The walk has no screenshot for step ${POLICY_STEP}`);

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-12">
        <WikiPageJsonLd
          category="grundlagen"
          slug="cir-2024-2690"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Intermediate"
          audienceType="Geschäftsführung und IT-Verantwortliche bei digitalen Anbietern"
          citationKeys={["nis2", "cir-2024-2690"]}
          aboutKeys={["cir-2024-2690"]}
          mentionsKeys={["nis2"]}
        />
        <JsonLd data={faqJsonLd(faq)} />

        <WikiAnswerHeader
          badge={t("badge")}
          title={t("title")}
          answer={t("subtitle")}
          art="/images/durchgang/5_2.svg"
        />

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "nl" ? "de" : (locale as "de" | "en")}
          lastReviewedAt="2026-10-05"
          sourceLocale="de"
        />

        <Separator />

        <WikiSection
          heading={t("scope.heading")}
          paragraphs={[t("scope.lead")]}
          law={t("scope.law")}
        >
          <ul className="grid max-w-3xl gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {scope.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          {(t.raw("scope.paragraphs") as string[]).map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </WikiSection>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("annex.heading")}</h2>
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
              {t("annex.lead")}
            </p>
          </div>
          <div className="divide-y rounded-xl border">
            {annex.map((section) => (
              <div
                key={section.law}
                className="grid gap-1.5 p-4 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4"
              >
                <p>
                  <span className={LAW_CHIP}>{section.law}</span>
                </p>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                    {section.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            {t("annex.proportionate")}
          </p>
        </section>

        <WikiSection
          heading={t("incidents.heading")}
          paragraphs={t.raw("incidents.paragraphs") as string[]}
          law={t("incidents.law")}
        />

        <WikiSection
          heading={t("germany.heading")}
          paragraphs={t.raw("germany.paragraphs") as string[]}
          law={t("germany.law")}
        />

        <WikiSection
          heading={t("size.heading")}
          paragraphs={t.raw("size.paragraphs") as string[]}
        />

        <WikiExample
          heading={t("example.heading")}
          lead={t("example.lead")}
          items={t.raw("example.items") as string[]}
        />

        <WalkHow
          heading={t("walk.heading")}
          lead={t("walk.lead")}
          points={t.raw("walk.points") as string[]}
          shot={shot}
          seeIt={w("seeIt")}
          next={t("walk.next")}
        />

        <WikiFaq heading={t("faq.heading")} items={faq} />

        <WikiSources
          heading={t("sources.heading")}
          items={t.raw("sources.items") as string[]}
        />

        <WalkSteps codes={["2.4", "11.1", "5.1"]} />

        <WalkPriceCard />
      </div>
    </GlossedProse>
  );
}
