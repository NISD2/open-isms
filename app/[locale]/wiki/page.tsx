import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { pageAlternates } from "@/lib/seo";
import { topLevelSummary } from "@/lib/content/wiki-toc";
import {
  WikiHubSearch,
  type WikiCategoryCard,
  type WikiFlatPage,
} from "@/components/wiki/WikiHubSearch";
import { MarketingHero } from "@/components/marketing/MarketingHero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Wiki — NIS 2, BSIG, CIR explained"
      : "Wiki — NIS 2, BSIG, CIR erklärt",
    description: isEn
      ? "The complete documentation for NIS 2, the German BSIG and CIR 2024/2690 — scope, measures, fines, comparisons, and how to actually implement it."
      : "Die vollständige Dokumentation zu NIS 2, BSIG und CIR 2024/2690 — Anwendungsbereich, Maßnahmen, Bußgelder, Vergleiche und wie man es konkret umsetzt.",
    alternates: pageAlternates("wiki", locale),
    openGraph: {
      type: "website",
      images: [
        {
          url: `/og/wiki-${locale}.png`,
          width: 1200,
          height: 630,
          alt: isEn
            ? "Wiki — NIS 2, BSIG, CIR explained"
            : "Wiki — NIS 2, BSIG, CIR erklärt",
        },
      ],
    },
  };
}

// Three intent paths. The user types one of these questions inside their
// own head before they touch the docs; we surface them at the top so the
// first click is shorter than the first scroll.
const INTENT_PATHS = [
  {
    href: "/wiki/anwendungsbereich",
    questionDe: "Bin ich betroffen?",
    questionEn: "Am I in scope?",
    descriptionDe: "Sektor- und Größentest gegen die EU-Richtlinie.",
    descriptionEn: "Sector and size test against the EU directive.",
  },
  {
    href: "/wiki/umsetzung",
    questionDe: "Was muss ich tun?",
    questionEn: "What do I need to do?",
    descriptionDe: "Die zehn Maßnahmen aus Artikel 21 NIS 2, eine nach der anderen.",
    descriptionEn: "The ten measures in Article 21 NIS 2, one at a time.",
  },
  {
    href: "/wiki/troubleshooting",
    questionDe: "Etwas ist passiert. Was jetzt?",
    questionEn: "Something happened. Now what?",
    descriptionDe: "Vorfallmeldung, BSI-Anfrage, Bußgeldverfahren.",
    descriptionEn: "Incident reporting, BSI inquiries, fine procedures.",
  },
] as const;

// Curated featured pages. Anchored on actual analytics signal plus the
// content we just shipped. Order matters; the first card is the visual
// anchor of the strip.
const FEATURED = [
  {
    href: "/wiki/zeit-und-status/nis2-tracker-eu",
    eyebrowDe: "Neu",
    eyebrowEn: "New",
    titleDe: "NIS 2 EU-Umsetzungstracker",
    titleEn: "NIS 2 EU implementation tracker",
    summaryDe:
      "Wo jeder der 27 Mitgliedstaaten bei der NIS 2 Umsetzung steht. Nationales Gesetz, Behörde, CSIRT, Stand.",
    summaryEn:
      "Where each of the 27 Member States stands on NIS 2 transposition. National act, authority, CSIRT, status.",
  },
  {
    href: "/wiki/zeit-und-status/nis2-umsetzung-europa",
    eyebrowDe: "Beliebt",
    eyebrowEn: "Popular",
    titleDe: "NIS 2 Umsetzung in der EU",
    titleEn: "NIS 2 implementation across the EU",
    summaryDe:
      "Übersicht über die 27 Umsetzungsprozesse. Warum es schiefläuft und was das für Unternehmen bedeutet.",
    summaryEn:
      "Overview of the 27 transposition processes. Why it slipped and what that means for entities.",
  },
  {
    href: "/wiki/grundlagen/nis2-fuer-management",
    eyebrowDe: "Neu",
    eyebrowEn: "New",
    titleDe: "NIS 2 in 5 Minuten",
    titleEn: "NIS 2 in 5 minutes",
    summaryDe:
      "Für Geschäftsführer. Die Richtlinie, die Pflichten, die Haftung — ohne Beraterprosa.",
    summaryEn:
      "For managing directors. The directive, the duties, the personal liability — no consultant prose.",
  },
  {
    href: "/wiki/grundlagen/nis2-vs-nis1",
    eyebrowDe: "Neu",
    eyebrowEn: "New",
    titleDe: "NIS 2 vs NIS 1",
    titleEn: "NIS 2 vs NIS 1",
    summaryDe:
      "Was sich strukturell geändert hat: Anwendungsbereich, Pflichten, Governance, Meldewesen, Durchsetzung.",
    summaryEn:
      "What changed structurally: scope, obligations, governance, reporting, enforcement.",
  },
] as const;

export default async function DocsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const summary = topLevelSummary();

  const categories: WikiCategoryCard[] = summary.map((cat) => ({
    slug: cat.slug,
    titleDe: cat.titleDe,
    titleEn: cat.titleEn,
    questionDe: cat.questionDe,
    questionEn: cat.questionEn,
    count: cat.count,
  }));

  const allPages: WikiFlatPage[] = summary.flatMap((cat) =>
    cat.entries.map((entry) => ({
      href: `/wiki/${cat.slug}/${entry.slug}`,
      categorySlug: cat.slug,
      pageSlug: entry.slug,
      titleDe: entry.titleDe,
      titleEn: entry.titleEn ?? entry.titleDe,
      summaryDe: entry.summaryDe,
      summaryEn: entry.summaryEn ?? entry.summaryDe,
      categoryTitleDe: cat.titleDe,
      categoryTitleEn: cat.titleEn,
    })),
  );

  return (
    <div className="space-y-16 sm:space-y-20">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{"Wiki"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero */}
      <section>
        <MarketingHero
          centered
          eyebrow={
            <Badge variant="secondary">
              {isEn ? "Documentation" : "Dokumentation"}
            </Badge>
          }
          headline={isEn ? "NIS 2," : "NIS 2,"}
          accent={
            isEn
              ? "written for people who have to do it."
              : "geschrieben für Menschen, die es umsetzen müssen."
          }
          subhead={
            isEn
              ? "The EU directive, the German BSIG, the CIR 2024/2690 and the practitioner moves. Primary sources only. No consultant prose."
              : "Die EU-Richtlinie, das BSIG, die CIR 2024/2690 und die Praxis. Nur Primärquellen. Keine Beraterprosa."
          }
        />

        {/* Intent paths */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-3">
          {INTENT_PATHS.map((path) => (
            <Link
              key={path.href}
              href={path.href as never}
              className="group relative overflow-hidden rounded-2xl border bg-background/60 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-background hover:shadow-md"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-medium tracking-tight">
                  {isEn ? path.questionEn : path.questionDe}
                </h3>
                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isEn ? path.descriptionEn : path.descriptionDe}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured strip */}
      <section>
        <div className="mb-6 flex items-baseline justify-between gap-2">
          <h2 className="flex items-baseline gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles aria-hidden className="size-3.5" />
            {isEn ? "Featured" : "Empfohlen"}
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED.map((item) => (
            <Link
              key={item.href}
              href={item.href as never}
              className="group flex h-full flex-col rounded-2xl border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
            >
              <div className="mb-3">
                <span className="inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {isEn ? item.eyebrowEn : item.eyebrowDe}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug tracking-tight">
                {isEn ? item.titleEn : item.titleDe}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {isEn ? item.summaryEn : item.summaryDe}
              </p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {isEn ? "Read" : "Lesen"}
                <ArrowRight
                  aria-hidden
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by question (categories) + search */}
      <section>
        <div className="mb-6 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {isEn ? "Browse by question" : "Nach Frage stöbern"}
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {isEn ? "Eight questions, every operator asks." : "Acht Fragen, die jeder Betroffene stellt."}
          </p>
        </div>

        <WikiHubSearch
          categories={categories}
          allPages={allPages}
          locale={locale}
        />
      </section>
    </div>
  );
}
