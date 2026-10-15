import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { type WikiLocale, wikiLocale, wikiTocText } from "@/lib/content/wiki-locale";
import {
  publishedEntries,
  WIKI_TOC,
  WIKI_TOP_LEVEL,
  type WikiTocEntry,
  type WikiTopLevel,
} from "@/lib/content/wiki-toc";
import { pageAlternates } from "@/lib/seo";

function isTopLevel(value: string): value is WikiTopLevel {
  return (WIKI_TOP_LEVEL as readonly string[]).includes(value);
}

/** A category's title and question in the wiki's language. */
function categoryText(category: WikiTopLevel, locale: WikiLocale) {
  const meta = WIKI_TOC[category];
  const key = `cat:${category}`;
  return {
    title: wikiTocText(locale, key, "title", { de: meta.titleDe, en: meta.titleEn }),
    question: wikiTocText(locale, key, "question", {
      de: meta.questionDe,
      en: meta.questionEn,
    }),
  };
}

/** An entry's card text in the wiki's language. */
function entryText(entry: WikiTocEntry, locale: WikiLocale) {
  const key = `entry:${entry.slug}`;
  return {
    title: wikiTocText(locale, key, "title", {
      de: entry.titleDe,
      en: entry.titleEn ?? entry.titleDe,
    }),
    summary: wikiTocText(locale, key, "summary", {
      de: entry.summaryDe,
      en: entry.summaryEn ?? entry.summaryDe,
    }),
  };
}

// No generateStaticParams: with localePrefix: "as-needed" the parent
// [locale] segment is dynamic at request time (cookie/Accept-Language
// resolves locale), so attempting to SSG only [category] without also
// listing [locale] makes Next.js 16 standalone bail with
// DYNAMIC_SERVER_USAGE on every request. The TOC is in-memory, render
// cost is trivial — keep this fully dynamic.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isTopLevel(category)) return {};
  const { title, question } = categoryText(category, wikiLocale(locale));
  return {
    title: `${title} — NIS 2`,
    description: question,
    alternates: pageAlternates(`wiki/${category}`, locale),
  };
}

export default async function WikiCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  if (!isTopLevel(category)) notFound();
  const wiki = wikiLocale(locale);
  const { title, question } = categoryText(category, wiki);

  return (
    <div className="space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={"/wiki" as never}>{"Wiki"}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <Badge variant="secondary" className="mb-3">
          {title}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{question}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {publishedEntries(category).map((entry) => {
          const text = entryText(entry, wiki);
          return (
            <Link
              key={entry.slug}
              href={`/wiki/${category}/${entry.slug}` as never}
              className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-foreground/30 group-hover:shadow-md group-hover:bg-accent/30">
                <CardHeader>
                  <CardTitle className="text-base group-hover:text-foreground">
                    {text.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{text.summary}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
