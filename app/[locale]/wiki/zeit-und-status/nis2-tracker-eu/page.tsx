import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import { WalkSteps } from "@/components/wiki/WalkSteps";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { Link } from "@/i18n/navigation";
import { isLocaleCode, pickLocalized } from "@/lib/locale";
import {
  getRegistrationPortals,
  getTranspositionStatus,
  type RegistrationPortal,
  type TranspositionStatus,
} from "@/lib/registration-portals";
import { type Locale, pageAlternates, pageOg } from "@/lib/seo";

/**
 * A locale-keyed string bundle. de/en are always authored; fr/it/es/pl are
 * authored here but any missing locale falls back to `en` via `pick`.
 */
type Localized = {
  de: string;
  en: string;
  fr?: string;
  it?: string;
  es?: string;
  pl?: string;
  cs?: string;
  pt?: string;
  ro?: string;
};

/** Select the bundle entry for `locale`, falling back to English. */
function pick(bundle: Localized, locale: Locale): string {
  return pickLocalized(bundle, locale);
}

function resolveLocale(rawLocale: string): Locale {
  // The tracker bundles carry de/en/fr/it/es/pl; nl has no strings here and
  // rendered German before the new locales existed, so keep that behaviour.
  if (rawLocale === "nl") return "de";
  return isLocaleCode(rawLocale) ? rawLocale : "de";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const title = pick(
    {
      de: "NIS 2 EU-Umsetzungstracker: alle 27 Mitgliedstaaten",
      en: "NIS 2 EU implementation tracker: all 27 Member States",
      fr: "Suivi de la transposition NIS 2 dans l'UE : les 27 États membres",
      it: "Tracker di recepimento NIS 2 nell'UE: tutti i 27 Stati membri",
      es: "Rastreador de transposición NIS 2 en la UE: los 27 Estados miembros",
      pl: "Tracker wdrożenia NIS 2 w UE: wszystkie 27 państw członkowskich",
      cs: "Tracker zavádění NIS 2 v EU: všech 27 členských států",
      pt: "Monitorização da transposição da NIS 2 na UE: todos os 27 Estados-Membros",
      ro: "Monitor al transpunerii NIS 2 în UE: toate cele 27 de state membre",
    },
    locale,
  );
  const description = pick(
    {
      de: "Wo jeder EU-Mitgliedstaat bei der NIS 2 Umsetzung steht: nationales Gesetz, zuständige Behörde, nationales CSIRT, Stand. Stand Oktober 2026.",
      en: "Where every EU Member State stands on NIS 2 transposition: national act, competent authority, national CSIRT, status. Reviewed October 2026.",
      fr: "Où en est chaque État membre de l'UE dans la transposition de NIS 2 : loi nationale, autorité compétente, CSIRT national, état d'avancement. Revu en octobre 2026.",
      it: "A che punto è ogni Stato membro dell'UE nel recepimento di NIS 2: legge nazionale, autorità competente, CSIRT nazionale, stato. Verificato a ottobre 2026.",
      es: "Dónde se encuentra cada Estado miembro de la UE en la transposición de NIS 2: ley nacional, autoridad competente, CSIRT nacional, estado. Revisado en octubre de 2026.",
      pl: "Na jakim etapie wdrożenia NIS 2 jest każde państwo członkowskie UE: ustawa krajowa, organ właściwy, krajowy CSIRT, status. Zweryfikowano w październiku 2026.",
      cs: "Jak je na tom každý členský stát EU s transpozicí NIS 2: vnitrostátní zákon, příslušný orgán, vnitrostátní CSIRT, stav. Ověřeno v říjnu 2026.",
      pt: "Em que ponto está cada Estado-Membro da UE na transposição da NIS 2: lei nacional, autoridade competente, CSIRT nacional, estado. Verificado em outubro de 2026.",
      ro: "În ce stadiu se află fiecare stat membru al UE cu transpunerea NIS 2: lege națională, autoritate competentă, CSIRT național, stare. Verificat în octombrie 2026.",
    },
    locale,
  );
  return {
    title,
    description,
    alternates: pageAlternates("wiki/zeit-und-status/nis2-tracker-eu", locale),
    ...pageOg({
      slug: "wiki/zeit-und-status/nis2-tracker-eu",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

function statusBadgeClasses(status: TranspositionStatus): string {
  switch (status) {
    case "in-force":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/30";
    case "bill-pending":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/30";
    case "drafting":
      return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-400/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const STATUS_LABELS: Record<TranspositionStatus, Localized> = {
  "in-force": {
    de: "In Kraft",
    en: "In force",
    fr: "En vigueur",
    it: "In vigore",
    es: "En vigor",
    pl: "Obowiązuje",
    cs: "V platnosti",
    pt: "Em vigor",
    ro: "În vigoare",
  },
  "bill-pending": {
    de: "Gesetzentwurf",
    en: "Bill pending",
    fr: "Projet de loi en cours",
    it: "Disegno di legge in corso",
    es: "Proyecto de ley en curso",
    pl: "Projekt ustawy w toku",
    cs: "Návrh zákona projednáván",
    pt: "Projeto de lei pendente",
    ro: "Proiect de lege în curs",
  },
  drafting: {
    de: "Im Entwurf",
    en: "Drafting",
    fr: "En préparation",
    it: "In elaborazione",
    es: "En elaboración",
    pl: "W przygotowaniu",
    cs: "V přípravě",
    pt: "Em elaboração",
    ro: "În pregătire",
  },
  unknown: {
    de: "Unbekannt",
    en: "Unknown",
    fr: "Inconnu",
    it: "Sconosciuto",
    es: "Desconocido",
    pl: "Nieznany",
    cs: "Neznámý",
    pt: "Desconhecido",
    ro: "Necunoscut",
  },
};

/**
 * Select the per-country tracker note for `locale`, falling back to the
 * English note when the localized variant is absent in the data file.
 */
function trackerNote(portal: RegistrationPortal, locale: Locale): string | undefined {
  const byLocale: Record<Locale, string | undefined> = {
    de: portal.trackerNoteDe,
    en: portal.trackerNoteEn,
    fr: portal.trackerNoteFr,
    it: portal.trackerNoteIt,
    es: portal.trackerNoteEs,
    pl: portal.trackerNotePl,
    nl: undefined,
    cs: undefined,
    pt: undefined,
    ro: undefined,
  };
  return byLocale[locale] ?? portal.trackerNoteEn;
}

export default async function Nis2TrackerEuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  const { portals } = getRegistrationPortals();

  const display = new Intl.DisplayNames([locale], { type: "region" });
  const countryName = (code: string): string => display.of(code) ?? code;

  const today = new Date();
  const rows = portals
    .map((p) => ({
      ...p,
      transpositionStatus: getTranspositionStatus(p, today),
      name: countryName(p.countryCode),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const counts = {
    inForce: rows.filter((r) => r.transpositionStatus === "in-force").length,
    pending: rows.filter((r) => r.transpositionStatus === "bill-pending").length,
    drafting: rows.filter(
      (r) => r.transpositionStatus === "drafting" || r.transpositionStatus === "unknown",
    ).length,
  };

  return (
    <GlossedProse locale={locale}>
      <div className="space-y-10">
        <WikiPageJsonLd
          category="zeit-und-status"
          slug="nis2-tracker-eu"
          locale={locale}
          authorSlug="simon-orzel"
          proficiencyLevel="Beginner"
          audienceType={pick(
            {
              de: "EU-weit tätige Unternehmen und Compliance-Verantwortliche",
              en: "EU-wide operators and compliance leads",
              fr: "Opérateurs actifs dans toute l'UE et responsables de la conformité",
              it: "Operatori attivi in tutta l'UE e responsabili della conformità",
              es: "Operadores activos en toda la UE y responsables de cumplimiento",
              pl: "Podmioty działające w całej UE i osoby odpowiedzialne za zgodność",
              cs: "Subjekty působící v celé EU a osoby odpovědné za soulad",
              pt: "Operadores ativos em toda a UE e responsáveis pela conformidade",
              ro: "Operatori activi în întreaga UE și responsabili de conformitate",
            },
            locale,
          )}
          citationKeys={["nis2"]}
          aboutKeys={["nis2"]}
          mentionsKeys={["bsig"]}
        />

        <header>
          <Badge variant="secondary" className="mb-3">
            {pick(
              {
                de: "Aktueller Stand",
                en: "Live status",
                fr: "État actuel",
                it: "Stato attuale",
                es: "Estado actual",
                pl: "Aktualny status",
                cs: "Aktuální stav",
                pt: "Estado atual",
                ro: "Stare actuală",
              },
              locale,
            )}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {pick(
              {
                de: "NIS 2 EU-Umsetzungstracker",
                en: "NIS 2 EU implementation tracker",
                fr: "Suivi de la transposition NIS 2 dans l'UE",
                it: "Tracker di recepimento NIS 2 nell'UE",
                es: "Rastreador de transposición NIS 2 en la UE",
                pl: "Tracker wdrożenia NIS 2 w UE",
                cs: "Tracker zavádění NIS 2 v EU",
                pt: "Monitorização da transposição da NIS 2 na UE",
                ro: "Monitor al transpunerii NIS 2 în UE",
              },
              locale,
            )}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {pick(
              {
                de: "Wo jeder EU-Mitgliedstaat bei der NIS 2 Umsetzung steht. Nationales Gesetz, zuständige Behörde, nationales CSIRT, Stand. Stand Oktober 2026.",
                en: "Where every EU Member State stands on the NIS 2 transposition. National act, competent authority, national CSIRT, status. Reviewed October 2026.",
                fr: "Où en est chaque État membre de l'UE dans la transposition de NIS 2. Loi nationale, autorité compétente, CSIRT national, état d'avancement. Revu en octobre 2026.",
                it: "A che punto è ogni Stato membro dell'UE nel recepimento di NIS 2. Legge nazionale, autorità competente, CSIRT nazionale, stato. Verificato a ottobre 2026.",
                es: "Dónde se encuentra cada Estado miembro de la UE en la transposición de NIS 2. Ley nacional, autoridad competente, CSIRT nacional, estado. Revisado en octubre de 2026.",
                pl: "Na jakim etapie wdrożenia NIS 2 jest każde państwo członkowskie UE. Ustawa krajowa, organ właściwy, krajowy CSIRT, status. Zweryfikowano w październiku 2026.",
                cs: "Jak je na tom každý členský stát EU s transpozicí NIS 2. Vnitrostátní zákon, příslušný orgán, vnitrostátní CSIRT, stav. Ověřeno v říjnu 2026.",
                pt: "Em que ponto está cada Estado-Membro da UE na transposição da NIS 2. Lei nacional, autoridade competente, CSIRT nacional, estado. Verificado em outubro de 2026.",
                ro: "În ce stadiu se află fiecare stat membru al UE cu transpunerea NIS 2. Lege națională, autoritate competentă, CSIRT național, stare. Verificat în octombrie 2026.",
              },
              locale,
            )}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={locale === "de" || locale === "en" || locale === "nl" ? locale : "en"}
          lastReviewedAt="2026-10-04"
          sourceLocale="en"
        />

        <Separator />

        {/* Snapshot */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
            <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
              {counts.inForce}
            </div>
            <div className="text-sm text-muted-foreground">
              {pick(
                {
                  de: "Mitgliedstaaten mit nationalem Gesetz in Kraft",
                  en: "Member States with the national act in force",
                  fr: "États membres dont la loi nationale est en vigueur",
                  it: "Stati membri con la legge nazionale in vigore",
                  es: "Estados miembros con la ley nacional en vigor",
                  pl: "Państwa członkowskie, w których ustawa krajowa obowiązuje",
                  cs: "Členské státy, v nichž vnitrostátní zákon platí",
                  pt: "Estados-Membros com a lei nacional em vigor",
                  ro: "State membre cu legea națională în vigoare",
                },
                locale,
              )}
            </div>
          </div>
          <div className="rounded-lg border bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <div className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
              {counts.pending}
            </div>
            <div className="text-sm text-muted-foreground">
              {pick(
                {
                  de: "Mitgliedstaaten mit Gesetzentwurf im Verfahren",
                  en: "Member States with the bill in legislative process",
                  fr: "États membres dont le projet de loi est en procédure législative",
                  it: "Stati membri con il disegno di legge in iter legislativo",
                  es: "Estados miembros con el proyecto de ley en proceso legislativo",
                  pl: "Państwa członkowskie, w których projekt ustawy jest w procesie legislacyjnym",
                  cs: "Členské státy, v nichž je návrh zákona v legislativním procesu",
                  pt: "Estados-Membros com o projeto de lei em processo legislativo",
                  ro: "State membre cu proiectul de lege în proces legislativ",
                },
                locale,
              )}
            </div>
          </div>
          <div className="rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/20">
            <div className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
              {counts.drafting}
            </div>
            <div className="text-sm text-muted-foreground">
              {pick(
                {
                  de: "Mitgliedstaaten in der Entwurfsphase oder unklar",
                  en: "Member States still drafting or status unclear",
                  fr: "États membres encore en préparation ou au statut incertain",
                  it: "Stati membri ancora in fase di elaborazione o con stato incerto",
                  es: "Estados miembros aún en elaboración o con estado incierto",
                  pl: "Państwa członkowskie wciąż w przygotowaniu lub o niejasnym statusie",
                  cs: "Členské státy stále v přípravě nebo s nejasným stavem",
                  pt: "Estados-Membros ainda em elaboração ou com estado incerto",
                  ro: "State membre încă în pregătire sau cu stare incertă",
                },
                locale,
              )}
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {pick(
              {
                de: "Worum es geht",
                en: "What this is",
                fr: "De quoi il s'agit",
                it: "Di cosa si tratta",
                es: "De qué se trata",
                pl: "Czego to dotyczy",
                cs: "O co jde",
                pt: "Do que se trata",
                ro: "Despre ce este vorba",
              },
              locale,
            )}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {pick(
              {
                de: "Die Umsetzungsfrist vom 17. Oktober 2024 aus Artikel 41 NIS 2 ist verstrichen. Wenige Mitgliedstaaten waren schnell (Italien, Belgien, Ungarn, Kroatien, Rumänien). Die meisten folgten 2025 und 2026: In Deutschland gilt das Gesetz seit Dezember 2025, in den Niederlanden seit August 2026 und in Österreich seit Oktober 2026. Frankreich, Spanien und Irland haben noch kein nationales Gesetz in Kraft. Die Europäische Kommission hat am 28. November 2024 Aufforderungsschreiben und am 7. Mai 2025 mit Gründen versehene Stellungnahmen verschickt und am 8. Juli 2026 Irland, Spanien, Frankreich und die Niederlande beim Gerichtshof der EU verklagt.",
                en: "The 17 October 2024 transposition deadline set in Article 41 NIS 2 has come and gone. A few Member States moved fast (Italy, Belgium, Hungary, Croatia, Romania). Most followed in 2025 and 2026: Germany's act has been in force since December 2025, the Netherlands' since August 2026 and Austria's since October 2026. France, Spain and Ireland still have no national act in force. The European Commission sent letters of formal notice on 28 November 2024 and reasoned opinions on 7 May 2025, and on 8 July 2026 referred Ireland, Spain, France and the Netherlands to the Court of Justice of the EU.",
                fr: "Le délai de transposition du 17 octobre 2024 fixé à l'article 41 NIS 2 est dépassé. Quelques États membres ont agi rapidement (Italie, Belgique, Hongrie, Croatie, Roumanie). La plupart ont suivi en 2025 et 2026 : la loi allemande est en vigueur depuis décembre 2025, la loi néerlandaise depuis août 2026 et la loi autrichienne depuis octobre 2026. La France, l'Espagne et l'Irlande n'ont toujours pas de loi nationale en vigueur. La Commission européenne a adressé des lettres de mise en demeure le 28 novembre 2024 et des avis motivés le 7 mai 2025, puis a saisi le 8 juillet 2026 la Cour de justice de l'UE contre l'Irlande, l'Espagne, la France et les Pays-Bas.",
                it: "Il termine di recepimento del 17 ottobre 2024 fissato dall'articolo 41 NIS 2 è scaduto. Pochi Stati membri si sono mossi rapidamente (Italia, Belgio, Ungheria, Croazia, Romania). La maggior parte ha seguito nel 2025 e nel 2026: in Germania la legge è in vigore da dicembre 2025, nei Paesi Bassi da agosto 2026 e in Austria da ottobre 2026. Francia, Spagna e Irlanda non hanno ancora una legge nazionale in vigore. La Commissione europea ha inviato lettere di costituzione in mora il 28 novembre 2024 e pareri motivati il 7 maggio 2025, e l'8 luglio 2026 ha deferito Irlanda, Spagna, Francia e Paesi Bassi alla Corte di giustizia dell'UE.",
                es: "El plazo de transposición del 17 de octubre de 2024 fijado en el artículo 41 NIS 2 ha vencido. Unos pocos Estados miembros actuaron con rapidez (Italia, Bélgica, Hungría, Croacia, Rumanía). La mayoría les siguieron en 2025 y 2026: la ley alemana está en vigor desde diciembre de 2025, la neerlandesa desde agosto de 2026 y la austriaca desde octubre de 2026. Francia, España e Irlanda siguen sin una ley nacional en vigor. La Comisión Europea envió cartas de emplazamiento el 28 de noviembre de 2024 y dictámenes motivados el 7 de mayo de 2025, y el 8 de julio de 2026 llevó a Irlanda, España, Francia y los Países Bajos ante el Tribunal de Justicia de la UE.",
                pl: "Termin transpozycji wyznaczony na 17 października 2024 r. w artykule 41 NIS 2 upłynął. Kilka państw członkowskich zadziałało szybko (Włochy, Belgia, Węgry, Chorwacja, Rumunia). Większość dołączyła w latach 2025 i 2026: w Niemczech ustawa obowiązuje od grudnia 2025 r., w Holandii od sierpnia 2026 r., a w Austrii od października 2026 r. Francja, Hiszpania i Irlandia nadal nie mają obowiązującej ustawy krajowej. Komisja Europejska wysłała wezwania do usunięcia uchybienia 28 listopada 2024 r. i uzasadnione opinie 7 maja 2025 r., a 8 lipca 2026 r. skierowała do Trybunału Sprawiedliwości UE skargi przeciwko Irlandii, Hiszpanii, Francji i Holandii.",
                cs: "Lhůta pro transpozici stanovená na 17. října 2024 v článku 41 NIS 2 uplynula. Několik členských států jednalo rychle (Itálie, Belgie, Maďarsko, Chorvatsko, Rumunsko). Většina následovala v letech 2025 a 2026: v Německu platí zákon od prosince 2025, v Nizozemsku od srpna 2026 a v Rakousku od října 2026. Francie, Španělsko a Irsko dosud nemají účinný vnitrostátní zákon. Evropská komise zaslala výzvy 28. listopadu 2024 a odůvodněná stanoviska 7. května 2025 a 8. července 2026 podala k Soudnímu dvoru EU žalobu proti Irsku, Španělsku, Francii a Nizozemsku.",
                pt: "O prazo de transposição de 17 de outubro de 2024 fixado no artigo 41.º da NIS 2 já terminou. Alguns Estados-Membros agiram com rapidez (Itália, Bélgica, Hungria, Croácia, Roménia). A maioria seguiu em 2025 e 2026: a lei alemã está em vigor desde dezembro de 2025, a neerlandesa desde agosto de 2026 e a austríaca desde outubro de 2026. França, Espanha e Irlanda continuam sem lei nacional em vigor. A Comissão Europeia enviou cartas de notificação para cumprir em 28 de novembro de 2024 e pareceres fundamentados em 7 de maio de 2025 e, em 8 de julho de 2026, instaurou ações no Tribunal de Justiça da UE contra a Irlanda, Espanha, França e Países Baixos.",
                ro: "Termenul de transpunere de 17 octombrie 2024 stabilit la articolul 41 NIS 2 a expirat. Câteva state membre au acționat rapid (Italia, Belgia, Ungaria, Croația, România). Cele mai multe au urmat în 2025 și 2026: legea germană este în vigoare din decembrie 2025, cea neerlandeză din august 2026, iar cea austriacă din octombrie 2026. Franța, Spania și Irlanda încă nu au o lege națională în vigoare. Comisia Europeană a trimis scrisori de punere în întârziere la 28 noiembrie 2024 și avize motivate la 7 mai 2025, iar la 8 iulie 2026 a sesizat Curtea de Justiție a UE cu privire la Irlanda, Spania, Franța și Țările de Jos.",
              },
              locale,
            )}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {pick(
              {
                de: "Die Tabelle unten fasst je Mitgliedstaat das wesentliche nationale Gesetz, die federführende zuständige Behörde und das nationale CSIRT zusammen. Wo eine Vertiefung pro Land existiert, ist der Landesname verlinkt. Stand zum Prüfdatum; das aktuellste belastbare Bild bietet die Übersicht der Europäischen Kommission zur Umsetzung von NIS 2.",
                en: "The table below summarises the canonical national act, the lead competent authority and the national CSIRT for each Member State. Where we have a per-country deep dive, the country name links to it. Status as of the review date; check the European Commission's NIS 2 transposition page for the latest verifiable picture.",
                fr: "Le tableau ci-dessous résume, pour chaque État membre, la loi nationale de référence, l'autorité compétente chef de file et le CSIRT national. Lorsqu'une analyse approfondie par pays existe, le nom du pays renvoie vers elle. État à la date de révision ; pour l'image vérifiable la plus récente, consultez la page de la Commission européenne sur la transposition de NIS 2.",
                it: "La tabella seguente riassume, per ciascuno Stato membro, la legge nazionale di riferimento, l'autorità competente capofila e il CSIRT nazionale. Dove esiste un approfondimento per paese, il nome del paese rimanda a esso. Stato alla data di verifica; per il quadro verificabile più recente consultare la pagina della Commissione europea sul recepimento di NIS 2.",
                es: "La tabla siguiente resume, para cada Estado miembro, la ley nacional de referencia, la autoridad competente principal y el CSIRT nacional. Cuando existe un análisis detallado por país, el nombre del país enlaza con él. Estado a la fecha de revisión; para la imagen verificable más reciente, consulte la página de la Comisión Europea sobre la transposición de NIS 2.",
                pl: "Poniższa tabela podsumowuje dla każdego państwa członkowskiego kluczową ustawę krajową, wiodący organ właściwy oraz krajowy CSIRT. Tam, gdzie istnieje pogłębiona analiza danego kraju, nazwa kraju jest do niej odnośnikiem. Status na dzień weryfikacji; najbardziej aktualny, wiarygodny obraz zapewnia strona Komisji Europejskiej poświęcona transpozycji NIS 2.",
                cs: "Následující tabulka shrnuje pro každý členský stát klíčový vnitrostátní zákon, vedoucí příslušný orgán a vnitrostátní CSIRT. Tam, kde existuje podrobný rozbor dané země, je název země odkazem na něj. Stav k datu ověření; nejaktuálnější ověřitelný obraz poskytuje stránka Evropské komise o transpozici NIS 2.",
                pt: "A tabela abaixo resume, para cada Estado-Membro, a lei nacional de referência, a autoridade competente principal e o CSIRT nacional. Quando existe uma análise aprofundada por país, o nome do país remete para ela. Estado à data de revisão; para o panorama verificável mais recente, consulte a página da Comissão Europeia sobre a transposição da NIS 2.",
                ro: "Tabelul de mai jos rezumă, pentru fiecare stat membru, legea națională de referință, autoritatea competentă principală și CSIRT-ul național. Acolo unde există o analiză detaliată pe țară, numele țării face trimitere la aceasta. Stare la data verificării; pentru imaginea verificabilă cea mai recentă, consultați pagina Comisiei Europene privind transpunerea NIS 2.",
              },
              locale,
            )}
          </p>
        </section>

        {/* Country table */}
        <section className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {pick(
                    {
                      de: "Mitgliedstaat",
                      en: "Member State",
                      fr: "État membre",
                      it: "Stato membro",
                      es: "Estado miembro",
                      pl: "Państwo członkowskie",
                      cs: "Členský stát",
                      pt: "Estado-Membro",
                      ro: "Stat membru",
                    },
                    locale,
                  )}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {pick(
                    {
                      de: "Nationales Gesetz",
                      en: "National act",
                      fr: "Loi nationale",
                      it: "Legge nazionale",
                      es: "Ley nacional",
                      pl: "Ustawa krajowa",
                      cs: "Vnitrostátní zákon",
                      pt: "Lei nacional",
                      ro: "Lege națională",
                    },
                    locale,
                  )}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {pick(
                    {
                      de: "Zuständige Behörde",
                      en: "Competent authority",
                      fr: "Autorité compétente",
                      it: "Autorità competente",
                      es: "Autoridad competente",
                      pl: "Organ właściwy",
                      cs: "Příslušný orgán",
                      pt: "Autoridade competente",
                      ro: "Autoritate competentă",
                    },
                    locale,
                  )}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {pick(
                    {
                      de: "Nationales CSIRT",
                      en: "National CSIRT",
                      fr: "CSIRT national",
                      it: "CSIRT nazionale",
                      es: "CSIRT nacional",
                      pl: "Krajowy CSIRT",
                      cs: "Vnitrostátní CSIRT",
                      pt: "CSIRT nacional",
                      ro: "CSIRT național",
                    },
                    locale,
                  )}
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {pick(
                    {
                      de: "Stand",
                      en: "Status",
                      fr: "État",
                      it: "Stato",
                      es: "Estado",
                      pl: "Status",
                      cs: "Stav",
                      pt: "Estado",
                      ro: "Stare",
                    },
                    locale,
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const act = r.nationalLaw ?? "-";
                const note = trackerNote(r, locale);
                const statusLabel = pick(STATUS_LABELS[r.transpositionStatus], locale);
                return (
                  <tr key={r.countryCode} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-baseline gap-2">
                        <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 text-[10px] font-mono tracking-wide text-muted-foreground">
                          {r.countryCode}
                        </span>
                        {r.wikiSlug ? (
                          <Link
                            href={`/wiki/zeit-und-status/${r.wikiSlug}` as never}
                            className="font-medium hover:underline"
                          >
                            {r.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{r.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm leading-relaxed">{act}</div>
                      {note && (
                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {note}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-sm leading-relaxed">
                      {r.authority}
                    </td>
                    <td className="px-4 py-3 align-top text-sm leading-relaxed">
                      {r.csirt ?? "-"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(r.transpositionStatus)}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Per-country deep dives */}
        <Card>
          <CardHeader>
            <CardTitle>
              {pick(
                {
                  de: "Vertiefungen pro Land",
                  en: "Per-country deep dives",
                  fr: "Analyses approfondies par pays",
                  it: "Approfondimenti per paese",
                  es: "Análisis detallados por país",
                  pl: "Pogłębione analizy poszczególnych krajów",
                  cs: "Podrobné rozbory jednotlivých zemí",
                  pt: "Análises aprofundadas por país",
                  ro: "Analize detaliate pe țară",
                },
                locale,
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rows
                .filter((r) => r.wikiSlug)
                .map((r) => (
                  <Link
                    key={r.countryCode}
                    href={`/wiki/zeit-und-status/${r.wikiSlug}` as never}
                    className="rounded-md border p-3 transition hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 text-[10px] font-mono tracking-wide text-muted-foreground">
                        {r.countryCode}
                      </span>
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.authority}</p>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle>
              {pick(
                {
                  de: "Quellen",
                  en: "Sources",
                  fr: "Sources",
                  it: "Fonti",
                  es: "Fuentes",
                  pl: "Źródła",
                  cs: "Zdroje",
                  pt: "Fontes",
                  ro: "Surse",
                },
                locale,
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {pick(
                  {
                    de: "Richtlinie (EU) 2022/2555 (NIS 2), Artikel 41: Umsetzungsfrist. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    en: "Directive (EU) 2022/2555 (NIS 2), Article 41: transposition deadline. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    fr: "Directive (UE) 2022/2555 (NIS 2), article 41 : délai de transposition. EUR-Lex : eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    it: "Direttiva (UE) 2022/2555 (NIS 2), articolo 41: termine di recepimento. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    es: "Directiva (UE) 2022/2555 (NIS 2), artículo 41: plazo de transposición. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    pl: "Dyrektywa (UE) 2022/2555 (NIS 2), artykuł 41: termin transpozycji. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    cs: "Směrnice (EU) 2022/2555 (NIS 2), článek 41: lhůta pro transpozici. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    pt: "Diretiva (UE) 2022/2555 (NIS 2), artigo 41.º: prazo de transposição. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                    ro: "Directiva (UE) 2022/2555 (NIS 2), articolul 41: termen de transpunere. EUR-Lex: eur-lex.europa.eu/eli/dir/2022/2555/oj",
                  },
                  locale,
                )}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                European Commission, NIS 2 transposition status:
                digital-strategy.ec.europa.eu/en/policies/nis-transposition
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {pick(
                  {
                    de: "Europäische Kommission, Vertragsverletzungsverfahren gegen Mitgliedstaaten ohne vollständige Mitteilung der NIS 2 Umsetzung (Aufforderungsschreiben 28. November 2024, mit Gründen versehene Stellungnahmen 7. Mai 2025, Klage gegen Irland, Spanien, Frankreich und die Niederlande beim Gerichtshof der EU 8. Juli 2026, IP/26/1499).",
                    en: "European Commission, infringement procedures against Member States that did not communicate full transposition of NIS 2 (letters of formal notice 28 November 2024, reasoned opinions 7 May 2025, referral of Ireland, Spain, France and the Netherlands to the Court of Justice 8 July 2026, IP/26/1499).",
                    fr: "Commission européenne, procédures d'infraction contre les États membres n'ayant pas communiqué la transposition complète de NIS 2 (mises en demeure le 28 novembre 2024, avis motivés le 7 mai 2025, saisine de la Cour de justice contre l'Irlande, l'Espagne, la France et les Pays-Bas le 8 juillet 2026, IP/26/1499).",
                    it: "Commissione europea, procedure di infrazione contro gli Stati membri che non hanno comunicato il recepimento completo di NIS 2 (costituzione in mora 28 novembre 2024, pareri motivati 7 maggio 2025, deferimento di Irlanda, Spagna, Francia e Paesi Bassi alla Corte di giustizia 8 luglio 2026, IP/26/1499).",
                    es: "Comisión Europea, procedimientos de infracción contra los Estados miembros que no comunicaron la transposición completa de NIS 2 (cartas de emplazamiento 28 de noviembre de 2024, dictámenes motivados 7 de mayo de 2025, recurso ante el Tribunal de Justicia contra Irlanda, España, Francia y los Países Bajos 8 de julio de 2026, IP/26/1499).",
                    pl: "Komisja Europejska, postępowania w sprawie uchybienia zobowiązaniom wobec państw członkowskich, które nie zgłosiły pełnej transpozycji NIS 2 (wezwania 28 listopada 2024 r., uzasadnione opinie 7 maja 2025 r., skargi do Trybunału Sprawiedliwości przeciwko Irlandii, Hiszpanii, Francji i Holandii 8 lipca 2026 r., IP/26/1499).",
                    cs: "Evropská komise, řízení o nesplnění povinnosti proti členským státům, které neoznámily úplnou transpozici NIS 2 (výzvy 28. listopadu 2024, odůvodněná stanoviska 7. května 2025, žaloby k Soudnímu dvoru proti Irsku, Španělsku, Francii a Nizozemsku 8. července 2026, IP/26/1499).",
                    pt: "Comissão Europeia, processos por infração contra os Estados-Membros que não comunicaram a transposição completa da NIS 2 (notificações para cumprir 28 de novembro de 2024, pareceres fundamentados 7 de maio de 2025, ações no Tribunal de Justiça contra a Irlanda, Espanha, França e Países Baixos 8 de julho de 2026, IP/26/1499).",
                    ro: "Comisia Europeană, proceduri de constatare a neîndeplinirii obligațiilor împotriva statelor membre care nu au comunicat transpunerea completă a NIS 2 (scrisori de punere în întârziere 28 noiembrie 2024, avize motivate 7 mai 2025, sesizarea Curții de Justiție privind Irlanda, Spania, Franța și Țările de Jos 8 iulie 2026, IP/26/1499).",
                  },
                  locale,
                )}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {pick(
                  {
                    de: "Nationale Amtsblätter: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ) usw.",
                    en: "National official journals: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ), etc.",
                    fr: "Journaux officiels nationaux : BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ), etc.",
                    it: "Gazzette ufficiali nazionali: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ), ecc.",
                    es: "Boletines oficiales nacionales: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ), etc.",
                    pl: "Krajowe dzienniki urzędowe: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ) itd.",
                    cs: "Vnitrostátní úřední věstníky: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ) atd.",
                    pt: "Jornais oficiais nacionais: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ), etc.",
                    ro: "Jurnale oficiale naționale: BGBl (DE), Moniteur belge / Belgisch Staatsblad (BE), Gazzetta Ufficiale (IT), BOE (ES), JORF (FR), Sbírka zákonů (CZ) etc.",
                  },
                  locale,
                )}
              </li>
            </ul>
          </CardContent>
        </Card>

        <WalkSteps kind="national" />
      </div>
    </GlossedProse>
  );
}
