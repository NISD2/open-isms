import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOg, type Locale } from "@/lib/seo";
import { pickLocalized } from "@/lib/locale";
import { routing } from "@/i18n/routing";
import { WikiPageJsonLd } from "@/components/wiki/WikiPageJsonLd";
import { WikiPageMeta } from "@/components/wiki/WikiPageMeta";
import { GlossedProse } from "@/components/wiki/GlossedProse";
import {
  getRegistrationPortals,
  getTranspositionStatus,
  type RegistrationPortal,
  type TranspositionStatus,
} from "@/lib/registration-portals";

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
  return (routing.locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as Locale)
    : "de";
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
      de: "Wo jeder EU-Mitgliedstaat bei der NIS 2 Umsetzung steht: nationales Gesetz, zuständige Behörde, nationales CSIRT, Stand. Stand Juni 2026.",
      en: "Where every EU Member State stands on NIS 2 transposition: national act, competent authority, national CSIRT, status. Reviewed June 2026.",
      fr: "Où en est chaque État membre de l'UE dans la transposition de NIS 2 : loi nationale, autorité compétente, CSIRT national, état d'avancement. Revu en juin 2026.",
      it: "A che punto è ogni Stato membro dell'UE nel recepimento di NIS 2: legge nazionale, autorità competente, CSIRT nazionale, stato. Verificato a giugno 2026.",
      es: "Dónde se encuentra cada Estado miembro de la UE en la transposición de NIS 2: ley nacional, autoridad competente, CSIRT nacional, estado. Revisado en junio de 2026.",
      pl: "Na jakim etapie wdrożenia NIS 2 jest każde państwo członkowskie UE: ustawa krajowa, organ właściwy, krajowy CSIRT, status. Zweryfikowano w czerwcu 2026.",
      cs: "Jak je na tom každý členský stát EU s transpozicí NIS 2: vnitrostátní zákon, příslušný orgán, vnitrostátní CSIRT, stav. Ověřeno v červnu 2026.",
      pt: "Em que ponto está cada Estado-Membro da UE na transposição da NIS 2: lei nacional, autoridade competente, CSIRT nacional, estado. Verificado em junho de 2026.",
      ro: "În ce stadiu se află fiecare stat membru al UE cu transpunerea NIS 2: lege națională, autoritate competentă, CSIRT național, stare. Verificat în iunie 2026.",
    },
    locale,
  );
  return {
    title,
    description,
    alternates: pageAlternates(
      "wiki/zeit-und-status/nis2-tracker-eu",
      locale,
    ),
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
  "drafting": {
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
  "unknown": {
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
      (r) =>
        r.transpositionStatus === "drafting" ||
        r.transpositionStatus === "unknown",
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
                de: "Wo jeder EU-Mitgliedstaat bei der NIS 2 Umsetzung steht. Nationales Gesetz, zuständige Behörde, nationales CSIRT, Stand. Stand Juni 2026.",
                en: "Where every EU Member State stands on the NIS 2 transposition. National act, competent authority, national CSIRT, status. Reviewed June 2026.",
                fr: "Où en est chaque État membre de l'UE dans la transposition de NIS 2. Loi nationale, autorité compétente, CSIRT national, état d'avancement. Revu en juin 2026.",
                it: "A che punto è ogni Stato membro dell'UE nel recepimento di NIS 2. Legge nazionale, autorità competente, CSIRT nazionale, stato. Verificato a giugno 2026.",
                es: "Dónde se encuentra cada Estado miembro de la UE en la transposición de NIS 2. Ley nacional, autoridad competente, CSIRT nacional, estado. Revisado en junio de 2026.",
                pl: "Na jakim etapie wdrożenia NIS 2 jest każde państwo członkowskie UE. Ustawa krajowa, organ właściwy, krajowy CSIRT, status. Zweryfikowano w czerwcu 2026.",
                cs: "Jak je na tom každý členský stát EU s transpozicí NIS 2. Vnitrostátní zákon, příslušný orgán, vnitrostátní CSIRT, stav. Ověřeno v červnu 2026.",
                pt: "Em que ponto está cada Estado-Membro da UE na transposição da NIS 2. Lei nacional, autoridade competente, CSIRT nacional, estado. Verificado em junho de 2026.",
                ro: "În ce stadiu se află fiecare stat membru al UE cu transpunerea NIS 2. Lege națională, autoritate competentă, CSIRT național, stare. Verificat în iunie 2026.",
              },
              locale,
            )}
          </p>
        </header>

        <WikiPageMeta
          authorSlug="simon-orzel"
          locale={
            locale === "de" || locale === "en" || locale === "nl"
              ? locale
              : "en"
          }
          lastReviewedAt="2026-06-01"
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
                de: "Die Umsetzungsfrist vom 17. Oktober 2024 aus Artikel 41 NIS 2 ist verstrichen. Wenige Mitgliedstaaten waren rechtzeitig (Italien, Belgien, Ungarn, Kroatien, Rumänien). Die meisten sind noch im Gesetzgebungsverfahren, einschließlich der vier größten Volkswirtschaften (Deutschland, Frankreich, Spanien, Niederlande). Die Europäische Kommission hat im Mai 2025 Vertragsverletzungsverfahren gegen die säumigen Mitgliedstaaten eröffnet.",
                en: "The 17 October 2024 transposition deadline set in Article 41 NIS 2 has come and gone. A few Member States moved fast (Italy, Belgium, Hungary, Croatia, Romania). Most are still in legislative process, including the four biggest economies (Germany, France, Spain, Netherlands). The European Commission opened infringement procedures in May 2025 against the late ones.",
                fr: "Le délai de transposition du 17 octobre 2024 fixé à l'article 41 NIS 2 est dépassé. Quelques États membres ont agi rapidement (Italie, Belgique, Hongrie, Croatie, Roumanie). La plupart sont encore en procédure législative, y compris les quatre plus grandes économies (Allemagne, France, Espagne, Pays-Bas). La Commission européenne a ouvert des procédures d'infraction en mai 2025 contre les États en retard.",
                it: "Il termine di recepimento del 17 ottobre 2024 fissato dall'articolo 41 NIS 2 è scaduto. Pochi Stati membri si sono mossi rapidamente (Italia, Belgio, Ungheria, Croazia, Romania). La maggior parte è ancora in iter legislativo, comprese le quattro maggiori economie (Germania, Francia, Spagna, Paesi Bassi). La Commissione europea ha aperto procedure di infrazione a maggio 2025 contro gli Stati in ritardo.",
                es: "El plazo de transposición del 17 de octubre de 2024 fijado en el artículo 41 NIS 2 ha vencido. Unos pocos Estados miembros actuaron con rapidez (Italia, Bélgica, Hungría, Croacia, Rumanía). La mayoría siguen en proceso legislativo, incluidas las cuatro mayores economías (Alemania, Francia, España, Países Bajos). La Comisión Europea abrió procedimientos de infracción en mayo de 2025 contra los Estados rezagados.",
                pl: "Termin transpozycji wyznaczony na 17 października 2024 r. w artykule 41 NIS 2 upłynął. Kilka państw członkowskich zadziałało szybko (Włochy, Belgia, Węgry, Chorwacja, Rumunia). Większość jest wciąż w procesie legislacyjnym, w tym cztery największe gospodarki (Niemcy, Francja, Hiszpania, Holandia). Komisja Europejska wszczęła w maju 2025 r. postępowania w sprawie uchybienia zobowiązaniom wobec spóźnionych państw.",
                cs: "Lhůta pro transpozici stanovená na 17. října 2024 v článku 41 NIS 2 uplynula. Několik členských států jednalo rychle (Itálie, Belgie, Maďarsko, Chorvatsko, Rumunsko). Většina je stále v legislativním procesu, včetně čtyř největších ekonomik (Německo, Francie, Španělsko, Nizozemsko). Evropská komise zahájila v květnu 2025 řízení o nesplnění povinnosti proti opožděným státům.",
                pt: "O prazo de transposição de 17 de outubro de 2024 fixado no artigo 41.º da NIS 2 já terminou. Alguns Estados-Membros agiram com rapidez (Itália, Bélgica, Hungria, Croácia, Roménia). A maioria continua em processo legislativo, incluindo as quatro maiores economias (Alemanha, França, Espanha, Países Baixos). A Comissão Europeia abriu, em maio de 2025, processos por infração contra os Estados em atraso.",
                ro: "Termenul de transpunere de 17 octombrie 2024 stabilit la articolul 41 NIS 2 a expirat. Câteva state membre au acționat rapid (Italia, Belgia, Ungaria, Croația, România). Cele mai multe sunt încă în proces legislativ, inclusiv cele mai mari patru economii (Germania, Franța, Spania, Țările de Jos). Comisia Europeană a deschis în mai 2025 proceduri de constatare a neîndeplinirii obligațiilor împotriva statelor întârziate.",
              },
              locale,
            )}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {pick(
              {
                de: "Die Tabelle unten fasst je Mitgliedstaat das wesentliche nationale Gesetz, die federführende zuständige Behörde und das nationale CSIRT zusammen. Wo eine Vertiefung pro Land existiert, ist der Landesname verlinkt. Stand zum Prüfdatum; für das aktuellste belastbare Bild bleibt die ENISA NIS 2 Umsetzungsübersicht maßgeblich.",
                en: "The table below summarises the canonical national act, the lead competent authority and the national CSIRT for each Member State. Where we have a per-country deep dive, the country name links to it. Status as of the review date; check the ENISA NIS 2 transposition tracker for the latest verifiable picture.",
                fr: "Le tableau ci-dessous résume, pour chaque État membre, la loi nationale de référence, l'autorité compétente chef de file et le CSIRT national. Lorsqu'une analyse approfondie par pays existe, le nom du pays renvoie vers elle. État à la date de révision ; pour l'image vérifiable la plus récente, consultez le suivi de transposition NIS 2 de l'ENISA.",
                it: "La tabella seguente riassume, per ciascuno Stato membro, la legge nazionale di riferimento, l'autorità competente capofila e il CSIRT nazionale. Dove esiste un approfondimento per paese, il nome del paese rimanda a esso. Stato alla data di verifica; per il quadro verificabile più recente consultare il tracker di recepimento NIS 2 dell'ENISA.",
                es: "La tabla siguiente resume, para cada Estado miembro, la ley nacional de referencia, la autoridad competente principal y el CSIRT nacional. Cuando existe un análisis detallado por país, el nombre del país enlaza con él. Estado a la fecha de revisión; para la imagen verificable más reciente, consulte el rastreador de transposición NIS 2 de ENISA.",
                pl: "Poniższa tabela podsumowuje dla każdego państwa członkowskiego kluczową ustawę krajową, wiodący organ właściwy oraz krajowy CSIRT. Tam, gdzie istnieje pogłębiona analiza danego kraju, nazwa kraju jest do niej odnośnikiem. Status na dzień weryfikacji; najbardziej aktualny, wiarygodny obraz zapewnia tracker transpozycji NIS 2 prowadzony przez ENISA.",
                cs: "Následující tabulka shrnuje pro každý členský stát klíčový vnitrostátní zákon, vedoucí příslušný orgán a vnitrostátní CSIRT. Tam, kde existuje podrobný rozbor dané země, je název země odkazem na něj. Stav k datu ověření; nejaktuálnější ověřitelný obraz poskytuje tracker transpozice NIS 2 od ENISA.",
                pt: "A tabela abaixo resume, para cada Estado-Membro, a lei nacional de referência, a autoridade competente principal e o CSIRT nacional. Quando existe uma análise aprofundada por país, o nome do país remete para ela. Estado à data de revisão; para o panorama verificável mais recente, consulte a monitorização da transposição da NIS 2 da ENISA.",
                ro: "Tabelul de mai jos rezumă, pentru fiecare stat membru, legea națională de referință, autoritatea competentă principală și CSIRT-ul național. Acolo unde există o analiză detaliată pe țară, numele țării face trimitere la aceasta. Stare la data verificării; pentru imaginea verificabilă cea mai recentă, consultați monitorul transpunerii NIS 2 al ENISA.",
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
                const statusLabel = pick(
                  STATUS_LABELS[r.transpositionStatus],
                  locale,
                );
                return (
                  <tr key={r.countryCode} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-baseline gap-2">
                        <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 text-[10px] font-mono tracking-wide text-muted-foreground">
                          {r.countryCode}
                        </span>
                        {r.wikiSlug ? (
                          <Link
                            href={
                              `/wiki/zeit-und-status/${r.wikiSlug}` as never
                            }
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.authority}
                    </p>
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
                ENISA NIS 2 transposition tracker: enisa.europa.eu/topics/nis-directive
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {pick(
                  {
                    de: "Europäische Kommission, Vertragsverletzungsverfahren gegen Mitgliedstaaten ohne vollständige Mitteilung der NIS 2 Umsetzung (November 2024, mit Gründen versehene Stellungnahmen Mai 2025).",
                    en: "European Commission, infringement procedures opened against Member States that did not communicate full transposition of NIS 2 (November 2024, reasoned opinions May 2025).",
                    fr: "Commission européenne, procédures d'infraction ouvertes contre les États membres n'ayant pas communiqué la transposition complète de NIS 2 (novembre 2024, avis motivés en mai 2025).",
                    it: "Commissione europea, procedure di infrazione avviate contro gli Stati membri che non hanno comunicato il recepimento completo di NIS 2 (novembre 2024, pareri motivati maggio 2025).",
                    es: "Comisión Europea, procedimientos de infracción abiertos contra los Estados miembros que no comunicaron la transposición completa de NIS 2 (noviembre de 2024, dictámenes motivados en mayo de 2025).",
                    pl: "Komisja Europejska, postępowania w sprawie uchybienia zobowiązaniom wszczęte wobec państw członkowskich, które nie zgłosiły pełnej transpozycji NIS 2 (listopad 2024, uzasadnione opinie maj 2025).",
                    cs: "Evropská komise, řízení o nesplnění povinnosti zahájená proti členským státům, které neoznámily úplnou transpozici NIS 2 (listopad 2024, odůvodněná stanoviska květen 2025).",
                    pt: "Comissão Europeia, processos por infração abertos contra os Estados-Membros que não comunicaram a transposição completa da NIS 2 (novembro de 2024, pareceres fundamentados em maio de 2025).",
                    ro: "Comisia Europeană, proceduri de constatare a neîndeplinirii obligațiilor deschise împotriva statelor membre care nu au comunicat transpunerea completă a NIS 2 (noiembrie 2024, avize motivate mai 2025).",
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

        {/* CTA */}
        <Card>
          <CardHeader>
            <CardTitle>
              {pick(
                {
                  de: "Anwendbarkeitsprüfung starten",
                  en: "Run the applicability check for your entity",
                  fr: "Lancez le test d'applicabilité pour votre entité",
                  it: "Esegui il test di applicabilità per la tua entità",
                  es: "Ejecute la comprobación de aplicabilidad para su entidad",
                  pl: "Uruchom test stosowalności dla swojego podmiotu",
                  cs: "Spusťte test použitelnosti pro svůj subjekt",
                  pt: "Execute o teste de aplicabilidade para a sua entidade",
                  ro: "Rulați testul de aplicabilitate pentru entitatea dumneavoastră",
                },
                locale,
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {pick(
                {
                  de: "Die Anwendbarkeitsprüfung läuft gegen die EU-Richtlinie. Das Ergebnis gilt unabhängig davon, welche nationale Umsetzung in Ihrem Land bereits in Kraft ist.",
                  en: "The applicability check works against the EU directive, so the answer holds regardless of which national transposition is in force in your country yet.",
                  fr: "Le test d'applicabilité s'appuie sur la directive européenne. Le résultat reste valable quelle que soit la transposition nationale déjà en vigueur dans votre pays.",
                  it: "Il test di applicabilità si basa sulla direttiva dell'UE. Il risultato resta valido indipendentemente da quale recepimento nazionale sia già in vigore nel tuo paese.",
                  es: "La comprobación de aplicabilidad se basa en la directiva de la UE. El resultado es válido independientemente de la transposición nacional que ya esté en vigor en su país.",
                  pl: "Test stosowalności opiera się na dyrektywie UE. Wynik obowiązuje niezależnie od tego, która transpozycja krajowa już obowiązuje w Twoim kraju.",
                  cs: "Test použitelnosti vychází ze směrnice EU. Výsledek platí bez ohledu na to, která vnitrostátní transpozice již ve vaší zemi platí.",
                  pt: "O teste de aplicabilidade baseia-se na diretiva da UE. O resultado é válido independentemente de qual transposição nacional já esteja em vigor no seu país.",
                  ro: "Testul de aplicabilitate se bazează pe directiva UE. Rezultatul rămâne valabil indiferent de transpunerea națională care este deja în vigoare în țara dumneavoastră.",
                },
                locale,
              )}
            </p>
            <div className="mt-4">
              <Link
                href="/applicability"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {pick(
                  {
                    de: "Anwendbarkeitsprüfung öffnen",
                    en: "Open the applicability check",
                    fr: "Ouvrir le test d'applicabilité",
                    it: "Apri il test di applicabilità",
                    es: "Abrir la comprobación de aplicabilidad",
                    pl: "Otwórz test stosowalności",
                    cs: "Otevřít test použitelnosti",
                    pt: "Abrir o teste de aplicabilidade",
                    ro: "Deschideți testul de aplicabilitate",
                  },
                  locale,
                )}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </GlossedProse>
  );
}
