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
import { pickLocalized } from "@/lib/locale";
import { ogImages } from "@/lib/og-card";
import { topLevelSummary } from "@/lib/content/wiki-toc";
import wikiI18n from "@/lib/content/wiki-toc-i18n.json";
import {
  WikiHubSearch,
  type WikiCategoryCard,
  type WikiFlatPage,
} from "@/components/wiki/WikiHubSearch";
import { MarketingHero } from "@/components/marketing/MarketingHero";

const WIKI_I18N = wikiI18n as Record<
  string,
  Record<string, Record<string, string>>
>;

// Localized lookup for category / entry nav strings. de and en are NOT in
// the lookup: de comes from the *De fields and en from the English fallback
// passed in. Only fr/it/es/pl resolve here; anything missing falls back to
// the English string so a gap never renders an empty cell.
function navText(
  key: string,
  field: "title" | "summary" | "question",
  locale: string,
  en: string,
  de: string,
): string {
  // nl has no TOC translations; it rendered German before fr/it/es/pl were
  // added, so keep that rather than flipping it to the English fallback.
  if (locale === "nl") return de;
  return WIKI_I18N[key]?.[locale]?.[field] ?? en;
}

// Pick a locale variant for the page's own inline strings (the ones not in
// the TOC lookup). de/en stay byte-identical to before; fr/it/es/pl are
// authored here; any missing locale falls back to en.
function pick(
  variants: { de: string; en: string; fr: string; it: string; es: string; pl: string },
  locale: string,
): string {
  // nl has no inline variant; it rendered German before the new locales.
  return pickLocalized(variants, locale, locale === "nl" ? "de" : "en");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = pick(
    {
      de: "Wiki — NIS 2, BSIG, CIR erklärt",
      en: "Wiki — NIS 2, BSIG, CIR explained",
      fr: "Wiki : NIS 2, BSIG, CIR expliqués",
      it: "Wiki : NIS 2, BSIG, CIR spiegati",
      es: "Wiki: NIS 2, BSIG, CIR explicados",
      pl: "Wiki: NIS 2, BSIG, CIR wyjaśnione",
    },
    locale,
  );
  const description = pick(
    {
      de: "Die vollständige Dokumentation zu NIS 2, BSIG und CIR 2024/2690 — Anwendungsbereich, Maßnahmen, Bußgelder, Vergleiche und wie man es konkret umsetzt.",
      en: "The complete documentation for NIS 2, the German BSIG and CIR 2024/2690 — scope, measures, fines, comparisons, and how to actually implement it.",
      fr: "La documentation complète sur NIS 2, le BSIG allemand et le CIR 2024/2690 : champ d'application, mesures, amendes, comparaisons et comment le mettre en œuvre concrètement.",
      it: "La documentazione completa su NIS 2, il BSIG tedesco e il CIR 2024/2690: ambito di applicazione, misure, sanzioni, confronti e come attuarlo concretamente.",
      es: "La documentación completa sobre NIS 2, el BSIG alemán y el CIR 2024/2690: ámbito de aplicación, medidas, multas, comparativas y cómo implementarlo en la práctica.",
      pl: "Pełna dokumentacja dotycząca NIS 2, niemieckiego BSIG i CIR 2024/2690: zakres stosowania, środki, kary, porównania oraz jak to faktycznie wdrożyć.",
    },
    locale,
  );
  return {
    title,
    description,
    alternates: pageAlternates("wiki", locale),
    openGraph: {
      type: "website",
      images: ogImages("wiki", locale, title),
    },
  };
}

// Three intent paths. The user types one of these questions inside their
// own head before they touch the docs; we surface them at the top so the
// first click is shorter than the first scroll.
const INTENT_PATHS = [
  {
    href: "/wiki/anwendungsbereich",
    question: {
      de: "Bin ich betroffen?",
      en: "Am I in scope?",
      fr: "Suis-je concerné ?",
      it: "Rientro nell'ambito di applicazione?",
      es: "¿Estoy dentro del ámbito de aplicación?",
      pl: "Czy jestem objęty?",
    },
    description: {
      de: "Sektor- und Größentest gegen die EU-Richtlinie.",
      en: "Sector and size test against the EU directive.",
      fr: "Test de secteur et de taille au regard de la directive de l'UE.",
      it: "Test di settore e dimensione rispetto alla direttiva UE.",
      es: "Prueba de sector y tamaño frente a la directiva de la UE.",
      pl: "Test sektora i wielkości względem dyrektywy UE.",
    },
  },
  {
    href: "/wiki/umsetzung",
    question: {
      de: "Was muss ich tun?",
      en: "What do I need to do?",
      fr: "Que dois-je faire ?",
      it: "Cosa devo fare?",
      es: "¿Qué tengo que hacer?",
      pl: "Co muszę zrobić?",
    },
    description: {
      de: "Die zehn Maßnahmen aus Artikel 21 NIS 2, eine nach der anderen.",
      en: "The ten measures in Article 21 NIS 2, one at a time.",
      fr: "Les dix mesures de l'article 21 NIS 2, une par une.",
      it: "Le dieci misure dell'articolo 21 NIS 2, una alla volta.",
      es: "Las diez medidas del artículo 21 NIS 2, una por una.",
      pl: "Dziesięć środków z artykułu 21 NIS 2, po kolei.",
    },
  },
  {
    href: "/wiki/troubleshooting",
    question: {
      de: "Etwas ist passiert. Was jetzt?",
      en: "Something happened. Now what?",
      fr: "Quelque chose s'est passé. Et maintenant ?",
      it: "È successo qualcosa. E adesso?",
      es: "Ha ocurrido algo. ¿Y ahora qué?",
      pl: "Coś się stało. Co teraz?",
    },
    description: {
      de: "Vorfallmeldung, BSI-Anfrage, Bußgeldverfahren.",
      en: "Incident reporting, BSI inquiries, fine procedures.",
      fr: "Notification d'incident, demandes du BSI, procédures d'amende.",
      it: "Notifica di incidente, richieste del BSI, procedimenti sanzionatori.",
      es: "Notificación de incidentes, requerimientos del BSI, procedimientos sancionadores.",
      pl: "Zgłaszanie incydentów, zapytania BSI, postępowania w sprawie kar.",
    },
  },
] as const;

// Curated featured pages. Anchored on actual analytics signal plus the
// content we just shipped. Order matters; the first card is the visual
// anchor of the strip.
const FEATURED = [
  {
    href: "/wiki/zeit-und-status/nis2-tracker-eu",
    eyebrow: {
      de: "Neu",
      en: "New",
      fr: "Nouveau",
      it: "Nuovo",
      es: "Nuevo",
      pl: "Nowość",
    },
    title: {
      de: "NIS 2 EU-Umsetzungstracker",
      en: "NIS 2 EU implementation tracker",
      fr: "Suivi de la transposition de NIS 2 dans l'UE",
      it: "Tracker dell'attuazione di NIS 2 nell'UE",
      es: "Rastreador de la implementación de NIS 2 en la UE",
      pl: "Tracker wdrożenia NIS 2 w UE",
    },
    summary: {
      de: "Wo jeder der 27 Mitgliedstaaten bei der NIS 2 Umsetzung steht. Nationales Gesetz, Behörde, CSIRT, Stand.",
      en: "Where each of the 27 Member States stands on NIS 2 transposition. National act, authority, CSIRT, status.",
      fr: "Où en est chacun des 27 États membres dans la transposition de NIS 2. Loi nationale, autorité, CSIRT, état d'avancement.",
      it: "A che punto è ciascuno dei 27 Stati membri nel recepimento di NIS 2. Legge nazionale, autorità, CSIRT, stato.",
      es: "En qué punto está cada uno de los 27 Estados miembros en la transposición de NIS 2. Ley nacional, autoridad, CSIRT, estado.",
      pl: "Na jakim etapie transpozycji NIS 2 jest każde z 27 państw członkowskich. Ustawa krajowa, organ, CSIRT, status.",
    },
  },
  {
    href: "/wiki/zeit-und-status/nis2-umsetzung-europa",
    eyebrow: {
      de: "Beliebt",
      en: "Popular",
      fr: "Populaire",
      it: "Popolare",
      es: "Popular",
      pl: "Popularne",
    },
    title: {
      de: "NIS 2 Umsetzung in der EU",
      en: "NIS 2 implementation across the EU",
      fr: "La mise en œuvre de NIS 2 dans l'UE",
      it: "L'attuazione di NIS 2 nell'UE",
      es: "La implementación de NIS 2 en la UE",
      pl: "Wdrożenie NIS 2 w UE",
    },
    summary: {
      de: "Übersicht über die 27 Umsetzungsprozesse. Warum es schiefläuft und was das für Unternehmen bedeutet.",
      en: "Overview of the 27 transposition processes. Why it slipped and what that means for entities.",
      fr: "Vue d'ensemble des 27 processus de transposition. Pourquoi cela a pris du retard et ce que cela signifie pour les entités.",
      it: "Panoramica dei 27 processi di recepimento. Perché è in ritardo e cosa significa per i soggetti.",
      es: "Visión general de los 27 procesos de transposición. Por qué se ha retrasado y qué significa para las entidades.",
      pl: "Przegląd 27 procesów transpozycji. Dlaczego się opóźnia i co to oznacza dla podmiotów.",
    },
  },
  {
    href: "/wiki/grundlagen/nis2-fuer-management",
    eyebrow: {
      de: "Neu",
      en: "New",
      fr: "Nouveau",
      it: "Nuovo",
      es: "Nuevo",
      pl: "Nowość",
    },
    title: {
      de: "NIS 2 in 5 Minuten",
      en: "NIS 2 in 5 minutes",
      fr: "NIS 2 en 5 minutes",
      it: "NIS 2 in 5 minuti",
      es: "NIS 2 en 5 minutos",
      pl: "NIS 2 w 5 minut",
    },
    summary: {
      de: "Für Geschäftsführer. Die Richtlinie, die Pflichten, die Haftung — ohne Beraterprosa.",
      en: "For managing directors. The directive, the duties, the personal liability — no consultant prose.",
      fr: "Pour les dirigeants. La directive, les obligations, la responsabilité personnelle, sans prose de consultant.",
      it: "Per gli amministratori. La direttiva, gli obblighi, la responsabilità personale, senza prosa da consulente.",
      es: "Para directivos. La directiva, las obligaciones, la responsabilidad personal, sin prosa de consultor.",
      pl: "Dla zarządzających. Dyrektywa, obowiązki, odpowiedzialność osobista, bez konsultanckiej nowomowy.",
    },
  },
  {
    href: "/wiki/grundlagen/nis2-vs-nis1",
    eyebrow: {
      de: "Neu",
      en: "New",
      fr: "Nouveau",
      it: "Nuovo",
      es: "Nuevo",
      pl: "Nowość",
    },
    title: {
      de: "NIS 2 vs NIS 1",
      en: "NIS 2 vs NIS 1",
      fr: "NIS 2 contre NIS 1",
      it: "NIS 2 contro NIS 1",
      es: "NIS 2 frente a NIS 1",
      pl: "NIS 2 a NIS 1",
    },
    summary: {
      de: "Was sich strukturell geändert hat: Anwendungsbereich, Pflichten, Governance, Meldewesen, Durchsetzung.",
      en: "What changed structurally: scope, obligations, governance, reporting, enforcement.",
      fr: "Ce qui a changé structurellement : champ d'application, obligations, gouvernance, notification, application.",
      it: "Cosa è cambiato a livello strutturale: ambito di applicazione, obblighi, governance, notifica, applicazione.",
      es: "Qué cambió a nivel estructural: ámbito de aplicación, obligaciones, gobernanza, notificación, aplicación.",
      pl: "Co zmieniło się strukturalnie: zakres stosowania, obowiązki, zarządzanie, zgłaszanie, egzekwowanie.",
    },
  },
] as const;

export default async function DocsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const summary = topLevelSummary();

  // The child component picks German for de and the "localized" slot for any
  // other locale. So we resolve fr/it/es/pl into the localized slot here via
  // the TOC lookup, with the English string as fallback. en keeps the English
  // string (navText returns the fallback because en is not in the lookup), so
  // de and en render exactly as before.
  const categories: WikiCategoryCard[] = summary.map((cat) => {
    const catKey = `cat:${cat.slug}`;
    return {
      slug: cat.slug,
      titleDe: cat.titleDe,
      titleLocalized: navText(catKey, "title", locale, cat.titleEn, cat.titleDe),
      questionDe: cat.questionDe,
      questionLocalized: navText(
        catKey,
        "question",
        locale,
        cat.questionEn,
        cat.questionDe,
      ),
      count: cat.count,
    };
  });

  const allPages: WikiFlatPage[] = summary.flatMap((cat) => {
    const catKey = `cat:${cat.slug}`;
    const categoryTitleLocalized = navText(
      catKey,
      "title",
      locale,
      cat.titleEn,
      cat.titleDe,
    );
    return cat.entries.map((entry) => {
      const entryKey = `entry:${entry.slug}`;
      const titleEn = entry.titleEn ?? entry.titleDe;
      const summaryEn = entry.summaryEn ?? entry.summaryDe;
      return {
        href: `/wiki/${cat.slug}/${entry.slug}`,
        categorySlug: cat.slug,
        pageSlug: entry.slug,
        titleDe: entry.titleDe,
        titleLocalized: navText(entryKey, "title", locale, titleEn, entry.titleDe),
        summaryDe: entry.summaryDe,
        summaryLocalized: navText(
          entryKey,
          "summary",
          locale,
          summaryEn,
          entry.summaryDe,
        ),
        categoryTitleDe: cat.titleDe,
        categoryTitleLocalized,
      };
    });
  });

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
              {pick(
                {
                  de: "Dokumentation",
                  en: "Documentation",
                  fr: "Documentation",
                  it: "Documentazione",
                  es: "Documentación",
                  pl: "Dokumentacja",
                },
                locale,
              )}
            </Badge>
          }
          headline="NIS 2,"
          accent={pick(
            {
              de: "geschrieben für Menschen, die es umsetzen müssen.",
              en: "written for people who have to do it.",
              fr: "écrit pour les personnes qui doivent le mettre en œuvre.",
              it: "scritto per chi deve attuarlo.",
              es: "escrito para quienes tienen que aplicarlo.",
              pl: "napisane dla osób, które muszą to wdrożyć.",
            },
            locale,
          )}
          subhead={pick(
            {
              de: "Die EU-Richtlinie, das BSIG, die CIR 2024/2690 und die Praxis. Nur Primärquellen. Keine Beraterprosa.",
              en: "The EU directive, the German BSIG, the CIR 2024/2690 and the practitioner moves. Primary sources only. No consultant prose.",
              fr: "La directive de l'UE, le BSIG allemand, le CIR 2024/2690 et la pratique. Uniquement des sources primaires. Pas de prose de consultant.",
              it: "La direttiva UE, il BSIG tedesco, il CIR 2024/2690 e la pratica. Solo fonti primarie. Nessuna prosa da consulente.",
              es: "La directiva de la UE, el BSIG alemán, el CIR 2024/2690 y la práctica. Solo fuentes primarias. Sin prosa de consultor.",
              pl: "Dyrektywa UE, niemiecki BSIG, CIR 2024/2690 i praktyka. Wyłącznie źródła pierwotne. Bez konsultanckiej nowomowy.",
            },
            locale,
          )}
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
                  {pick(path.question, locale)}
                </h3>
                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pick(path.description, locale)}
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
            {pick(
              {
                de: "Empfohlen",
                en: "Featured",
                fr: "À la une",
                it: "In evidenza",
                es: "Destacado",
                pl: "Polecane",
              },
              locale,
            )}
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
                  {pick(item.eyebrow, locale)}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug tracking-tight">
                {pick(item.title, locale)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {pick(item.summary, locale)}
              </p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {pick(
                  {
                    de: "Lesen",
                    en: "Read",
                    fr: "Lire",
                    it: "Leggi",
                    es: "Leer",
                    pl: "Czytaj",
                  },
                  locale,
                )}
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
            {pick(
              {
                de: "Nach Frage stöbern",
                en: "Browse by question",
                fr: "Parcourir par question",
                it: "Esplora per domanda",
                es: "Explorar por pregunta",
                pl: "Przeglądaj według pytania",
              },
              locale,
            )}
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {pick(
              {
                de: "Acht Fragen, die jeder Betroffene stellt.",
                en: "Eight questions, every operator asks.",
                fr: "Huit questions que se pose chaque entité concernée.",
                it: "Otto domande che ogni soggetto interessato si pone.",
                es: "Ocho preguntas que se hace toda entidad afectada.",
                pl: "Osiem pytań, które zadaje każdy objęty podmiot.",
              },
              locale,
            )}
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
