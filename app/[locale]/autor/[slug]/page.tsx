import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { AUTHORS, type DocsAuthor } from "@/lib/content/authors";
import { baseUrl, pageAlternates } from "@/lib/seo";

function isAuthorSlug(value: string): value is DocsAuthor["slug"] {
  return value === "simon-orzel" || value === "cory-hisey";
}

/** The title, bio and topics in the page's language: Czech on a Czech page, else as written. */
const profileText = (author: DocsAuthor, locale: string): DocsAuthor["czech"] =>
  locale === "cs" ? author.czech : author;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isAuthorSlug(slug)) return {};
  const author = AUTHORS[slug];
  const shown = profileText(author, locale);
  return {
    title: `${author.name} — ${shown.jobTitle} | nisd2.eu`,
    description: shown.shortBio,
    alternates: pageAlternates(`autor/${slug}`, locale),
    openGraph: {
      title: `${author.name} — ${shown.jobTitle}`,
      description: shown.shortBio,
      url: `${baseUrl}${author.profileUrl}`,
      type: "profile",
      images: [{ url: author.photoUrl, width: 400, height: 400 }],
    },
  };
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isAuthorSlug(slug)) notFound();
  const author = AUTHORS[slug];
  const shown = profileText(author, locale);
  const isEn = locale === "en";

  // Standalone Person JSON-LD that references the Organization @id from
  // the root layout's @graph. Includes the rich knowsAbout entity signal.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/autor/${slug}#person`,
    name: author.name,
    url: `${baseUrl}${author.profileUrl}`,
    image: `${baseUrl}${author.photoUrl}`,
    jobTitle: shown.jobTitle,
    description: shown.shortBio,
    worksFor: { "@id": `${baseUrl}/#organization` },
    knowsAbout: shown.topics,
    knowsLanguage: ["de", "en", "nl"],
    sameAs: [author.linkedinUrl],
  };

  return (
    <div className="space-y-10">
      <JsonLd data={personJsonLd} />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">nisd2.eu</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{author.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Image
          src={author.photoUrl}
          alt={author.name}
          width={120}
          height={120}
          className="h-30 w-30 rounded-full border border-border"
        />
        <div className="flex-1 space-y-2">
          <Badge variant="secondary">{isEn ? "Author" : "Autor"}</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{author.name}</h1>
          <p className="text-sm text-muted-foreground">{shown.jobTitle}</p>
          <p className="text-base leading-relaxed text-foreground">{shown.shortBio}</p>
          <p className="text-sm">
            <a
              href={author.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              LinkedIn
            </a>
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isEn ? "Topics" : locale === "cs" ? "Témata" : "Themen"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {shown.topics.map((topic) => (
              <li key={topic} className="flex gap-2">
                <span className="text-foreground/40">·</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
