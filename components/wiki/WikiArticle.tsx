import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";
import { JsonLd } from "@/components/JsonLd";
import { type ShotName, shotImage } from "@/components/landing/shots";
import { Separator } from "@/components/ui/separator";
import { GdprWaitlist, GdprWaitlistButton } from "@/components/wiki/GdprWaitlist";
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
import { Link } from "@/i18n/navigation";
import type { LegislationKey } from "@/lib/content/citations";
import { wikiLocale, wikiTocText } from "@/lib/content/wiki-locale";
import { isPublished } from "@/lib/content/wiki-publish-schedule";
import { WIKI_TOC, type WikiTopLevel } from "@/lib/content/wiki-toc";
import { pageAlternates, pageOg } from "@/lib/seo";

/** One topic of the page; `code` is a command the reader copies as it stands. */
interface ArticleSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly law?: string;
  readonly code?: string;
}

/** What a category built from these pages shares. */
export interface ArticleCategory {
  readonly topLevel: WikiTopLevel;
  /** The message namespace holding the category's pages and its shared words (`related`). */
  readonly namespace: string;
  /** What every page is about, for the JSON-LD. */
  readonly about: readonly LegislationKey[];
  /** What the page ends on: the walkthrough's price, or the DSGVO Durchgang's waitlist. */
  readonly closing: "price" | "waitlist";
}

/**
 * One page that answers one question. Pages of a category share one shape and differ in their
 * words, their picture, and how they meet the NIS 2 walkthrough: a page whose subject the
 * walkthrough covers shows its screen and ends on its steps; one it does not cover shows neither.
 */
export interface ArticlePage {
  readonly slug: string;
  /** The page's messages, under the category's namespace. */
  readonly messages: string;
  /** The walkthrough step whose picture heads the page, as its file name under `/images/durchgang`. */
  readonly art: string;
  /** The app screen beside the page's `walk` points, where its messages have them. */
  readonly shot?: ShotName;
  /** The walkthrough steps the page's subject turns into. */
  readonly steps?: readonly string[];
  readonly level: "Beginner" | "Intermediate" | "Expert";
  readonly audienceType: string;
  readonly citations: readonly LegislationKey[];
  /** The DSGVO Durchgang's waitlist on a page of a category that ends on the price. */
  readonly waitlist?: boolean;
}

type Params = { params: Promise<{ locale: string }> };

/**
 * The page's related entries from any category, in the TOC's order of `relatedSlugs`, leaving out
 * one still waiting for its publish slot so a link never leads to a 404.
 */
const publishedRelated = (slugs: readonly string[]) =>
  slugs.flatMap((slug) =>
    isPublished(slug)
      ? Object.values(WIKI_TOC).flatMap(({ slug: topLevel, entries }) =>
          entries
            .filter((entry) => entry.slug === slug)
            .map((entry) => ({ topLevel, entry })),
        )
      : [],
  );

export function articlePage(category: ArticleCategory, page: ArticlePage) {
  const toc = WIKI_TOC[category.topLevel];
  const path = `wiki/${category.topLevel}/${page.slug}`;
  const namespace = `${category.namespace}.${page.messages}`;
  const own = toc.entries.find((entry) => entry.slug === page.slug);

  const metadata = async ({ params }: Params): Promise<Metadata> => {
    const { locale } = await params;
    const t = await getTranslations(namespace);
    const title = t("meta.title");
    const description = t("meta.description");
    return {
      title,
      description,
      alternates: pageAlternates(path, locale, toc.textLocales),
      ...pageOg({ slug: path, locale, title, description, type: "article" }),
    };
  };

  async function Page({ params }: Params) {
    const { locale: rawLocale } = await params;
    const locale = wikiLocale(rawLocale);
    const [t, w, shared] = await Promise.all([
      getTranslations(namespace),
      getTranslations("info.wikiWalk"),
      getTranslations(category.namespace),
    ]);
    const sections = t.raw("sections") as ArticleSection[];
    const faq = t.raw("faq.items") as WikiQuestion[];
    const related = publishedRelated(own?.relatedSlugs ?? []);

    return (
      <GlossedProse locale={locale}>
        <div className="space-y-12">
          <WikiPageJsonLd
            category={category.topLevel}
            slug={page.slug}
            locale={locale}
            authorSlug="simon-orzel"
            proficiencyLevel={page.level}
            audienceType={page.audienceType}
            citationKeys={[...page.citations]}
            aboutKeys={[...category.about]}
          />
          <JsonLd data={faqJsonLd(faq)} />

          <WikiAnswerHeader
            badge={t("badge")}
            title={t("title")}
            answer={t("subtitle")}
            art={`/images/durchgang/${page.art}.svg`}
            actions={category.closing === "waitlist" ? <GdprWaitlistButton /> : undefined}
          />

          <WikiPageMeta
            authorSlug="simon-orzel"
            locale={locale === "nl" ? "de" : locale}
            lastReviewedAt={own?.lastReviewedAt}
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

          {page.shot && t.has("walk") && (
            <WalkHow
              heading={t("walk.heading")}
              lead={t("walk.lead")}
              points={t.raw("walk.points") as string[]}
              shot={shotImage(page.shot, rawLocale, t("walk.seeItAlt"))}
              seeIt={w("seeIt")}
              next={t("walk.next")}
            />
          )}

          <WikiFaq heading={t("faq.heading")} items={faq} />

          {related.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {shared("related")}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {related.map(({ topLevel, entry }) => (
                  <li key={entry.slug}>
                    <Link
                      // Wiki pathnames are built at runtime (wikiPathnames), so the typed union cannot list them.
                      href={
                        `/wiki/${topLevel}/${entry.slug}` as ComponentProps<
                          typeof Link
                        >["href"]
                      }
                      className="group flex h-full flex-col gap-1 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                    >
                      <span className="text-sm font-semibold group-hover:underline">
                        {wikiTocText(locale, `entry:${entry.slug}`, "title", {
                          de: entry.titleDe,
                          en: entry.titleEn ?? entry.titleDe,
                        })}
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {wikiTocText(locale, `entry:${entry.slug}`, "summary", {
                          de: entry.summaryDe,
                          en: entry.summaryEn ?? entry.summaryDe,
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <WikiSources
            heading={t("sources.heading")}
            items={t.raw("sources.items") as string[]}
          />

          {page.steps && page.steps.length > 0 && <WalkSteps codes={page.steps} />}

          {(category.closing === "waitlist" || page.waitlist) && <GdprWaitlist />}

          {category.closing === "price" && <WalkPriceCard />}
        </div>
      </GlossedProse>
    );
  }

  return { metadata, Page };
}
