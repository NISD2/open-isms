import type { Metadata } from "next";
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
import { JsonLd } from "@/components/JsonLd";
import { pageAlternates } from "@/lib/seo";
import { allLegislation, buildLegislationJsonLd } from "@/lib/content/citations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Legal sources we cite | nisd2.eu"
      : "Rechtsgrundlagen, die wir zitieren | nisd2.eu",
    description: isEn
      ? "The primary EU and German legal sources behind every NIS 2 article on nisd2.eu — directives, regulations, transposition acts, with ELI links."
      : "Die EU- und nationalen Primärquellen hinter jedem NIS 2 Artikel auf nisd2.eu — Richtlinien, Verordnungen, Umsetzungsgesetze, mit ELI-Verweisen.",
    alternates: pageAlternates("wiki/zitate", locale),
  };
}

export default async function ZitatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const entries = allLegislation();

  return (
    <div className="space-y-10">
      {entries.map((e) => (
        <JsonLd key={e.key} data={buildLegislationJsonLd(e.key)} />
      ))}

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={"/wiki" as never}>Wiki</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isEn ? "Legal sources" : "Rechtsgrundlagen"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <Badge variant="secondary" className="mb-3">
          {isEn ? "Citation library" : "Zitatbibliothek"}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEn ? "Legal sources we cite" : "Rechtsgrundlagen, die wir zitieren"}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {isEn
            ? "Every NIS 2 article on nisd2.eu cites primary sources. This is the canonical list — EU directives and regulations, the German BSIG, and the BSI implementing rules, each linked via the EU's official ELI (European Legislation Identifier)."
            : "Jeder NIS 2 Artikel auf nisd2.eu zitiert Primärquellen. Das ist die kanonische Liste — EU-Richtlinien und Verordnungen, das deutsche BSIG und die BSI-Vorschriften, jeweils über die offizielle EU-ELI (European Legislation Identifier) verlinkt."}
        </p>
      </header>

      <div className="grid gap-4">
        {entries.map((e) => (
          <Card key={e.key} id={e.key}>
            <CardHeader>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <CardTitle className="text-lg">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline underline-offset-4"
                  >
                    {e.name}
                  </a>
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {e.legislationType}
                </Badge>
              </div>
              {e.alternateNames.length > 0 && (
                <CardDescription className="text-xs">
                  {e.alternateNames.join(" · ")}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
                <div>
                  <dt className="font-medium text-foreground">
                    {isEn ? "Jurisdiction" : "Geltungsbereich"}
                  </dt>
                  <dd>{e.jurisdiction}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {isEn ? "Adopted" : "Beschlossen"}
                  </dt>
                  <dd>{e.legislationDate}</dd>
                </div>
                {e.legislationDateOfApplicability && (
                  <div>
                    <dt className="font-medium text-foreground">
                      {isEn ? "Applies" : "Anwendbar"}
                    </dt>
                    <dd>{e.legislationDateOfApplicability}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-foreground">
                    {isEn ? "Force" : "Rechtskraft"}
                  </dt>
                  <dd>{e.legalForce}</dd>
                </div>
              </dl>
              {e.legislationIdentifier && (
                <p className="font-mono text-[11px]">CELEX: {e.legislationIdentifier}</p>
              )}
              {e.sameAs && (
                <p className="font-mono text-[11px]">
                  ELI:{" "}
                  <a
                    href={e.sameAs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    {e.sameAs.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          {isEn
            ? "Every NIS 2 article emits these entries as schema.org Legislation JSON-LD via their @id. View source on any wiki page to see the citation graph."
            : "Jeder NIS 2 Artikel emittiert diese Einträge als schema.org Legislation JSON-LD über deren @id. Im Quelltext jeder Wiki-Seite ist der Zitationsgraph sichtbar."}
        </p>
      </section>
    </div>
  );
}
