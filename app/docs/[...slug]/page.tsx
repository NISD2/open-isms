import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { DOCS_ENTRIES, findEntry, neighbours } from "@/lib/docs/toc";
import { renderDoc } from "@/lib/docs/content";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { CopyableCodeBlocks } from "@/components/docs/CopyableCodeBlocks";

/**
 * Every page is prerendered from lib/docs/toc.ts and nothing else resolves:
 * an unknown slug is a 404 rather than an attempt to read an arbitrary path
 * off the filesystem.
 */
export const dynamicParams = false;

const ARTICLE_ID = "docs-article";
const GITHUB_EDIT_BASE = "https://github.com/NISD2/open-isms/edit/main/content/docs";

export function generateStaticParams() {
  return DOCS_ENTRIES.map((entry) => ({ slug: [entry.section.slug, entry.page.slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = findEntry(slug.join("/"));
  if (!entry) return {};

  return {
    title: entry.page.title,
    description: entry.page.description,
    alternates: { canonical: entry.href },
    openGraph: {
      title: `${entry.page.title} — open-isms docs`,
      description: entry.page.description,
      url: entry.href,
    },
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  const entry = findEntry(path);
  if (!entry) notFound();

  const { html, headings } = await renderDoc(path);
  const { previous, next } = neighbours(path);

  return (
    <div className="flex gap-10 py-10">
      <article className="min-w-0 max-w-2xl flex-1">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span>{entry.section.title}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{entry.page.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {entry.page.description}
        </p>

        <div
          id={ARTICLE_ID}
          className="docs-prose mt-10"
          // The HTML is produced at build time from a markdown file in this
          // repository by the pipeline in lib/docs/content.ts. There is no
          // user input anywhere in that path.
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <CopyableCodeBlocks containerId={ARTICLE_ID} />

        <div className="mt-14 border-t border-border/60 pt-6">
          <a
            href={`${GITHUB_EDIT_BASE}/${path}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Edit this page on GitHub
          </a>
        </div>

        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          {previous ? (
            <Link
              href={previous.href}
              className="group flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Previous
              </span>
              <span className="text-sm font-medium group-hover:text-primary">
                {previous.page.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.href}
              className="group flex flex-col items-end gap-1 rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/40 hover:bg-muted/40 sm:col-start-2"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Next
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium group-hover:text-primary">
                {next.page.title}
              </span>
            </Link>
          ) : null}
        </nav>
      </article>

      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-2 xl:block">
        <TableOfContents headings={headings} />
      </aside>
    </div>
  );
}
