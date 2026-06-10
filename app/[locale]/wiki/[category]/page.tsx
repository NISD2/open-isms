import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { pageAlternates } from "@/lib/seo";
import { WIKI_TOC, WIKI_TOP_LEVEL, publishedEntries, type WikiTopLevel } from "@/lib/content/wiki-toc";

function isTopLevel(value: string): value is WikiTopLevel {
  return (WIKI_TOP_LEVEL as readonly string[]).includes(value);
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
  const meta = WIKI_TOC[category];
  const isEn = locale === "en";
  const title = isEn ? meta.titleEn : meta.titleDe;
  const question = isEn ? meta.questionEn : meta.questionDe;
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
  const meta = WIKI_TOC[category];
  const isEn = locale === "en";

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
            <BreadcrumbPage>{isEn ? meta.titleEn : meta.titleDe}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <Badge variant="secondary" className="mb-3">
          {isEn ? meta.titleEn : meta.titleDe}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEn ? meta.titleEn : meta.titleDe}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {isEn ? meta.questionEn : meta.questionDe}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {publishedEntries(category).map((entry) => (
          <Link
            key={entry.slug}
            href={`/wiki/${category}/${entry.slug}` as never}
            className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-foreground/30 group-hover:shadow-md group-hover:bg-accent/30">
              <CardHeader>
                <CardTitle className="text-base group-hover:text-foreground">
                  {isEn ? (entry.titleEn ?? entry.titleDe) : entry.titleDe}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isEn ? (entry.summaryEn ?? entry.summaryDe) : entry.summaryDe}
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
