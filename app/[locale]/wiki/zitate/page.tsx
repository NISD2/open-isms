import type { Metadata } from "next";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  allLegislation,
  buildLegislationJsonLd,
  type LegislationKey,
} from "@/lib/content/citations";
import { pickLocalized } from "@/lib/locale";
import { pageAlternates } from "@/lib/seo";

type Legislation = ReturnType<typeof allLegislation>[number];

/** The page's own words. English and Czech have theirs; every other locale reads German. */
const TEXT = {
  de: {
    metaTitle: "Rechtsgrundlagen, die wir zitieren | nisd2.eu",
    metaDescription:
      "Die EU- und nationalen Primärquellen hinter jedem NIS 2 Artikel auf nisd2.eu — Richtlinien, Verordnungen, Umsetzungsgesetze, mit ELI-Verweisen.",
    crumb: "Rechtsgrundlagen",
    badge: "Zitatbibliothek",
    title: "Rechtsgrundlagen, die wir zitieren",
    lead: "Jeder NIS 2 Artikel auf nisd2.eu zitiert Primärquellen. Das ist die kanonische Liste — EU-Richtlinien und Verordnungen, das deutsche BSIG und die BSI-Vorschriften, jeweils über die offizielle EU-ELI (European Legislation Identifier) verlinkt.",
    jurisdiction: "Geltungsbereich",
    adopted: "Beschlossen",
    applies: "Anwendbar",
    force: "Rechtskraft",
    graph:
      "Jeder NIS 2 Artikel emittiert diese Einträge als schema.org Legislation JSON-LD über deren @id. Im Quelltext jeder Wiki-Seite ist der Zitationsgraph sichtbar.",
  },
  en: {
    metaTitle: "Legal sources we cite | nisd2.eu",
    metaDescription:
      "The primary EU and German legal sources behind every NIS 2 article on nisd2.eu — directives, regulations, transposition acts, with ELI links.",
    crumb: "Legal sources",
    badge: "Citation library",
    title: "Legal sources we cite",
    lead: "Every NIS 2 article on nisd2.eu cites primary sources. This is the canonical list — EU directives and regulations, the German BSIG, and the BSI implementing rules, each linked via the EU's official ELI (European Legislation Identifier).",
    jurisdiction: "Jurisdiction",
    adopted: "Adopted",
    applies: "Applies",
    force: "Force",
    graph:
      "Every NIS 2 article emits these entries as schema.org Legislation JSON-LD via their @id. View source on any wiki page to see the citation graph.",
  },
  cs: {
    metaTitle: "Právní předpisy, které citujeme | nisd2.eu",
    metaDescription:
      "Předpisy EU, zákon č. 264/2025 Sb., o kybernetické bezpečnosti, a německé předpisy, na které odkazují články o NIS 2 na nisd2.eu, s odkazy na úřední text.",
    crumb: "Právní předpisy",
    badge: "Knihovna citací",
    title: "Právní předpisy, které citujeme",
    lead: "Každý článek o NIS 2 na nisd2.eu cituje primární zdroje. Tady jsou směrnice a nařízení EU, zákon č. 264/2025 Sb., o kybernetické bezpečnosti, a německé předpisy, na které články odkazují, každý s odkazem na úřední text. Jednotlivá ustanovení zákona a jeho vyhlášek odkazují české stránky přímo v e-Sbírce.",
    jurisdiction: "Územní působnost",
    adopted: "Přijato",
    applies: "Použitelné od",
    force: "Účinnost",
    graph:
      "Každý článek o NIS 2 uvádí tyto předpisy jako strukturovaná data schema.org Legislation (JSON-LD) přes jejich @id. Ve zdrojovém kódu každé stránky wiki je graf citací vidět.",
  },
} as const;

/**
 * The library in Czech. Its entries keep their German or English names for the structured data;
 * a Czech reader sees the Czech name, and the German acts marked as German.
 */
const CZECH: {
  readonly names: Readonly<Record<LegislationKey, string>>;
  readonly types: Readonly<Record<Legislation["legislationType"], string>>;
  readonly jurisdictions: Readonly<Record<Legislation["jurisdiction"], string>>;
  readonly force: Readonly<Record<Legislation["legalForce"], string>>;
} = {
  names: {
    nis2: "Směrnice (EU) 2022/2555 (NIS 2)",
    bsig: "Německý zákon o Spolkovém úřadu pro bezpečnost v informační technice (BSIG)",
    "cir-2024-2690": "Prováděcí nařízení Komise (EU) 2024/2690",
    "bsi-kritisv": "Německé nařízení o určení kritické infrastruktury (BSI-KritisV)",
    cra: "Nařízení (EU) 2024/2847 (akt o kybernetické odolnosti)",
    dora: "Nařízení (EU) 2022/2554 o digitální provozní odolnosti finančního sektoru (DORA)",
    gdpr: "Nařízení (EU) 2016/679 (obecné nařízení o ochraně osobních údajů)",
    "enisa-tig": "Technické pokyny ENISA k provádění směrnice NIS 2",
    zkb: "Zákon č. 264/2025 Sb., o kybernetické bezpečnosti",
  },
  types: {
    Directive: "Směrnice",
    Regulation: "Nařízení",
    Act: "Zákon",
    Decree: "Vyhláška",
  },
  jurisdictions: {
    "European Union": "Evropská unie",
    Deutschland: "Německo",
    "Česká republika": "Česko",
  },
  force: {
    InForce: "účinný",
    NotInForce: "neúčinný",
    PartiallyInForce: "částečně účinný",
  },
};

/** What a card shows for an entry: the Czech words on a Czech page, the data's own elsewhere. */
const shown = (e: Legislation, locale: string) =>
  locale === "cs"
    ? {
        name: CZECH.names[e.key],
        alternateNames: [],
        type: CZECH.types[e.legislationType],
        jurisdiction: CZECH.jurisdictions[e.jurisdiction],
        force: CZECH.force[e.legalForce],
      }
    : {
        name: e.name,
        alternateNames: e.alternateNames,
        type: e.legislationType,
        jurisdiction: e.jurisdiction,
        force: e.legalForce,
      };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const text = pickLocalized(TEXT, locale, "de");
  return {
    title: text.metaTitle,
    description: text.metaDescription,
    alternates: pageAlternates("wiki/zitate", locale),
  };
}

export default async function ZitatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const text = pickLocalized(TEXT, locale, "de");
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
            <BreadcrumbPage>{text.crumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <Badge variant="secondary" className="mb-3">
          {text.badge}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{text.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{text.lead}</p>
      </header>

      <div className="grid gap-4">
        {entries.map((e) => {
          const card = shown(e, locale);
          return (
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
                      {card.name}
                    </a>
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">
                    {card.type}
                  </Badge>
                </div>
                {card.alternateNames.length > 0 && (
                  <CardDescription className="text-xs">
                    {card.alternateNames.join(" · ")}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
                  <div>
                    <dt className="font-medium text-foreground">{text.jurisdiction}</dt>
                    <dd>{card.jurisdiction}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">{text.adopted}</dt>
                    <dd>{e.legislationDate}</dd>
                  </div>
                  {e.legislationDateOfApplicability && (
                    <div>
                      <dt className="font-medium text-foreground">{text.applies}</dt>
                      <dd>{e.legislationDateOfApplicability}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium text-foreground">{text.force}</dt>
                    <dd>{card.force}</dd>
                  </div>
                </dl>
                {e.legislationIdentifier && (
                  <p className="font-mono text-[11px]">
                    CELEX: {e.legislationIdentifier}
                  </p>
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
          );
        })}
      </div>

      <section className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>{text.graph}</p>
      </section>
    </div>
  );
}
