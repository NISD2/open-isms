import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { type ShotName, shotImage } from "@/components/landing/shots";
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
  WikiFaq,
  type WikiQuestion,
  WikiSection,
  WikiSources,
} from "@/components/wiki/WikiSection";
import type { LegislationKey } from "@/lib/content/citations";
import { wikiLocale } from "@/lib/content/wiki-locale";
import { WIKI_TOC, type WikiTopLevel } from "@/lib/content/wiki-toc";
import { pageAlternates, pageOg } from "@/lib/seo";

const CATEGORY: WikiTopLevel = "ki-assistenten";

/** One topic of the page; `code` is a command the reader copies as it stands. */
interface ArticleSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly law?: string;
  readonly code?: string;
}

/**
 * A page of the AI assistants category. Every page there answers one question about connecting an
 * assistant to the NIS 2 walkthrough through MCP, so they share one shape and differ in their words,
 * the walkthrough screen they show and the walkthrough steps they end on.
 */
interface AssistantPage {
  readonly slug: string;
  /** The page's messages, under `aiAssistants` (messages/aiAssistants, German and English). */
  readonly messages: string;
  /** The walkthrough step whose picture heads the page, as its file name under `/images/durchgang`. */
  readonly art: string;
  /** The app screen beside the "in the walkthrough" points. */
  readonly shot: ShotName;
  /** The walkthrough steps the page's subject turns into. */
  readonly steps: readonly string[];
  readonly level: "Beginner" | "Intermediate" | "Expert";
  readonly audienceType: string;
  readonly citations: readonly LegislationKey[];
}

type Params = { params: Promise<{ locale: string }> };

export function assistantPage(page: AssistantPage) {
  const path = `wiki/${CATEGORY}/${page.slug}`;
  const namespace = `aiAssistants.${page.messages}`;
  const reviewed = WIKI_TOC[CATEGORY].entries.find(
    (entry) => entry.slug === page.slug,
  )?.lastReviewedAt;

  const metadata = async ({ params }: Params): Promise<Metadata> => {
    const { locale } = await params;
    const t = await getTranslations(namespace);
    const title = t("meta.title");
    const description = t("meta.description");
    return {
      title,
      description,
      alternates: pageAlternates(path, locale),
      ...pageOg({ slug: path, locale, title, description, type: "article" }),
    };
  };

  async function Page({ params }: Params) {
    const { locale: rawLocale } = await params;
    const locale = wikiLocale(rawLocale);
    const [t, w] = await Promise.all([
      getTranslations(namespace),
      getTranslations("info.wikiWalk"),
    ]);
    const sections = t.raw("sections") as ArticleSection[];
    const faq = t.raw("faq.items") as WikiQuestion[];

    return (
      <GlossedProse locale={locale}>
        <div className="space-y-12">
          <WikiPageJsonLd
            category={CATEGORY}
            slug={page.slug}
            locale={locale}
            authorSlug="simon-orzel"
            proficiencyLevel={page.level}
            audienceType={page.audienceType}
            citationKeys={[...page.citations]}
            aboutKeys={["nis2"]}
          />
          <JsonLd data={faqJsonLd(faq)} />

          <WikiAnswerHeader
            badge={t("badge")}
            title={t("title")}
            answer={t("subtitle")}
            art={`/images/durchgang/${page.art}.svg`}
          />

          <WikiPageMeta
            authorSlug="simon-orzel"
            locale={locale === "nl" ? "de" : locale}
            lastReviewedAt={reviewed}
            sourceLocale="de"
          />

          <Separator />

          {sections.map((section) => (
            <WikiSection
              key={section.heading}
              heading={section.heading}
              paragraphs={section.paragraphs}
              law={section.law}
            >
              {section.code && (
                // Wrapped rather than scrolled, so the whole command shows; no ligatures, so
                // "--transport" reads as the two hyphens it is typed with.
                <pre className="max-w-[62ch] whitespace-pre-wrap rounded-lg border bg-muted px-4 py-3 text-xs leading-relaxed [font-variant-ligatures:none] [overflow-wrap:anywhere]">
                  <code>{section.code}</code>
                </pre>
              )}
            </WikiSection>
          ))}

          <WalkHow
            heading={t("walk.heading")}
            lead={t("walk.lead")}
            points={t.raw("walk.points") as string[]}
            shot={shotImage(page.shot, rawLocale, t("walk.seeItAlt"))}
            seeIt={w("seeIt")}
            next={t("walk.next")}
          />

          <WikiFaq heading={t("faq.heading")} items={faq} />

          <WikiSources
            heading={t("sources.heading")}
            items={t.raw("sources.items") as string[]}
          />

          <WalkSteps codes={page.steps} />

          <WalkPriceCard />
        </div>
      </GlossedProse>
    );
  }

  return { metadata, Page };
}
