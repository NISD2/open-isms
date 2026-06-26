/**
 * Wiki table of contents.
 *
 * Source of truth for:
 *   - The /wiki hub + 8 category index pages.
 *   - The next-intl pathnames map for /wiki/<category>/<slug> (per locale).
 *   - The LEGACY_REDIRECTS entries (per locale, both old slugs and the
 *     short-lived /docs paths from the first iteration of this hub).
 *
 * Hand-maintained — when a page moves under /wiki, add its entry here AND
 * the legacy redirect derivation in lib/content/legacy-redirects.ts will
 * pick it up automatically.
 *
 * Per-locale slugs reuse the EN/NL translations that already existed in
 * i18n/routing.ts before the migration so existing SEO authority on the
 * EN and NL slugs is preserved.
 *
 * Publish schedule: an entry may also have a future publishAt slot in
 * lib/content/wiki-publish-schedule.json. Sitemap, hub, category index
 * and per-page guards filter those out until their time comes. See
 * lib/content/wiki-publish-schedule.ts.
 */

import { isPublished } from "./wiki-publish-schedule";

export const WIKI_TOP_LEVEL = [
  "anwendungsbereich",
  "sektoren",
  "grundlagen",
  "umsetzung",
  "recht-und-folgen",
  "vergleich",
  "zeit-und-status",
  "troubleshooting",
] as const;

export type WikiTopLevel = (typeof WIKI_TOP_LEVEL)[number];

export interface PerLocaleSlug {
  de: string;
  en: string;
  nl: string;
}

/**
 * Audience role hints. Drives future per-audience filtering UI and
 * the `audience.educationalRole` slot in schema.org TechArticle.
 */
export type AudienceRole =
  | "ceo"
  | "ciso"
  | "it-leiter"
  | "procurement"
  | "lawyer"
  | "auditor"
  | "consultant"
  | "compliance"
  | "soc"
  | "dpo"
  | "hr";

/**
 * Sector tag. Drives sector-specific filtering / "NIS 2 for X" landing
 * pages, and `Audience.geographicArea` + `Audience.audienceType` in
 * the per-page TechArticle JSON-LD.
 */
export type SectorTag =
  | "stadtwerke"
  | "energie"
  | "wasser"
  | "abfall"
  | "krankenhaus"
  | "lebensmittel"
  | "logistik"
  | "maschinenbau"
  | "msp"
  | "cloud"
  | "rechenzentrum"
  | "bank"
  | "banking"
  | "versicherung"
  | "telekom"
  | "verwaltung"
  | "transport"
  | "space"
  | "research";

export interface WikiTocEntry {
  /** Canonical (German) slug. Used as the directory name and the canonical URL path key. */
  slug: string;
  /** Localized slugs. de mirrors `slug`; en and nl are real translations. */
  slugs: PerLocaleSlug;
  titleDe: string;
  titleEn?: string;
  summaryDe: string;
  summaryEn?: string;

  // ── Growth-future fields (all optional, additive). ──────────────
  // These are declared now so the 33 hand-curated entries and any
  // future ~450 generated entries share the same shape. Renaming or
  // adding required fields after content lands would be brutal.

  /**
   * Cross-cutting tags. Formats:
   *   - "topic:fines"            (general topic)
   *   - "regulation:nis2"        (regulation reference)
   *   - "regulation:cir-2024-2690"
   *   - "audience:ceo"           (target role)
   *   - "sector:stadtwerke"      (sector)
   *   - "type:checklist"         (content shape)
   *   - "level:beginner"         (skill / proficiency)
   * Used for future tag landing pages and "see also" suggestions.
   */
  tags?: string[];

  /**
   * Soft grouping within a category for UI rendering. Lets a
   * category page split its entries into sub-sections without
   * requiring a new URL path segment. e.g. inside /wiki/umsetzung,
   * we can render "Anleitungen", "Felder erklärt", "Checklisten"
   * as visual groups while keeping URLs flat.
   */
  subCategory?: string;

  /** Primary sector this page targets, if sector-specific. */
  targetSector?: SectorTag;

  /** Audience roles the page is primarily written for. */
  audience?: AudienceRole[];

  /**
   * Slugs of other wiki entries shown as "see also". Each entry
   * refers to another WikiTocEntry.slug. Keep at 3-5 for relevance.
   */
  relatedSlugs?: string[];

  /**
   * ISO 8601 date of last editorial review. Drives the visible
   * "Last reviewed" line on the page and the `Article.dateModified`
   * + `WebPage.lastReviewed` schema.org fields. Schema research:
   * never fake this — Google penalises stale dates with no content
   * change.
   */
  lastReviewedAt?: string;

  /**
   * Author byline slug. Used by the schedule script to rotate Simon
   * and Cory across the release calendar, and by per-page metadata
   * components to pick the avatar / link target. Defaults to
   * "simon-orzel" when omitted.
   */
  authorSlug?: "simon-orzel" | "cory-hisey";
}

export interface WikiCategoryMeta {
  slug: WikiTopLevel;
  /** Localized category slug for the URL. */
  slugs: PerLocaleSlug;
  titleDe: string;
  titleEn: string;
  questionDe: string;
  questionEn: string;
  entries: WikiTocEntry[];
}

const CATEGORY_SLUGS: Record<WikiTopLevel, PerLocaleSlug> = {
  anwendungsbereich: {
    de: "anwendungsbereich",
    en: "scope",
    nl: "toepassingsgebied",
  },
  sektoren: { de: "sektoren", en: "sectors", nl: "sectoren" },
  grundlagen: { de: "grundlagen", en: "fundamentals", nl: "grondbeginselen" },
  umsetzung: { de: "umsetzung", en: "implementation", nl: "implementatie" },
  "recht-und-folgen": {
    de: "recht-und-folgen",
    en: "law-and-consequences",
    nl: "recht-en-gevolgen",
  },
  vergleich: { de: "vergleich", en: "comparison", nl: "vergelijking" },
  "zeit-und-status": {
    de: "zeit-und-status",
    en: "timelines-and-status",
    nl: "tijdlijnen-en-status",
  },
  troubleshooting: {
    de: "troubleshooting",
    en: "troubleshooting",
    nl: "probleemoplossing",
  },
};

function de(slug: string): PerLocaleSlug {
  return { de: slug, en: slug, nl: slug };
}

export const WIKI_TOC: Record<WikiTopLevel, WikiCategoryMeta> = {
  anwendungsbereich: {
    slug: "anwendungsbereich",
    slugs: CATEGORY_SLUGS.anwendungsbereich,
    titleDe: "Anwendungsbereich",
    titleEn: "Scope",
    questionDe: "Bin ich überhaupt betroffen?",
    questionEn: "Am I in scope at all?",
    entries: [
      {
        slug: "nis2-einrichtungen",
        slugs: { de: "nis2-einrichtungen", en: "nis2-entities", nl: "nis2-entiteiten" },
        titleDe: "Wesentliche und wichtige Einrichtungen",
        titleEn: "Essential and important entities",
        summaryDe: "Wer fällt in welche Kategorie? Anhang I vs Anhang II, Größenkriterien, Sonderfälle.",
        summaryEn: "Who falls into which category? Annex I vs II, size thresholds, edge cases.",
      },
      {
        slug: "nis2-registrierung",
        slugs: { de: "nis2-registrierung", en: "nis2-registration", nl: "nis2-registratie" },
        titleDe: "BSI-Registrierung",
        titleEn: "BSI registration",
        summaryDe: "Was Sie für die Selbstregistrierung beim BSI brauchen und wie das Portal funktioniert.",
        summaryEn: "What you need for BSI self-registration and how the portal works.",
      },
      {
        slug: "nis2-mehrere-eu-laender",
        slugs: { de: "nis2-mehrere-eu-laender", en: "nis2-multi-country", nl: "nis2-meerdere-landen" },
        titleDe: "NIS 2 in mehreren EU-Ländern",
        titleEn: "NIS 2 across multiple EU countries",
        summaryDe: "Konzern mit Niederlassungen in mehreren Mitgliedstaaten — wo registrieren, wer ist zuständig?",
        summaryEn: "Group with branches in multiple member states — where to register, who supervises?",
      },
      {
        slug: "konzern-it-msp",
        slugs: { de: "konzern-it-msp", en: "group-it-internal-msp", nl: "concern-it-interne-msp" },
        titleDe: "Konzern-IT als interner MSP unter NIS 2",
        titleEn: "Group IT as internal MSP under NIS 2",
        summaryDe: "Wenn die zentrale IT-Abteilung eines Konzerns Dienste an Tochtergesellschaften erbringt — ist sie damit ein Anbieter verwalteter Dienste nach NIS 2 Anhang I?",
        summaryEn: "When the central IT department serves group subsidiaries — does that make it a managed service provider under NIS 2 Annex I?",
        tags: [
          "regulation:nis2",
          "topic:scope",
          "topic:annex-1",
          "audience:ceo",
          "audience:it-leiter",
          "level:intermediate",
        ],
        subCategory: "Konzernstrukturen",
        audience: ["ceo", "it-leiter", "lawyer"],
        relatedSlugs: ["nis2-einrichtungen", "tochtergesellschaft-holding-nis2"],
      },
      {
        slug: "zulieferer-keine-einrichtung",
        slugs: {
          de: "zulieferer-keine-einrichtung",
          en: "suppliers-not-in-scope",
          nl: "leveranciers-niet-in-scope",
        },
        titleDe: "Zulieferer sind keine NIS 2 Einrichtungen kraft Belieferung",
        titleEn: "Suppliers are not NIS 2 entities by virtue of supplying one",
        summaryDe: "Häufiger Irrtum: Wir beliefern ein NIS-2-Unternehmen, also fallen wir auch unter NIS 2. Was Artikel 2 NIS 2 wirklich sagt.",
        summaryEn: "Common misreading: 'we supply a NIS 2 entity, so we are in scope.' What Article 2 NIS 2 actually says.",
        tags: [
          "regulation:nis2",
          "topic:scope",
          "topic:supply-chain",
          "audience:ceo",
          "audience:procurement",
          "level:beginner",
        ],
        subCategory: "Lieferantenkette",
        audience: ["ceo", "procurement", "lawyer"],
        relatedSlugs: ["nis2-einrichtungen", "nis2-lieferkette"],
      },
      {
        slug: "tochtergesellschaft-holding-nis2",
        slugs: {
          de: "tochtergesellschaft-holding-nis2",
          en: "subsidiary-holding-nis2",
          nl: "dochter-holding-nis2",
        },
        titleDe: "Tochtergesellschaft und Holding unter NIS 2",
        titleEn: "Subsidiaries and holding companies under NIS 2",
        summaryDe: "Wenn die Mutter unter NIS 2 fällt, fällt die Tochter automatisch mit? Nein. Wann sich der Anwendungsbereich aber doch fortpflanzt.",
        summaryEn: "If the parent is in scope, is the subsidiary automatically in scope too? No. But here is when scope does carry over.",
        tags: [
          "regulation:nis2",
          "topic:scope",
          "topic:corporate-structure",
          "audience:ceo",
          "audience:lawyer",
          "level:intermediate",
        ],
        subCategory: "Konzernstrukturen",
        audience: ["ceo", "lawyer"],
        relatedSlugs: ["nis2-einrichtungen", "konzern-it-msp"],
      },
      { slug: "bin-ich-krankenhaus-nis2", slugs: { de: "bin-ich-krankenhaus-nis2", en: "am-i-hospital-nis2", nl: "ben-ik-ziekenhuis-nis2" }, titleDe: "Bin ich als Krankenhaus von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a hospital?", summaryDe: "Anhang I Sektor 5: Wann ein Krankenhaus, eine Klinik oder ein MVZ unter NIS 2 fällt. Schwellenwerte, Sonderregeln, KRITIS-Überlapp.", summaryEn: "Annex I sector 5: when a hospital, clinic or care centre falls under NIS 2. Thresholds, special rules, KRITIS overlap.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:krankenhaus", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "krankenhaus", relatedSlugs: ["nis2-gesundheitswesen", "nis2-einrichtungen", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-stadtwerk-nis2", slugs: { de: "bin-ich-stadtwerk-nis2", en: "am-i-stadtwerk-nis2", nl: "ben-ik-stadtwerk-nis2" }, titleDe: "Bin ich als Stadtwerk von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a Stadtwerk?", summaryDe: "Energieversorger, Trinkwasser, Abwasser, Telekommunikation, oft alles in einem Stadtwerk. Welche Anhang-I-Sektoren greifen und wann KRITIS dazukommt.", summaryEn: "Energy, drinking water, waste water, telecommunications, often all under one Stadtwerk. Which Annex I sectors apply and when KRITIS kicks in.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:stadtwerke", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "stadtwerke", relatedSlugs: ["nis2-einrichtungen", "wer-ist-betroffen-vollstaendiger-test", "nis2-vs-kritis"] },
      { slug: "bin-ich-bank-nis2", slugs: { de: "bin-ich-bank-nis2", en: "am-i-bank-nis2", nl: "ben-ik-bank-nis2" }, titleDe: "Bin ich als Bank von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a bank?", summaryDe: "Anhang I Sektor 3 nennt Kreditinstitute. DORA verdrängt aber Artikel 21 und 23 für Finanzunternehmen. Was bleibt unter NIS 2.", summaryEn: "Annex I sector 3 names credit institutions. But DORA overrides Articles 21 and 23 for financial entities. What stays under NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:dora", "topic:scope", "sector:bank", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "bank", relatedSlugs: ["nis2-einrichtungen", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-telekom-anbieter-nis2", slugs: { de: "bin-ich-telekom-anbieter-nis2", en: "am-i-telecom-nis2", nl: "ben-ik-telecom-nis2" }, titleDe: "Bin ich als Telekommunikationsanbieter von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a telecoms provider?", summaryDe: "Anhang I Sektor 8 (digitale Infrastruktur) erfasst öffentliche elektronische Kommunikationsnetze und -dienste. Unabhängig von der Größe für bestimmte Anbieter.", summaryEn: "Annex I sector 8 (digital infrastructure) covers public electronic communications networks and services. Some providers in scope regardless of size.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:tkg", "topic:scope", "sector:telekom", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "telekom", relatedSlugs: ["nis2-einrichtungen", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "wer-ist-betroffen-vollstaendiger-test", slugs: { de: "wer-ist-betroffen-vollstaendiger-test", en: "who-is-in-scope-full-test", nl: "wie-is-in-scope-volledige-test" }, titleDe: "Wer ist von NIS 2 betroffen? Der vollständige Test", titleEn: "Who is in scope of NIS 2? The complete test", summaryDe: "Artikel 2 NIS 2: Sektor (Anhang I oder II) plus Größe (KMU-Schwelle) plus Ausnahmen unabhängig von der Größe plus Sonderfälle. Der ganze Anwendungsbereichstest.", summaryEn: "Article 2 NIS 2: sector (Annex I or II) plus size (SME threshold) plus regardless-of-size overrides plus special cases. The complete scope test.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:scope", "topic:applicability", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Vollständiger Test", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-einrichtungen", "tochtergesellschaft-holding-nis2", "zulieferer-keine-einrichtung"] },
      { slug: "bin-ich-energieversorger-nis2", slugs: { de: "bin-ich-energieversorger-nis2", en: "am-i-energy-provider-nis2", nl: "ben-ik-energieleverancier-nis2" }, titleDe: "Bin ich als Energieversorger von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as an energy provider?", summaryDe: "Anhang I Sektor 1: Strom, Gas, Wärme, Öl, Wasserstoff. Wann ein Erzeuger, Versorger oder Netzbetreiber unter NIS 2 fällt. Größenprüfung plus EnWG-Carve-out.", summaryEn: "Annex I sector 1: electricity, gas, heat, oil, hydrogen. When a producer, supplier or grid operator falls under NIS 2. Size test plus EnWG carve-out.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "regulation:enwg", "topic:scope", "sector:energie", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "energie", relatedSlugs: ["bin-ich-stadtwerk-nis2", "wer-ist-betroffen-vollstaendiger-test", "nis2-vs-kritis"] },
      { slug: "bin-ich-trinkwasserversorger-nis2", slugs: { de: "bin-ich-trinkwasserversorger-nis2", en: "am-i-drinking-water-provider-nis2", nl: "ben-ik-drinkwaterleverancier-nis2" }, titleDe: "Bin ich als Trinkwasserversorger von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a drinking water provider?", summaryDe: "Anhang I Sektor 6: Wer Trinkwasser liefert oder verteilt. Größenprüfung, KRITIS-Schwelle (22 Mio. m³ pro Jahr), Stadtwerk-Konstellation.", summaryEn: "Annex I sector 6: who supplies or distributes drinking water. Size test, KRITIS threshold (22 million m³/year), Stadtwerk constellation.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:wasser", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "wasser", relatedSlugs: ["bin-ich-stadtwerk-nis2", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-abwasserentsorger-nis2", slugs: { de: "bin-ich-abwasserentsorger-nis2", en: "am-i-waste-water-operator-nis2", nl: "ben-ik-afvalwateroperator-nis2" }, titleDe: "Bin ich als Abwasserentsorger von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a waste water operator?", summaryDe: "Anhang I Sektor 7: Unternehmen, die kommunales, häusliches oder industrielles Abwasser sammeln, entsorgen oder behandeln. Größenprüfung, KRITIS-Schwelle (500.000 Einwohnerwerte).", summaryEn: "Annex I sector 7: undertakings collecting, disposing of or treating urban, domestic or industrial waste water. Size test, KRITIS threshold (500,000 population equivalents).", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:wasser", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "wasser", relatedSlugs: ["bin-ich-stadtwerk-nis2", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-msp-managed-service-provider", slugs: { de: "bin-ich-msp-managed-service-provider", en: "am-i-msp-nis2", nl: "ben-ik-msp-nis2" }, titleDe: "Bin ich als MSP (Managed Service Provider) von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a Managed Service Provider?", summaryDe: "Anhang I Sektor 9 (Verwaltung von IKT-Diensten B2B): wann ein MSP unter NIS 2 fällt, Definition aus Art. 6(40), Größenprüfung.", summaryEn: "Annex I sector 9 (ICT service management B2B): when an MSP falls under NIS 2, Article 6(40) definition, size test.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:msp", "audience:ceo", "audience:it-leiter", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "it-leiter"], targetSector: "msp", relatedSlugs: ["konzern-it-msp", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-cloud-anbieter-nis2", slugs: { de: "bin-ich-cloud-anbieter-nis2", en: "am-i-cloud-provider-nis2", nl: "ben-ik-cloudaanbieder-nis2" }, titleDe: "Bin ich als Cloud-Anbieter von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a cloud provider?", summaryDe: "Anhang I Sektor 8 (digitale Infrastruktur): Anbieter von Cloud-Computing-Diensten. Definition aus Art. 6(30), Größenprüfung, CIR-Anwendung.", summaryEn: "Annex I sector 8 (digital infrastructure): providers of cloud computing services. Art. 6(30) definition, size test, CIR applicability.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:scope", "sector:cloud", "audience:ceo", "audience:it-leiter", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "it-leiter"], targetSector: "cloud", relatedSlugs: ["bin-ich-rechenzentrum-nis2", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-rechenzentrum-nis2", slugs: { de: "bin-ich-rechenzentrum-nis2", en: "am-i-data-centre-nis2", nl: "ben-ik-datacenter-nis2" }, titleDe: "Bin ich als Rechenzentrum von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a data centre?", summaryDe: "Anhang I Sektor 8: Anbieter von Rechenzentrumsdiensten. Definition aus Art. 6(31), Größenprüfung, KRITIS-Schwelle (3,5 MW).", summaryEn: "Annex I sector 8: providers of data centre services. Art. 6(31) definition, size test, KRITIS threshold (3.5 MW).", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:scope", "sector:rechenzentrum", "audience:ceo", "audience:it-leiter", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "it-leiter"], targetSector: "rechenzentrum", relatedSlugs: ["bin-ich-cloud-anbieter-nis2", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-medizinprodukte-hersteller-nis2", slugs: { de: "bin-ich-medizinprodukte-hersteller-nis2", en: "am-i-medical-device-manufacturer-nis2", nl: "ben-ik-medische-hulpmiddelen-fabrikant-nis2" }, titleDe: "Bin ich als Medizinprodukte-Hersteller von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a medical device manufacturer?", summaryDe: "Anhang I Sektor 5 (kritische Medizinprodukte) oder Anhang II Sektor 5 (Medizinprodukte allgemein). MDR/IVDR-Schnittmenge, Größenprüfung.", summaryEn: "Annex I sector 5 (critical medical devices) or Annex II sector 5 (medical devices generally). MDR/IVDR overlap, size test.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:krankenhaus", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], relatedSlugs: ["bin-ich-krankenhaus-nis2", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "bin-ich-maschinenbauer-nis2", slugs: { de: "bin-ich-maschinenbauer-nis2", en: "am-i-machinery-manufacturer-nis2", nl: "ben-ik-machinebouwer-nis2" }, titleDe: "Bin ich als Maschinenbauer von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a machinery manufacturer?", summaryDe: "Anhang II Sektor 5 (verarbeitendes Gewerbe): Maschinenbau nach NACE C28. Größenprüfung, OT/IT-Konvergenz, Lieferantenpflichten.", summaryEn: "Annex II sector 5 (manufacturing): machinery per NACE C28. Size test, OT/IT convergence, supplier obligations.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:maschinenbau", "audience:ceo", "audience:it-leiter", "level:beginner"], subCategory: "Sektor-Test", audience: ["ceo", "it-leiter"], targetSector: "maschinenbau", relatedSlugs: ["nis2-produzierendes-gewerbe", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "nis2-hauptsitz-ausserhalb-eu", slugs: { de: "nis2-hauptsitz-ausserhalb-eu", en: "nis2-headquarters-outside-eu", nl: "nis2-hoofdkantoor-buiten-eu" }, titleDe: "Gilt NIS 2 für mich, obwohl mein Hauptsitz außerhalb der EU liegt?", titleEn: "Does NIS 2 apply to me even though my headquarters are outside the EU?", summaryDe: "Artikel 26 NIS 2: Hauptniederlassung in der EU, Vertretungspflicht für Drittstaaten-Anbieter, ENISA-Verzeichnis. Wann eine US-Firma trotzdem unter NIS 2 fällt.", summaryEn: "Article 26 NIS 2: main establishment in the EU, representative duty for third-country providers, ENISA registry. When a US company still falls under NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:scope", "topic:extraterritorial", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Geltungsbereich", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-mehrere-eu-laender", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "nis2-kleinstunternehmen-ausnahme", slugs: { de: "nis2-kleinstunternehmen-ausnahme", en: "nis2-microenterprise-exemption", nl: "nis2-micro-onderneming-uitzondering" }, titleDe: "Bin ich als Kleinstunternehmen von NIS 2 ausgenommen?", titleEn: "Am I exempt from NIS 2 as a microenterprise?", summaryDe: "Artikel 2(1) NIS 2 und Empfehlung 2003/361/EG: Kleinstunternehmen sind grundsätzlich ausgenommen, aber Artikel 2(2) reicht-of-size-Klauseln holen viele zurück.", summaryEn: "Article 2(1) NIS 2 and Recommendation 2003/361/EC: microenterprises are exempt by default, but Article 2(2) regardless-of-size clauses pull many back in.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:scope", "topic:size-threshold", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Geltungsbereich", audience: ["ceo", "lawyer"], relatedSlugs: ["wer-ist-betroffen-vollstaendiger-test", "nis2-einrichtungen"] },
      { slug: "bin-ich-oeffentliche-verwaltung-nis2", slugs: { de: "bin-ich-oeffentliche-verwaltung-nis2", en: "am-i-public-administration-nis2", nl: "ben-ik-overheid-nis2" }, titleDe: "Bin ich als öffentliche Verwaltung von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as public administration?", summaryDe: "Anhang I Sektor 10 plus Artikel 2(2)(i) plus Artikel 2(4)-(11) Ausnahmen: Bundes-, Landes- und Kommunalverwaltung, nationale Sicherheit, Justiz, Parlamente, Zentralbanken.", summaryEn: "Annex I sector 10 plus Article 2(2)(i) plus Article 2(4)-(11) carve-outs: federal, state and municipal administration, national security, judiciary, parliaments, central banks.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "sector:verwaltung", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], targetSector: "verwaltung", relatedSlugs: ["wer-ist-betroffen-vollstaendiger-test", "nis2-einrichtungen"] },
      { slug: "bin-ich-vertrauensdiensteanbieter-nis2", slugs: { de: "bin-ich-vertrauensdiensteanbieter-nis2", en: "am-i-trust-service-provider-nis2", nl: "ben-ik-vertrouwensdienstverlener-nis2" }, titleDe: "Bin ich als Vertrauensdiensteanbieter von NIS 2 betroffen?", titleEn: "Am I in scope of NIS 2 as a trust service provider?", summaryDe: "Anhang I Sektor 8 plus Artikel 2(2)(b): Vertrauensdiensteanbieter (eIDAS) sind unabhängig von der Größe erfasst. Auch ein 5-Personen-Anbieter ist drin.", summaryEn: "Annex I sector 8 plus Article 2(2)(b): trust service providers (eIDAS) are in scope regardless of size. Even a 5-person provider is in.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:eidas", "topic:scope", "topic:regardless-of-size", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Sektor-Test", audience: ["ceo", "lawyer"], relatedSlugs: ["wer-ist-betroffen-vollstaendiger-test", "bin-ich-telekom-anbieter-nis2"] },
      { slug: "nis2-selbsteinstufung", slugs: { de: "nis2-selbsteinstufung", en: "nis2-self-classification", nl: "nis2-zelf-classificatie" }, titleDe: "Selbsteinstufung nach NIS 2 — kein Brief vom BSI ist keine Verteidigung", titleEn: "Self-classification under NIS 2 — silence from the BSI is not a defence", summaryDe: "Die Pflicht zur Prüfung liegt auf der Einrichtung. Art. 27 NIS 2 + §33 BSIG. Die 3-Monats-Frist läuft mit Erfüllung der Voraussetzungen, nicht mit einer Mitteilung.", summaryEn: "The duty to assess sits with the entity. Art. 27 NIS 2 + §33 BSIG. The three-month clock starts when the conditions are met, not when a letter arrives.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:scope", "topic:self-classification", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "Geltungsbereich", audience: ["ceo", "lawyer"], relatedSlugs: ["wer-ist-betroffen-vollstaendiger-test", "nis2-registrierung", "nis2-einrichtungen"] },
    ],
  },
  sektoren: {
    slug: "sektoren",
    slugs: CATEGORY_SLUGS.sektoren,
    titleDe: "Sektoren",
    titleEn: "Sectors",
    questionDe: "Was bedeutet NIS 2 für meine Branche konkret?",
    questionEn: "What does NIS 2 mean for my sector?",
    entries: [
      {
        slug: "nis2-abfallwirtschaft",
        slugs: { de: "nis2-abfallwirtschaft", en: "nis2-waste-management", nl: "nis2-afvalbeheer" },
        titleDe: "NIS 2 für die Abfallwirtschaft",
        titleEn: "NIS 2 for waste management",
        summaryDe: "Anhang II Sektor: welche Abfallbetriebe fallen rein, was ist konkret zu tun.",
        summaryEn: "Annex II sector: which waste operators are in scope, what needs to be done.",
      },
      {
        slug: "nis2-gesundheitswesen",
        slugs: { de: "nis2-gesundheitswesen", en: "nis2-healthcare", nl: "nis2-gezondheidszorg" },
        titleDe: "NIS 2 für das Gesundheitswesen",
        titleEn: "NIS 2 for healthcare",
        summaryDe: "Krankenhäuser, Pflegeheime, Apotheken — Schwellenwerte und Anforderungen.",
        summaryEn: "Hospitals, care homes, pharmacies — thresholds and requirements.",
      },
      {
        slug: "nis2-lebensmittel",
        slugs: { de: "nis2-lebensmittel", en: "nis2-food", nl: "nis2-voeding" },
        titleDe: "NIS 2 für die Lebensmittelbranche",
        titleEn: "NIS 2 for food and beverage",
        summaryDe: "Hersteller und Großhandel im Lebensmittelsektor — wann gelten die Pflichten.",
        summaryEn: "Manufacturers and wholesalers in food — when the obligations apply.",
      },
      {
        slug: "nis2-logistik",
        slugs: { de: "nis2-logistik", en: "nis2-logistics", nl: "nis2-logistiek" },
        titleDe: "NIS 2 für Logistik",
        titleEn: "NIS 2 for logistics",
        summaryDe: "Spediteure, Kurierdienste, Logistikdienstleister unter NIS 2.",
        summaryEn: "Freight forwarders, couriers, logistics service providers under NIS 2.",
      },
      {
        slug: "nis2-produzierendes-gewerbe",
        slugs: { de: "nis2-produzierendes-gewerbe", en: "nis2-manufacturing", nl: "nis2-productie" },
        titleDe: "NIS 2 für das produzierende Gewerbe",
        titleEn: "NIS 2 for manufacturing",
        summaryDe: "Maschinenbau, Elektrotechnik, Medizinprodukte, Fahrzeugbau — Anhang II Praxis.",
        summaryEn: "Mechanical engineering, electrical engineering, medical devices, automotive.",
        tags: [
          "regulation:nis2",
          "sector:maschinenbau",
          "topic:annex-2",
          "topic:ot-it-convergence",
          "audience:ceo",
          "audience:it-leiter",
        ],
        targetSector: "maschinenbau",
        audience: ["ceo", "it-leiter"],
        relatedSlugs: ["nis2-einrichtungen", "nis2-lieferkette"],
      },
      { slug: "nis2-bankwesen", slugs: { de: "nis2-bankwesen", en: "nis2-banking", nl: "nis2-bankwezen" }, titleDe: "NIS 2 im Bankwesen", titleEn: "NIS 2 in banking", summaryDe: "Anhang I Sektor 4: Banken, Zahlungsinstitute, das DORA-Verhältnis und die NIS 2 Registrierung trotz Lex specialis.", summaryEn: "Annex I sector 4: banks, payment institutions, the DORA interplay and NIS 2 registration despite lex specialis.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:dora", "topic:annex-1", "sector:banking", "audience:ceo", "audience:ciso", "level:intermediate"], subCategory: "Sektor-Deep-Dive", targetSector: "banking", audience: ["ceo", "ciso"], relatedSlugs: ["bin-ich-bank-nis2", "nis2-vs-dora-finanzsektor"] },
      { slug: "nis2-verkehr", slugs: { de: "nis2-verkehr", en: "nis2-transport", nl: "nis2-vervoer" }, titleDe: "NIS 2 im Verkehrssektor", titleEn: "NIS 2 in transport", summaryDe: "Anhang I Sektor 2: Luft-, Schienen-, Wasser- und Straßenverkehr unter NIS 2 und die KRITIS-Überlappung.", summaryEn: "Annex I sector 2: air, rail, water and road transport under NIS 2 and the KRITIS overlap.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:annex-1", "sector:transport", "audience:ceo", "audience:ciso", "level:intermediate"], subCategory: "Sektor-Deep-Dive", targetSector: "transport", audience: ["ceo", "ciso"], relatedSlugs: ["nis2-einrichtungen", "nis2-logistik"] },
      { slug: "nis2-raumfahrt", slugs: { de: "nis2-raumfahrt", en: "nis2-space", nl: "nis2-ruimtevaart" }, titleDe: "NIS 2 in der Raumfahrt", titleEn: "NIS 2 in space", summaryDe: "Anhang I Sektor 11: Raumfahrtbetreiber, Bodendienste und der Abstand zu Herstellern und Forschung.", summaryEn: "Annex I sector 11: space operators, ground services and the line away from manufacturers and research.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:annex-1", "sector:space", "audience:ceo", "audience:ciso", "level:intermediate"], subCategory: "Sektor-Deep-Dive", targetSector: "space", audience: ["ceo", "ciso"], relatedSlugs: ["nis2-einrichtungen", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "nis2-forschungseinrichtungen", slugs: { de: "nis2-forschungseinrichtungen", en: "nis2-research-organisations", nl: "nis2-onderzoeksinstellingen" }, titleDe: "NIS 2 in Forschungseinrichtungen", titleEn: "NIS 2 for research organisations", summaryDe: "Anhang II Sektor 10: welche Forschungseinrichtungen erfasst sind und welche Ausnahmen gelten.", summaryEn: "Annex II sector 10: which research organisations are in scope and which exemptions apply.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:annex-2", "sector:research", "audience:ceo", "audience:ciso", "level:intermediate"], subCategory: "Sektor-Deep-Dive", targetSector: "research", audience: ["ceo", "ciso"], relatedSlugs: ["nis2-einrichtungen", "wer-ist-betroffen-vollstaendiger-test"] },
    ],
  },
  grundlagen: {
    slug: "grundlagen",
    slugs: CATEGORY_SLUGS.grundlagen,
    titleDe: "Grundlagen",
    titleEn: "Fundamentals",
    questionDe: "Was bedeutet das eigentlich alles?",
    questionEn: "What does it all actually mean?",
    entries: [
      {
        slug: "what-is-nis2",
        slugs: { de: "what-is-nis2", en: "what-is-nis2", nl: "wat-is-nis2" },
        titleDe: "Was ist NIS 2?",
        titleEn: "What is NIS 2?",
        summaryDe: "EU-Richtlinie 2022/2555 in fünf Minuten erklärt.",
        summaryEn: "EU Directive 2022/2555 explained in five minutes.",
      },
      {
        slug: "bsig-30",
        slugs: { de: "bsig-30", en: "bsig-30", nl: "bsig-30" },
        titleDe: "§ 30 BSIG: die zehn Maßnahmen für Cybersicherheit",
        titleEn: "Section 30 BSIG: the ten cybersecurity measures",
        summaryDe: "Die zehn Risikomanagementmaßnahmen aus § 30 Abs. 2 BSIG, ihr Verhältnis zu Artikel 21 NIS 2 und zur CIR (EU) 2024/2690, Verhältnismäßigkeit und Bußgelder.",
        summaryEn: "The ten risk management measures under Section 30(2) BSIG, their relationship to Article 21 NIS 2 and CIR (EU) 2024/2690, proportionality, and penalties.",
        authorSlug: "simon-orzel",
        tags: ["regulation:nis2", "regulation:bsig", "regulation:cir-2024-2690", "topic:risk-management", "topic:art-21", "audience:ceo", "audience:ciso", "level:intermediate"],
        subCategory: "Pflichten",
        audience: ["ceo", "ciso", "lawyer"],
        relatedSlugs: ["nis2-risikomanagement", "nis2-gap-assessment", "nis2-bussgelder", "what-is-nis2"],
      },
      {
        slug: "bsig-32",
        slugs: { de: "bsig-32", en: "bsig-32", nl: "bsig-32" },
        titleDe: "§ 32 BSIG: die NIS-2-Meldepflicht",
        titleEn: "Section 32 BSIG: the NIS 2 incident reporting duty",
        summaryDe: "Die Meldepflicht aus § 32 BSIG: Frühwarnung in 24 Stunden, Meldung in 72 Stunden, Abschlussbericht nach einem Monat, was erheblich heißt und das Verhältnis zur DSGVO.",
        summaryEn: "The reporting duty under Section 32 BSIG: early warning in 24 hours, notification in 72 hours, final report after one month, what significant means, and the relationship to the GDPR.",
        authorSlug: "simon-orzel",
        tags: ["regulation:nis2", "regulation:bsig", "regulation:cir-2024-2690", "topic:risk-management", "audience:ceo", "audience:ciso", "level:intermediate"],
        subCategory: "Pflichten",
        audience: ["ceo", "ciso", "lawyer"],
        relatedSlugs: ["bsig-30", "nis2-meldepflicht", "geschaftsfuhrerhaftung", "what-is-nis2"],
      },
      {
        slug: "cir-2024-2690",
        slugs: de("cir-2024-2690"),
        titleDe: "CIR 2024/2690 — die technische Verordnung",
        titleEn: "CIR 2024/2690 — the technical regulation",
        summaryDe: "Die EU-Durchführungsverordnung, die NIS 2 für digitale Infrastruktur konkretisiert.",
        summaryEn: "The EU implementing regulation that operationalises NIS 2 for digital infrastructure.",
      },
      {
        slug: "it-grundschutz",
        slugs: { de: "it-grundschutz", en: "it-baseline-protection", nl: "it-basisbescherming" },
        titleDe: "IT-Grundschutz und NIS 2",
        titleEn: "IT-Grundschutz and NIS 2",
        summaryDe: "Wie sich der BSI-Standard zur deutschen NIS 2 Umsetzung verhält.",
        summaryEn: "How the BSI standard relates to German NIS 2 implementation.",
      },
      {
        slug: "it-sicherheitspflicht",
        slugs: { de: "it-sicherheitspflicht", en: "it-security-duty", nl: "it-beveiligingsplicht" },
        titleDe: "IT-Sicherheitspflicht erklärt",
        titleEn: "IT security duty explained",
        summaryDe: "Was Geschäftsführer rechtlich schulden — neben NIS 2 auch im Gesellschaftsrecht.",
        summaryEn: "What directors legally owe — beyond NIS 2, also in corporate law.",
      },
      {
        slug: "glossar",
        slugs: { de: "glossar", en: "glossary", nl: "woordenlijst" },
        titleDe: "Glossar",
        titleEn: "Glossary",
        summaryDe: "Begriffe rund um NIS 2, BSIG, CIR und Cybersicherheit.",
        summaryEn: "Terms around NIS 2, BSIG, CIR and cybersecurity.",
      },
      {
        slug: "faq",
        slugs: { de: "faq", en: "faq", nl: "faq" },
        titleDe: "Häufige Fragen zu NIS 2",
        titleEn: "Frequently asked questions",
        summaryDe: "Die Fragen, die wir am häufigsten zu NIS 2 hören.",
        summaryEn: "The questions we hear most often about NIS 2.",
      },
      {
        slug: "enisa-tig-nis2",
        slugs: { de: "enisa-tig-nis2", en: "enisa-tig-nis2", nl: "enisa-tig-nis2" },
        titleDe: "ENISA Technical Implementation Guidance und NIS 2",
        titleEn: "ENISA Technical Implementation Guidance and NIS 2",
        summaryDe: "Was die EU-Cybersicherheitsagentur ENISA unter NIS 2 tut, was die Technical Implementation Guidance (TIG) ist und wie sie zur Durchführungsverordnung 2024/2690 passt.",
        summaryEn: "What the EU Cybersecurity Agency ENISA does under NIS 2, what the Technical Implementation Guidance (TIG) is and how it relates to Commission Implementing Regulation 2024/2690.",
        tags: [
          "regulation:nis2",
          "regulation:cir-2024-2690",
          "topic:enisa",
          "topic:tig",
          "audience:ciso",
          "audience:it-leiter",
          "level:intermediate",
        ],
        subCategory: "EU-Institutionen",
        audience: ["ciso", "it-leiter", "consultant"],
        relatedSlugs: ["cir-2024-2690", "what-is-nis2", "erheblicher-sicherheitsvorfall"],
      },
      {
        slug: "erheblicher-sicherheitsvorfall",
        slugs: {
          de: "erheblicher-sicherheitsvorfall",
          en: "significant-incident",
          nl: "significant-incident",
        },
        titleDe: "Erheblicher Sicherheitsvorfall nach NIS 2 und CIR 2024/2690",
        titleEn: "Significant incident under NIS 2 and CIR 2024/2690",
        summaryDe: "Artikel 23(3) NIS 2 nennt zwei Auslöser. CIR 2024/2690 quantifiziert die Schwellenwerte für digitale Infrastruktur. Für andere Sektoren bleiben sie unbestimmt.",
        summaryEn: "Article 23(3) NIS 2 names two triggers. CIR 2024/2690 quantifies thresholds for digital infrastructure. For other sectors the threshold remains unquantified.",
        tags: [
          "regulation:nis2",
          "regulation:cir-2024-2690",
          "topic:incident",
          "topic:thresholds",
          "audience:ciso",
          "audience:it-leiter",
          "audience:ceo",
          "level:intermediate",
        ],
        subCategory: "Schlüsselbegriffe",
        audience: ["ceo", "ciso", "it-leiter"],
        relatedSlugs: ["nis2-meldepflicht", "cir-2024-2690", "nis2-risikomanagement"],
      },
      { slug: "nis-2-kooperationsgruppe", slugs: { de: "nis-2-kooperationsgruppe", en: "nis-2-cooperation-group", nl: "nis-2-cooperation-group" }, titleDe: "Die Kooperationsgruppe nach Artikel 14 NIS 2", titleEn: "The Cooperation Group under Article 14 NIS 2", summaryDe: "Was die NIS 2 Kooperationsgruppe macht: Mitgliedstaaten, Kommission, ENISA. Strategische Zusammenarbeit, Leitlinien, Peer Reviews.", summaryEn: "What the NIS 2 Cooperation Group does: Member States, Commission, ENISA. Strategic cooperation, guidelines, peer reviews.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:cooperation-group", "topic:eu-institutions", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "EU-Institutionen", audience: ["ceo", "lawyer"], relatedSlugs: ["nis-2-csirt-netzwerk-cyclone", "enisa-tig-nis2"] },
      { slug: "nis-2-csirt-netzwerk-cyclone", slugs: { de: "nis-2-csirt-netzwerk-cyclone", en: "nis-2-csirt-network-cyclone", nl: "nis-2-csirt-network-cyclone" }, titleDe: "CSIRT-Netzwerk und EU-CyCLONe nach Artikel 15 und 16 NIS 2", titleEn: "CSIRT Network and EU-CyCLONe under Articles 15 and 16 NIS 2", summaryDe: "Wie die nationalen CSIRTs operativ zusammenarbeiten und wie EU-CyCLONe großflächige Cyberkrisen koordiniert.", summaryEn: "How national CSIRTs cooperate operationally and how EU-CyCLONe coordinates large-scale cyber crises.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:csirt", "topic:eu-institutions", "audience:ciso", "audience:it-leiter", "level:intermediate"], subCategory: "EU-Institutionen", audience: ["ciso", "it-leiter"], relatedSlugs: ["nis-2-kooperationsgruppe", "nis2-meldepflicht"] },
      { slug: "nis-2-koordinierte-risikobewertungen", slugs: { de: "nis-2-koordinierte-risikobewertungen", en: "nis-2-coordinated-risk-assessments", nl: "nis-2-coordinated-risk-assessments" }, titleDe: "Koordinierte Risikobewertungen kritischer Lieferketten nach Artikel 22 NIS 2", titleEn: "Coordinated risk assessments of critical supply chains under Article 22 NIS 2", summaryDe: "Was Artikel 22 verlangt: gemeinsame EU-Bewertung der Cybersicherheitsrisiken bestimmter kritischer IKT-Lieferketten durch Kooperationsgruppe, Kommission und ENISA.", summaryEn: "What Article 22 requires: joint EU assessment of cybersecurity risks for specific critical ICT supply chains by Cooperation Group, Commission and ENISA.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:supply-chain", "topic:eu-institutions", "audience:ceo", "audience:procurement", "level:intermediate"], subCategory: "EU-Institutionen", audience: ["ceo", "procurement"], relatedSlugs: ["nis2-lieferkette", "nis-2-kooperationsgruppe"] },
      { slug: "nis2-fuer-management", slugs: { de: "nis2-fuer-management", en: "nis2-for-management", nl: "nis2-voor-management" }, titleDe: "NIS 2 für die Geschäftsführung in fünf Minuten", titleEn: "NIS 2 for the management body in five minutes", summaryDe: "Die kürzeste belastbare Zusammenfassung von NIS 2 für Geschäftsführung, Vorstand und Aufsichtsrat. Was Artikel 20 verlangt, was im Audit zählt, was nicht delegierbar ist.", summaryEn: "The shortest defensible summary of NIS 2 for the management body. What Article 20 requires, what auditors look for, what cannot be delegated.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:governance", "topic:management-body", "audience:ceo", "audience:board", "level:beginner"], subCategory: "Einstieg", audience: ["ceo", "lawyer"], relatedSlugs: ["geschaftsfuhrerhaftung", "geschaeftsleitungs-schulung-nis2"] },
      { slug: "nis2-vs-nis1", slugs: { de: "nis2-vs-nis1", en: "nis2-vs-nis1", nl: "nis2-vs-nis1" }, titleDe: "Was sich von NIS 1 zu NIS 2 geändert hat", titleEn: "What changed from NIS 1 to NIS 2", summaryDe: "Erweiterung des Anwendungsbereichs, neue Governance-Pflichten, härtere Meldepflichten, höhere Bußgelder. Die wichtigsten Verschiebungen zwischen Richtlinie 2016/1148 und 2022/2555.", summaryEn: "Broader scope, new governance duties, tougher reporting, higher fines. The key shifts between Directive 2016/1148 and 2022/2555.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:nis1", "topic:migration", "audience:ciso", "audience:lawyer", "level:intermediate"], subCategory: "Hintergrund", audience: ["ciso", "lawyer"], relatedSlugs: ["what-is-nis2", "nis2-einrichtungen"] },
      { slug: "was-ist-bsi", slugs: { de: "was-ist-bsi", en: "what-is-bsi", nl: "wat-is-bsi" }, titleDe: "Was ist das BSI?", titleEn: "What is the BSI?", summaryDe: "Bundesamt für Sicherheit in der Informationstechnik, errichtet nach §1 BSIG. Unter NIS 2 die zuständige Behörde, die Meldestelle und der Träger des nationalen CSIRT.", summaryEn: "Federal Office for Information Security, established under §1 BSIG. Under NIS 2 the competent authority, single notification point and operator of the national CSIRT.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:authority", "audience:ceo", "audience:ciso", "level:beginner"], subCategory: "Einstieg", audience: ["ceo", "ciso"], relatedSlugs: ["bsi-meldeportal", "what-is-nis2", "nis2-fuer-management"] },
      { slug: "bsi-meldeportal", slugs: { de: "bsi-meldeportal", en: "bsi-reporting-portal", nl: "bsi-meldportaal" }, titleDe: "Das BSI-Meldeportal", titleEn: "The BSI reporting portal", summaryDe: "Eine Plattform für zwei NIS 2 Pflichten: Erstregistrierung nach §33 BSIG und Meldung erheblicher Sicherheitsvorfälle nach §32 BSIG. Zugang über ELSTER-Organisationszertifikat.", summaryEn: "One platform, two NIS 2 obligations: first-time registration under §33 BSIG and incident notification under §32 BSIG. Access via ELSTER organisation certificate.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:reporting", "topic:registration", "audience:ciso", "audience:dpo", "level:intermediate"], subCategory: "Einstieg", audience: ["ciso", "dpo"], relatedSlugs: ["was-ist-bsi", "nis2-registrierung", "nis2-meldepflicht", "erheblicher-sicherheitsvorfall"] },
      { slug: "nis2-verhaeltnismaessigkeit", slugs: { de: "nis2-verhaeltnismaessigkeit", en: "nis2-proportionality", nl: "nis2-evenredigheid" }, titleDe: "Was 'verhältnismäßig' in Art. 21(1) NIS 2 wirklich heißt", titleEn: "What 'proportionate' really means in Art. 21(1) NIS 2", summaryDe: "Sechs Faktoren entscheiden, was verhältnismäßig in Ihrem Fall heißt: Risikoexposition, Größe, Wahrscheinlichkeit und Schwere von Vorfällen, gesellschaftliche Auswirkungen, Stand der Technik, Kosten.", summaryEn: "Six factors decide what proportionate means in your case: risk exposure, size, likelihood and severity of incidents, societal impact, state of the art, cost of implementation.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:proportionality", "topic:risk-management", "audience:ceo", "audience:ciso", "level:intermediate"], subCategory: "Konzepte", audience: ["ceo", "ciso"], relatedSlugs: ["nis2-requirements", "nis2-fuer-management", "umsetzung-mittelstand"] },
      { slug: "ohne-schuldhaftes-zoegern-nis2", slugs: { de: "ohne-schuldhaftes-zoegern-nis2", en: "without-undue-delay-nis2", nl: "zonder-onnodige-vertraging-nis2" }, titleDe: "Was 'unverzüglich' bei der NIS 2 24-Stunden-Frist wirklich heißt", titleEn: "What 'without undue delay' really means on the NIS 2 24-hour clock", summaryDe: "Art. 23(4)(a) NIS 2 läuft mit zwei Uhren, nicht mit einer. Unverzüglich UND innerhalb von 24 Stunden, beide ab Kenntniserlangung. §121(1) BGB definiert unverzüglich als 'ohne schuldhaftes Zögern'.", summaryEn: "Art. 23(4)(a) NIS 2 has two clocks, not one. Without undue delay AND within 24 hours, both starting at awareness. §121(1) BGB defines 'unverzüglich' as 'ohne schuldhaftes Zögern'.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:reporting", "topic:legal-terms", "audience:ciso", "audience:lawyer", "level:intermediate"], subCategory: "Konzepte", audience: ["ciso", "lawyer"], relatedSlugs: ["erheblicher-sicherheitsvorfall", "nis2-meldepflicht", "wie-bsi-vorfall-melden-24h"] },
      { slug: "was-ist-ein-asset-nis2", slugs: { de: "was-ist-ein-asset-nis2", en: "what-is-an-asset-nis2", nl: "wat-is-een-asset-nis2" }, titleDe: "Was ist ein Asset unter NIS 2?", titleEn: "What is an asset under NIS 2?", summaryDe: "Ein Asset unter NIS 2 ist alles, was Informationen verarbeitet, speichert oder überträgt. Art. 21(2) und CIR 2024/2690 verlangen ein Inventar; BSI 200-2 §8.1 erlaubt Gruppierung gleichartiger Objekte.", summaryEn: "An asset under NIS 2 is anything that processes, stores or transmits information your operations depend on. Art. 21(2) and CIR 2024/2690 require an inventory; BSI 200-2 §8.1 allows grouping identical objects.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:asset-management", "topic:inventory", "audience:ciso", "audience:it-leiter", "level:beginner"], subCategory: "Konzepte", audience: ["ciso", "it-leiter"], relatedSlugs: ["nis2-anlagenmanagement", "wie-asset-inventar-erstellen-nis2", "nis2-risikomanagement"] },
      { slug: "was-ist-ein-isms-nis2", slugs: { de: "was-ist-ein-isms-nis2", en: "what-is-an-isms-nis2", nl: "wat-is-een-isms-nis2" }, titleDe: "Was ist ein ISMS und brauche ich eins für NIS 2?", titleEn: "What is an ISMS and do I need one for NIS 2?", summaryDe: "Ein ISMS ist die Art und Weise, wie eine Organisation Informationssicherheit steuert. NIS 2 nennt das Wort nicht, aber Art. 21(2) verlangt genau das, was ein ISMS leistet. ISO 27001 Zertifizierung ist nicht verpflichtend.", summaryEn: "An ISMS is the way an organisation manages information security. NIS 2 never uses the word but Art. 21(2) requires exactly what an ISMS does. ISO 27001 certification is not mandatory.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:isms", "topic:governance", "audience:ceo", "audience:ciso", "level:beginner"], subCategory: "Konzepte", audience: ["ceo", "ciso"], relatedSlugs: ["nis2-requirements", "umsetzung-mittelstand", "it-grundschutz", "nis2-iso-27001"] },
    ],
  },
  umsetzung: {
    slug: "umsetzung",
    slugs: CATEGORY_SLUGS.umsetzung,
    titleDe: "Umsetzung",
    titleEn: "Implementation",
    questionDe: "Was muss ich konkret tun?",
    questionEn: "What do I actually need to do?",
    entries: [
      {
        slug: "nis2-roadmap",
        slugs: { de: "nis2-roadmap", en: "nis2-roadmap", nl: "nis2-stappenplan" },
        titleDe: "NIS 2 in fünf Schritten",
        titleEn: "NIS 2 in five steps",
        summaryDe: "Der praxisnahe Roadmap für Geschäftsführung und IT-Leitung.",
        summaryEn: "The practical roadmap for management and IT leadership.",
      },
      {
        slug: "nis2-requirements",
        slugs: { de: "nis2-requirements", en: "nis2-requirements", nl: "nis2-vereisten" },
        titleDe: "Die NIS 2 Anforderungen",
        titleEn: "NIS 2 requirements",
        summaryDe: "§30 BSIG und Art. 21(2) NIS 2 — die zehn Maßnahmen im Detail.",
        summaryEn: "§30 BSIG and Art. 21(2) NIS 2 — the ten measures in detail.",
      },
      {
        slug: "nis2-meldepflicht",
        slugs: { de: "nis2-meldepflicht", en: "nis2-reporting-obligation", nl: "nis2-meldplicht" },
        titleDe: "Meldepflicht §32 BSIG / Art. 23 NIS 2",
        titleEn: "Reporting duty under §32 BSIG / Art. 23 NIS 2",
        summaryDe: "Die 24h / 72h / 1-Monat Meldekaskade an das BSI.",
        summaryEn: "The 24h / 72h / 1-month reporting cascade to the BSI.",
      },
      {
        slug: "umsetzung-mittelstand",
        slugs: { de: "umsetzung-mittelstand", en: "implementation-sme", nl: "implementatie-mkb" },
        titleDe: "NIS 2 im Mittelstand umsetzen",
        titleEn: "Implementing NIS 2 in the Mittelstand",
        summaryDe: "Pragmatischer Implementierungsleitfaden ohne 50.000 Euro Beratung.",
        summaryEn: "Pragmatic implementation guide without €50,000 of consulting.",
      },
      {
        slug: "nis2-gap-assessment",
        slugs: { de: "nis2-gap-assessment", en: "nis2-gap-assessment", nl: "nis2-gap-analyse" },
        titleDe: "NIS 2 Gap-Assessment",
        titleEn: "NIS 2 gap assessment",
        summaryDe: "So finden Sie strukturiert Ihre Lücken zwischen Ist und Soll.",
        summaryEn: "How to find your gaps between current state and required state.",
      },
      {
        slug: "nis2-documents",
        slugs: { de: "nis2-documents", en: "nis2-documents", nl: "nis2-documenten" },
        titleDe: "NIS 2 Dokumente und Vorlagen",
        titleEn: "NIS 2 documents and templates",
        summaryDe: "Welche Nachweise und Richtlinien Sie tatsächlich brauchen.",
        summaryEn: "Which evidence and policies you actually need.",
      },
      {
        slug: "nis2-registration-portals",
        slugs: { de: "nis2-registration-portals", en: "nis2-registration-portals", nl: "nis2-registratieportalen" },
        titleDe: "NIS 2 Registrierungsportale in der EU",
        titleEn: "NIS 2 registration portals across the EU",
        summaryDe: "Die nationalen Registrierungsstellen aller Mitgliedstaaten.",
        summaryEn: "National registration authorities across all member states.",
      },
      {
        slug: "kosten",
        slugs: { de: "kosten", en: "cost", nl: "kosten" },
        titleDe: "Kosten der NIS 2 Umsetzung",
        titleEn: "Cost of NIS 2 implementation",
        summaryDe: "Was kostet NIS 2 wirklich — Beratung vs Selbstumsetzung.",
        summaryEn: "What does NIS 2 actually cost — consulting vs self-implementation.",
      },
      {
        slug: "nis2-lieferkette",
        slugs: { de: "nis2-lieferkette", en: "nis2-supply-chain", nl: "nis2-toeleveringsketen" },
        titleDe: "NIS 2 Lieferkettensicherheit",
        titleEn: "NIS 2 supply chain security",
        summaryDe: "Art. 21(2)(d) NIS 2 / CIR §5 — Lieferantenbewertung in der Praxis.",
        summaryEn: "Art. 21(2)(d) NIS 2 / CIR §5 — supplier assessment in practice.",
      },
      {
        slug: "nis2-risikomanagement",
        slugs: {
          de: "nis2-risikomanagement",
          en: "nis2-risk-management",
          nl: "nis2-risicobeheer",
        },
        titleDe: "NIS 2 Risikomanagement nach Art. 21(2)(a)",
        titleEn: "NIS 2 risk management under Art. 21(2)(a)",
        summaryDe:
          "Was Artikel 21(2)(a) NIS 2 fordert, was CIR §2 konkretisiert, und was im operativen Tagesgeschäft daraus folgt.",
        summaryEn:
          "What Article 21(2)(a) NIS 2 requires, what CIR §2 operationalises and what that means day to day.",
        tags: [
          "regulation:nis2",
          "regulation:cir-2024-2690",
          "regulation:bsig",
          "topic:risk-management",
          "topic:proportionality",
          "topic:all-hazards",
          "audience:ciso",
          "audience:it-leiter",
          "audience:ceo",
          "level:intermediate",
        ],
        subCategory: "Risikomanagement",
        audience: ["ciso", "it-leiter", "ceo"],
        relatedSlugs: [
          "nis2-requirements",
          "nis2-lieferkette",
          "nis2-meldepflicht",
        ],
      },
      {
        slug: "geschaeftsleitungs-schulung-nis2",
        slugs: {
          de: "geschaeftsleitungs-schulung-nis2",
          en: "management-body-training-nis2",
          nl: "bestuur-training-nis2",
        },
        titleDe: "Geschäftsleitungs-Schulung nach Art. 20(2) NIS 2",
        titleEn: "Management body training under Art. 20(2) NIS 2",
        summaryDe:
          "Art. 20(2) NIS 2 verlangt eine spezifische Cybersicherheits-Schulung für jedes Mitglied der Geschäftsleitung. Was das heißt, was nachzuweisen ist, und wo §38(3) BSIG das in Deutschland einordnet.",
        summaryEn:
          "Art. 20(2) NIS 2 requires every member of the management body to complete cybersecurity training. What that means, what you must be able to prove, and how §38(3) BSIG implements it in Germany.",
        tags: [
          "regulation:nis2",
          "regulation:bsig",
          "topic:management-body",
          "topic:training",
          "topic:governance",
          "audience:ceo",
          "audience:lawyer",
          "level:beginner",
        ],
        subCategory: "Governance",
        audience: ["ceo", "lawyer"],
        relatedSlugs: ["geschaftsfuhrerhaftung", "nis2-risikomanagement"],
      },
      {
        slug: "mfa-pflicht-nis2",
        slugs: {
          de: "mfa-pflicht-nis2",
          en: "mfa-requirement-nis2",
          nl: "mfa-vereiste-nis2",
        },
        titleDe: "MFA-Pflicht nach Art. 21(2)(j) NIS 2 und CIR §11.7",
        titleEn: "MFA requirement under Art. 21(2)(j) NIS 2 and CIR §11.7",
        summaryDe:
          "Multifaktor-Authentifizierung ist eine eigene Pflicht aus Art. 21(2)(j). CIR §11.7 sagt, wo und wie. Was das für privilegierte Konten und für alle Nutzer bedeutet.",
        summaryEn:
          "Multi-factor authentication is its own obligation under Art. 21(2)(j). CIR §11.7 says where and how. What it means for privileged accounts and for all users.",
        tags: [
          "regulation:nis2",
          "regulation:cir-2024-2690",
          "topic:mfa",
          "topic:access-control",
          "topic:authentication",
          "audience:it-leiter",
          "audience:ciso",
          "level:beginner",
        ],
        subCategory: "Zugriffskontrolle",
        audience: ["it-leiter", "ciso"],
        relatedSlugs: ["nis2-requirements", "nis2-risikomanagement"],
      },
      {
        slug: "kryptographie-nis2",
        slugs: {
          de: "kryptographie-nis2",
          en: "cryptography-nis2",
          nl: "cryptografie-nis2",
        },
        titleDe: "Kryptographie-Richtlinie nach Art. 21(2)(h) NIS 2 und CIR §9",
        titleEn: "Cryptography policy under Art. 21(2)(h) NIS 2 and CIR §9",
        summaryDe:
          "Art. 21(2)(h) verlangt eine Kryptographie-Richtlinie. CIR §9 sagt, was darin stehen muss: Algorithmen, Schlüsselmanagement, zwölf Punkte zum Lebenszyklus jedes Schlüssels.",
        summaryEn:
          "Art. 21(2)(h) requires a cryptography policy. CIR §9 sets out what has to be in it: algorithms, key management, twelve points on the key lifecycle.",
        tags: [
          "regulation:nis2",
          "regulation:cir-2024-2690",
          "topic:cryptography",
          "topic:key-management",
          "audience:it-leiter",
          "audience:ciso",
          "level:intermediate",
        ],
        subCategory: "Kryptographie",
        audience: ["it-leiter", "ciso"],
        relatedSlugs: ["nis2-requirements", "mfa-pflicht-nis2"],
      },
      { slug: "nis2-vorfallbehandlung", slugs: { de: "nis2-vorfallbehandlung", en: "nis2-incident-handling", nl: "nis2-incident-handling" }, titleDe: "NIS 2 Vorfallbehandlung nach Art. 21(2)(b) und CIR §3", titleEn: "NIS 2 incident handling under Art. 21(2)(b) and CIR §3", summaryDe: "Was Vorfallbehandlung intern bedeutet (erkennen, eindämmen, beheben) und wie sie sich von der Meldepflicht an das BSI unterscheidet.", summaryEn: "What internal incident handling means (detect, contain, recover) and how it differs from the duty to report to the BSI.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:incident-handling", "audience:ciso", "audience:it-leiter", "level:intermediate"], subCategory: "Vorfallbehandlung", audience: ["ciso", "it-leiter"], relatedSlugs: ["nis2-meldepflicht", "nis2-risikomanagement"] },
      { slug: "nis2-business-continuity", slugs: { de: "nis2-business-continuity", en: "nis2-business-continuity", nl: "nis2-business-continuity" }, titleDe: "NIS 2 Business Continuity nach Art. 21(2)(c) und CIR §4", titleEn: "NIS 2 business continuity under Art. 21(2)(c) and CIR §4", summaryDe: "Notfallplan, Backup-Management, Krisenmanagement: was die Richtlinie für die Aufrechterhaltung des Betriebs verlangt.", summaryEn: "Business continuity plan, backup management, crisis management: what the directive asks for to keep operations running.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:business-continuity", "audience:ciso", "audience:it-leiter", "level:intermediate"], subCategory: "Business Continuity", audience: ["ciso", "it-leiter"], relatedSlugs: ["nis2-backup-strategie", "nis2-risikomanagement"] },
      { slug: "nis2-sichere-entwicklung", slugs: { de: "nis2-sichere-entwicklung", en: "nis2-secure-development", nl: "nis2-secure-development" }, titleDe: "NIS 2 sichere Entwicklung nach Art. 21(2)(e) und CIR §6", titleEn: "NIS 2 secure development under Art. 21(2)(e) and CIR §6", summaryDe: "Sicherheit bei Erwerb, Entwicklung und Wartung von Netz- und Informationssystemen. Acht Unter-Abschnitte der CIR.", summaryEn: "Security in procurement, development and maintenance of network and information systems. Eight CIR sub-sections.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:secure-development", "audience:it-leiter", "audience:ciso", "level:intermediate"], subCategory: "Sichere Entwicklung", audience: ["it-leiter", "ciso"], relatedSlugs: ["nis2-schwachstellenmanagement", "nis2-netzsicherheit"] },
      { slug: "nis2-schwachstellenmanagement", slugs: { de: "nis2-schwachstellenmanagement", en: "nis2-vulnerability-management", nl: "nis2-vulnerability-management" }, titleDe: "NIS 2 Schwachstellenmanagement nach Art. 21(2)(e) und CIR §6.10", titleEn: "NIS 2 vulnerability management under Art. 21(2)(e) and CIR §6.10", summaryDe: "Schwachstellen erkennen, bewerten, behandeln und koordiniert offenlegen. Was CIR §6.10 wirklich verlangt.", summaryEn: "Identify, assess, treat and coordinate disclosure of vulnerabilities. What CIR §6.10 actually requires.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:vulnerability", "audience:it-leiter", "audience:ciso", "level:intermediate"], subCategory: "Schwachstellenmanagement", audience: ["it-leiter", "ciso"], relatedSlugs: ["nis2-sichere-entwicklung", "nis2-risikomanagement"] },
      { slug: "nis2-wirksamkeitsbewertung", slugs: { de: "nis2-wirksamkeitsbewertung", en: "nis2-effectiveness-evaluation", nl: "nis2-effectiveness-evaluation" }, titleDe: "NIS 2 Wirksamkeitsbewertung nach Art. 21(2)(f) und CIR §7", titleEn: "NIS 2 effectiveness evaluation under Art. 21(2)(f) and CIR §7", summaryDe: "Wie misst man, ob die Risikomanagementmaßnahmen wirken. KPIs, Methodik, Berichterstattung an die Leitung.", summaryEn: "How to measure whether risk management measures are working. KPIs, methodology, reporting to the management body.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:effectiveness", "audience:ciso", "audience:ceo", "level:intermediate"], subCategory: "Wirksamkeitsbewertung", audience: ["ciso", "ceo"], relatedSlugs: ["nis2-risikomanagement", "nis2-requirements"] },
      { slug: "nis2-cyberhygiene-schulungen", slugs: { de: "nis2-cyberhygiene-schulungen", en: "nis2-cyber-hygiene-training", nl: "nis2-cyber-hygiene-training" }, titleDe: "NIS 2 Cyberhygiene und Schulungen nach Art. 21(2)(g) und CIR §8", titleEn: "NIS 2 cyber hygiene and training under Art. 21(2)(g) and CIR §8", summaryDe: "Grundlegende Cyberhygiene-Verfahren plus Sensibilisierung und rollenspezifische Schulung. Was CIR §8 in der Praxis bedeutet.", summaryEn: "Basic cyber hygiene practices plus awareness and role-specific training. What CIR §8 means in practice.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:awareness", "topic:training", "audience:ceo", "audience:it-leiter", "level:beginner"], subCategory: "Cyberhygiene", audience: ["ceo", "it-leiter"], relatedSlugs: ["geschaeftsleitungs-schulung-nis2", "nis2-requirements"] },
      { slug: "nis2-personalsicherheit", slugs: { de: "nis2-personalsicherheit", en: "nis2-personnel-security", nl: "nis2-personnel-security" }, titleDe: "NIS 2 Personalsicherheit nach Art. 21(2)(i) und CIR §10", titleEn: "NIS 2 personnel security under Art. 21(2)(i) and CIR §10", summaryDe: "Zuverlässigkeitsüberprüfung, Verantwortlichkeiten, Beendigung des Beschäftigungsverhältnisses, Disziplinarverfahren.", summaryEn: "Background checks, responsibilities, end of employment, disciplinary procedures.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:personnel-security", "audience:it-leiter", "audience:lawyer", "level:intermediate"], subCategory: "Personalsicherheit", audience: ["it-leiter", "lawyer"], relatedSlugs: ["nis2-zugriffskontrolle", "geschaeftsleitungs-schulung-nis2"] },
      { slug: "nis2-anlagenmanagement", slugs: { de: "nis2-anlagenmanagement", en: "nis2-asset-management", nl: "nis2-asset-management" }, titleDe: "NIS 2 Anlagen- und Wertemanagement nach Art. 21(2)(i) und CIR §12", titleEn: "NIS 2 asset management under Art. 21(2)(i) and CIR §12", summaryDe: "Klassifizierung, Behandlung, Wechseldatenträger und das vollständige Anlagen- und Werteinventar.", summaryEn: "Classification, handling, removable media, and the complete asset and value inventory.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:asset-management", "audience:it-leiter", "audience:ciso", "level:intermediate"], subCategory: "Anlagenmanagement", audience: ["it-leiter", "ciso"], relatedSlugs: ["nis2-risikomanagement", "nis2-zugriffskontrolle"] },
      { slug: "nis2-zugriffskontrolle", slugs: { de: "nis2-zugriffskontrolle", en: "nis2-access-control", nl: "nis2-access-control" }, titleDe: "NIS 2 Zugriffskontrolle nach Art. 21(2)(i)+(j) und CIR §11", titleEn: "NIS 2 access control under Art. 21(2)(i)+(j) and CIR §11", summaryDe: "Konzept für die Zugriffskontrolle, Management von Zugangsrechten, privilegierte Konten, Identifizierung, Authentifizierung. MFA als eigene Pflicht.", summaryEn: "Access control policy, rights management, privileged accounts, identification, authentication. MFA as its own duty.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:access-control", "audience:it-leiter", "audience:ciso", "level:intermediate"], subCategory: "Zugriffskontrolle", audience: ["it-leiter", "ciso"], relatedSlugs: ["mfa-pflicht-nis2", "nis2-personalsicherheit"] },
      { slug: "nis2-backup-strategie", slugs: { de: "nis2-backup-strategie", en: "nis2-backup-strategy", nl: "nis2-backup-strategy" }, titleDe: "NIS 2 Backup-Strategie nach CIR §4.2", titleEn: "NIS 2 backup strategy under CIR §4.2", summaryDe: "Backup-Sicherungs- und Redundanzmanagement: Wiederherstellungszeiten, Speicherorte, Tests, Aufbewahrungsfristen.", summaryEn: "Backup and redundancy management: recovery times, storage locations, tests, retention periods.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:backup", "audience:it-leiter", "audience:ciso", "level:intermediate"], subCategory: "Backup", audience: ["it-leiter", "ciso"], relatedSlugs: ["nis2-business-continuity", "nis2-risikomanagement"] },
      { slug: "nis2-netzsicherheit", slugs: { de: "nis2-netzsicherheit", en: "nis2-network-security", nl: "nis2-network-security" }, titleDe: "NIS 2 Netzsicherheit nach CIR §6.7 und §6.8", titleEn: "NIS 2 network security under CIR §6.7 and §6.8", summaryDe: "Netzwerkdokumentation, interne Domänen, sichere Kommunikationskanäle, Netzsegmentierung und DMZ-Konzepte.", summaryEn: "Network documentation, internal domains, secure communications, network segmentation and DMZ concepts.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:network-security", "audience:it-leiter", "audience:ciso", "level:intermediate"], subCategory: "Netzsicherheit", audience: ["it-leiter", "ciso"], relatedSlugs: ["nis2-sichere-entwicklung", "nis2-zugriffskontrolle"] },
      { slug: "nis2-logging-protokollierung", slugs: { de: "nis2-logging-protokollierung", en: "nis2-logging", nl: "nis2-logging" }, titleDe: "NIS 2 Logging und Protokollierung nach CIR §3.2", titleEn: "NIS 2 logging and monitoring under CIR §3.2", summaryDe: "Welche zwölf Ereignistypen die CIR protokolliert sehen will, von Netzverkehr bis privilegierten Zugriffen.", summaryEn: "Which twelve event types the CIR wants logged, from network traffic to privileged access.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:logging", "topic:monitoring", "audience:it-leiter", "audience:ciso", "level:intermediate"], subCategory: "Logging", audience: ["it-leiter", "ciso"], relatedSlugs: ["nis2-vorfallbehandlung", "nis2-zugriffskontrolle"] },
      { slug: "wie-nis2-risikoanalyse-durchfuehren", slugs: { de: "wie-nis2-risikoanalyse-durchfuehren", en: "how-to-conduct-nis2-risk-assessment", nl: "hoe-nis2-risicoanalyse-uitvoeren" }, titleDe: "Wie führe ich eine NIS 2 Risikoanalyse durch?", titleEn: "How do I conduct a NIS 2 risk assessment?", summaryDe: "Schritt-für-Schritt: Asset-Scope, Bedrohungsmodell, Wahrscheinlichkeit-Auswirkung, Behandlungsplan, Sign-Off. Was CIR §2 in der Praxis verlangt.", summaryEn: "Step by step: asset scope, threat model, likelihood-impact, treatment plan, sign-off. What CIR §2 requires in practice.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:risk-management", "topic:how-to", "audience:ciso", "audience:it-leiter", "level:intermediate"], subCategory: "Anleitungen", audience: ["ciso", "it-leiter"], relatedSlugs: ["nis2-risikomanagement", "wie-asset-inventar-erstellen-nis2"] },
      { slug: "wie-asset-inventar-erstellen-nis2", slugs: { de: "wie-asset-inventar-erstellen-nis2", en: "how-to-build-nis2-asset-inventory", nl: "hoe-nis2-asset-inventaris-opbouwen" }, titleDe: "Wie erstelle ich ein NIS 2 Asset-Inventar?", titleEn: "How do I build a NIS 2 asset inventory?", summaryDe: "CIR §12.4 in der Praxis: Prozesse plus Systeme, Grundschutz-Gruppierung, VIVA-Klassifizierung. So baut ein Mittelständler das Inventar in einer Woche.", summaryEn: "CIR §12.4 in practice: processes plus systems, Grundschutz grouping, CIA classification. How a Mittelstand builds the inventory in one week.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cir-2024-2690", "topic:asset-management", "topic:how-to", "audience:it-leiter", "audience:ciso", "level:beginner"], subCategory: "Anleitungen", audience: ["it-leiter", "ciso"], relatedSlugs: ["nis2-anlagenmanagement", "wie-nis2-risikoanalyse-durchfuehren"] },
      { slug: "wie-bsi-audit-vorbereiten", slugs: { de: "wie-bsi-audit-vorbereiten", en: "how-to-prepare-bsi-audit", nl: "hoe-bsi-audit-voorbereiden" }, titleDe: "Wie bereite ich mich auf ein BSI Audit vor?", titleEn: "How do I prepare for a BSI audit?", summaryDe: "Welche Nachweise das BSI fragt, in welcher Reihenfolge, mit welcher Dokumentationstiefe. Was vor dem Audit fertig sein muss.", summaryEn: "Which evidence the BSI asks for, in what order, with what documentation depth. What has to be ready before the audit.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:audit", "topic:how-to", "audience:ciso", "audience:ceo", "level:intermediate"], subCategory: "Anleitungen", audience: ["ciso", "ceo"], relatedSlugs: ["nis2-requirements", "nis2-meldepflicht"] },
      { slug: "wie-bsi-vorfall-melden-24h", slugs: { de: "wie-bsi-vorfall-melden-24h", en: "how-to-report-incident-bsi-24h", nl: "hoe-incident-melden-bsi-24h" }, titleDe: "Wie melde ich einen Vorfall in 24 Stunden an das BSI?", titleEn: "How do I report an incident to the BSI within 24 hours?", summaryDe: "Artikel 23 NIS 2 und §32 BSIG: Frühwarnung 24h, Meldung 72h, Abschlussbericht 1 Monat. Was rein muss, was draußen bleibt, wer entscheidet.", summaryEn: "Article 23 NIS 2 and §32 BSIG: early warning 24h, notification 72h, final report 1 month. What goes in, what stays out, who decides.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:incident-reporting", "topic:how-to", "audience:ciso", "audience:it-leiter", "level:intermediate"], subCategory: "Anleitungen", audience: ["ciso", "it-leiter"], relatedSlugs: ["nis2-meldepflicht", "erheblicher-sicherheitsvorfall"] },
      { slug: "nis2-raci-60-personen", slugs: { de: "nis2-raci-60-personen", en: "nis2-raci-60-people", nl: "nis2-raci-60-personen" }, titleDe: "RACI für NIS 2 in einer 60-Personen-Einrichtung", titleEn: "RACI for NIS 2 in a 60-person organisation", summaryDe: "Fünf Kernrollen, zehn NIS 2 Pflichten. Art. 20 NIS 2 legt Accountable kraft Gesetzes auf die Geschäftsführung. Die Matrix benennt, wer die Arbeit konkret macht und wer welche Freigabe zeichnet.", summaryEn: "Five core roles, ten NIS 2 obligations. Art. 20 NIS 2 puts Accountable on the management body by law. The matrix names who actually does the work and who signs which approval.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:governance", "topic:raci", "audience:ceo", "audience:ciso", "audience:dpo", "level:intermediate"], subCategory: "Governance", audience: ["ceo", "ciso", "dpo"], relatedSlugs: ["geschaftsfuhrerhaftung", "geschaeftsleitungs-schulung-nis2", "nis2-fuer-management"] },
    ],
  },
  "recht-und-folgen": {
    slug: "recht-und-folgen",
    slugs: CATEGORY_SLUGS["recht-und-folgen"],
    titleDe: "Recht und Folgen",
    titleEn: "Law and consequences",
    questionDe: "Was passiert, wenn ich es nicht mache?",
    questionEn: "What happens if I don't comply?",
    entries: [
      {
        slug: "geschaftsfuhrerhaftung",
        slugs: { de: "geschaftsfuhrerhaftung", en: "management-liability", nl: "bestuurdersaansprakelijkheid" },
        titleDe: "Geschäftsführerhaftung nach §38 BSIG",
        titleEn: "Director liability under §38 BSIG",
        summaryDe: "Persönliche Haftung der Geschäftsleitung — was Sie wirklich schulden.",
        summaryEn: "Personal liability of management — what you actually owe.",
        tags: [
          "regulation:nis2",
          "regulation:bsig",
          "topic:liability",
          "topic:management-body",
          "audience:ceo",
          "level:intermediate",
        ],
        subCategory: "Haftung",
        audience: ["ceo", "lawyer"],
        relatedSlugs: ["nis2-bussgelder", "what-is-nis2"],
      },
      {
        slug: "nis2-bussgelder",
        slugs: { de: "nis2-bussgelder", en: "nis2-fines", nl: "nis2-boetes" },
        titleDe: "NIS 2 Bußgelder",
        titleEn: "NIS 2 fines",
        summaryDe: "§65 BSIG und Art. 32 NIS 2 — Höhe, Berechnung, Verfahren.",
        summaryEn: "§65 BSIG and Art. 32 NIS 2 — amount, calculation, procedure.",
        tags: [
          "regulation:nis2",
          "regulation:bsig",
          "topic:fines",
          "topic:enforcement",
          "audience:ceo",
          "level:beginner",
        ],
        subCategory: "Sanktionen",
        audience: ["ceo", "lawyer"],
        relatedSlugs: ["geschaftsfuhrerhaftung", "nis2-registrierung-verpasst"],
      },
      { slug: "nis2-cyber-versicherung", slugs: { de: "nis2-cyber-versicherung", en: "nis2-cyber-insurance", nl: "nis2-cyberverzekering" }, titleDe: "Cyber-Versicherung und NIS 2", titleEn: "Cyber insurance and NIS 2", summaryDe: "Was eine Cyberpolice gegenüber Artikel 21(1) NIS 2 wirklich abdeckt — und was nicht.", summaryEn: "What a cyber insurance policy actually covers against Article 21(1) NIS 2, and what it does not.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:insurance", "topic:risk-transfer", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Haftung", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-haftung-vorstand", "geschaftsfuhrerhaftung"] },
      { slug: "nis2-haftung-vorstand", slugs: { de: "nis2-haftung-vorstand", en: "nis2-board-liability", nl: "nis2-bestuursaansprakelijkheid" }, titleDe: "Persönliche Haftung des Vorstands unter NIS 2", titleEn: "Personal liability of the management body under NIS 2", summaryDe: "§38 BSIG plus §43 GmbHG und §93 AktG: die Haftungslandschaft im Detail.", summaryEn: "§38 BSIG plus §43 GmbHG and §93 AktG: the liability landscape in detail.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:liability", "topic:management-body", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Haftung", audience: ["ceo", "lawyer"], relatedSlugs: ["geschaftsfuhrerhaftung", "nis2-cyber-versicherung"] },
      { slug: "nis2-lieferantenvertraege-klauseln", slugs: { de: "nis2-lieferantenvertraege-klauseln", en: "nis2-supplier-contract-clauses", nl: "nis2-leverancierscontract-clausules" }, titleDe: "Lieferantenverträge: Klauseln nach Art. 21(2)(d) NIS 2", titleEn: "Supplier contracts: clauses for Art. 21(2)(d) NIS 2", summaryDe: "Welche Vertragsklauseln Artikel 21(2)(d) NIS 2 erwartet — und welche nicht ausreichen.", summaryEn: "Which contractual clauses Article 21(2)(d) NIS 2 expects, and which are not enough.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:supply-chain", "topic:contracts", "audience:lawyer", "audience:procurement", "level:intermediate"], subCategory: "Lieferanten", audience: ["lawyer", "ceo"], relatedSlugs: ["nis2-lieferkette", "zulieferer-keine-einrichtung"] },
      { slug: "nis2-bsi-bescheid-widerspruch", slugs: { de: "nis2-bsi-bescheid-widerspruch", en: "nis2-bsi-notice-objection", nl: "nis2-bsi-besluit-bezwaar" }, titleDe: "BSI-Bescheid: Widerspruch und Klage", titleEn: "BSI notice: objection and judicial review", summaryDe: "Wenn das BSI einen Bescheid nach §61 oder §64 BSIG erlässt — Fristen, Wege, Folgen.", summaryEn: "When the BSI issues a notice under §61 or §64 BSIG — deadlines, paths, consequences.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:enforcement", "topic:legal-procedure", "audience:lawyer", "audience:ceo", "level:advanced"], subCategory: "Verfahren", audience: ["lawyer", "ceo"], relatedSlugs: ["nis2-bussgeld-verfahren-ablauf", "nis2-bussgelder"] },
      { slug: "nis2-bussgeld-verfahren-ablauf", slugs: { de: "nis2-bussgeld-verfahren-ablauf", en: "nis2-fine-procedure-process", nl: "nis2-boete-procedure-verloop" }, titleDe: "Bußgeldverfahren nach §65 BSIG: Ablauf", titleEn: "Fine procedure under §65 BSIG: how it runs", summaryDe: "Vom Anhörungsschreiben bis zum Bescheid — wie das BSI ein Bußgeld bemisst.", summaryEn: "From the hearing letter to the notice — how the BSI calculates a fine.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:fines", "topic:enforcement", "audience:lawyer", "audience:ceo", "level:advanced"], subCategory: "Sanktionen", audience: ["lawyer", "ceo"], relatedSlugs: ["nis2-bussgelder", "nis2-bsi-bescheid-widerspruch"] },
      { slug: "nis2-whistleblower-hinweise", slugs: { de: "nis2-whistleblower-hinweise", en: "nis2-whistleblower-reports", nl: "nis2-klokkenluider-meldingen" }, titleDe: "Whistleblower-Hinweise zu NIS 2", titleEn: "Whistleblower reports about NIS 2 issues", summaryDe: "Hinweisgeberschutzgesetz und NIS 2: wie interne Meldungen zu Compliance-Verstößen ablaufen.", summaryEn: "The German Hinweisgeberschutzgesetz and NIS 2: how internal reports about compliance failures run.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:whistleblower", "topic:compliance", "audience:compliance", "audience:hr", "level:intermediate"], subCategory: "Meldungen", audience: ["compliance", "lawyer"], relatedSlugs: ["nis2-meldepflicht", "geschaftsfuhrerhaftung"] },
      { slug: "geschaeftsfuehrerwechsel-nis2", slugs: { de: "geschaeftsfuehrerwechsel-nis2", en: "management-body-change-nis2", nl: "bestuurderswisseling-nis2" }, titleDe: "Geschäftsführerwechsel — NIS 2 Verantwortung sicher übergeben", titleEn: "Management body change — transferring NIS 2 responsibility safely", summaryDe: "Drei Pflichten am Tag der Bestellung: §33(5) BSIG Aktualisierung in 2 Wochen, §38 BSIG Schulung für das neue Mitglied, Art. 20 NIS 2 Billigung und Übernahme bestehender Freigaben.", summaryEn: "Three duties activating on appointment day: §33(5) BSIG registry update within 2 weeks, §38 BSIG training for the new member, Art. 20 NIS 2 approval continuity for existing risk acceptances.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:governance", "topic:management-body", "topic:handover", "audience:ceo", "audience:hr", "audience:lawyer", "level:intermediate"], subCategory: "Governance", audience: ["ceo", "lawyer"], relatedSlugs: ["geschaftsfuhrerhaftung", "nis2-raci-60-personen", "geschaeftsleitungs-schulung-nis2", "nis2-registrierung"] },
    ],
  },
  vergleich: {
    slug: "vergleich",
    slugs: CATEGORY_SLUGS.vergleich,
    titleDe: "Vergleich",
    titleEn: "Comparisons",
    questionDe: "Wie passt das mit dem zusammen, was ich schon habe?",
    questionEn: "How does this fit with what I already have?",
    entries: [
      {
        slug: "nis2-vs-kritis",
        slugs: de("nis2-vs-kritis"),
        titleDe: "NIS 2 vs KRITIS",
        titleEn: "NIS 2 vs KRITIS",
        summaryDe: "Der Unterschied zwischen NIS 2 Einrichtung und Betreiber kritischer Anlagen.",
        summaryEn: "The difference between NIS 2 entity and KRITIS operator.",
      },
      {
        slug: "nis2-iso-27001",
        slugs: de("nis2-iso-27001"),
        titleDe: "NIS 2 und ISO 27001",
        titleEn: "NIS 2 and ISO 27001",
        summaryDe: "Wie viel Überlapp gibt es wirklich? Was ISO 27001 nicht abdeckt.",
        summaryEn: "How much overlap is there really? What ISO 27001 doesn't cover.",
      },
      {
        slug: "grc-vergleich",
        slugs: { de: "grc-vergleich", en: "grc-pricing-comparison", nl: "grc-prijsvergelijking" },
        titleDe: "GRC-Tools im Vergleich",
        titleEn: "GRC tools compared",
        summaryDe: "150+ GRC- und ISMS-Tools mit Preisen, Funktionen und EU-Eignung.",
        summaryEn: "150+ GRC and ISMS tools with pricing, features and EU fit.",
      },
      {
        slug: "nis2-europaeischer-standard",
        slugs: { de: "nis2-europaeischer-standard", en: "nis2-european-standard", nl: "nis2-europese-norm" },
        titleDe: "NIS 2 als europäischer Standard",
        titleEn: "NIS 2 as a European standard",
        summaryDe: "Warum NIS 2 ein einheitlicher EU-Standard ist und wie nationale Umsetzungen abweichen.",
        summaryEn: "Why NIS 2 is a unified EU standard and how national transpositions diverge.",
      },
      { slug: "nis2-vs-dora-finanzsektor", slugs: { de: "nis2-vs-dora-finanzsektor", en: "nis2-vs-dora-financial", nl: "nis2-vs-dora-financieel" }, titleDe: "NIS 2 oder DORA — was gilt für den Finanzsektor?", titleEn: "NIS 2 or DORA — what applies to financial entities?", summaryDe: "Artikel 4 NIS 2 (lex specialis) gibt Risikomanagement und Meldepflichten an DORA ab. Was bleibt unter NIS 2: Registrierung nach Artikel 27.", summaryEn: "Article 4 NIS 2 (lex specialis) hands risk management and incident reporting over to DORA. What stays under NIS 2: registration under Article 27.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:dora", "topic:lex-specialis", "topic:financial-sector", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Sektor-Überlapp", audience: ["ceo", "lawyer"], relatedSlugs: ["bin-ich-bank-nis2", "wer-ist-betroffen-vollstaendiger-test"] },
      { slug: "nis2-und-dsgvo-schnittmenge", slugs: { de: "nis2-und-dsgvo-schnittmenge", en: "nis2-and-gdpr-overlap", nl: "nis2-en-avg-overlap" }, titleDe: "NIS 2 und DSGVO — die Schnittmenge", titleEn: "NIS 2 and GDPR — the overlap", summaryDe: "Artikel 32 DSGVO (Sicherheit der Verarbeitung) deckt einiges aus Artikel 21 NIS 2 ab. Doppelmeldungen bei Vorfällen, getrennte Aufsichten, gemeinsame Nachweise.", summaryEn: "GDPR Article 32 (security of processing) covers parts of NIS 2 Article 21. Dual notifications on incidents, separate supervisors, shared evidence.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:gdpr", "topic:overlap", "topic:incident-reporting", "audience:ceo", "audience:lawyer", "audience:ciso", "level:intermediate"], subCategory: "Regulierungs-Überlapp", audience: ["ceo", "lawyer", "ciso"], relatedSlugs: ["nis2-meldepflicht", "nis2-risikomanagement"] },
      { slug: "nis2-und-kritis-gleichzeitig-pflichten", slugs: { de: "nis2-und-kritis-gleichzeitig-pflichten", en: "nis2-and-kritis-simultaneous-duties", nl: "nis2-en-kritis-gelijktijdig" }, titleDe: "NIS 2 und KRITIS gleichzeitig — welche Pflichten greifen?", titleEn: "NIS 2 and KRITIS simultaneously — which duties apply?", summaryDe: "Wer beide Regime trifft: BSIG-Maßnahmen plus KRITIS-Audit alle drei Jahre (§65 BSIG), zusätzliche Meldungen, strengere Aufsichtszyklen.", summaryEn: "Who hits both regimes: BSIG measures plus KRITIS audit every three years (§65 BSIG), additional notifications, stricter supervisory cycles.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "regulation:kritis", "topic:overlap", "topic:audit", "audience:ceo", "audience:ciso", "level:intermediate"], subCategory: "Regulierungs-Überlapp", audience: ["ceo", "ciso"], relatedSlugs: ["nis2-vs-kritis", "bin-ich-stadtwerk-nis2"] },
      { slug: "nis2-vs-cer-richtlinie", slugs: { de: "nis2-vs-cer-richtlinie", en: "nis2-vs-cer-directive", nl: "nis2-vs-cer-richtlijn" }, titleDe: "NIS 2 und die CER-Richtlinie im Vergleich", titleEn: "NIS 2 and the CER Directive compared", summaryDe: "Cyber-Resilienz (NIS 2) und physische Resilienz (CER 2022/2557) für dieselben kritischen Einrichtungen: zwei Richtlinien, ein Anlagenkreis.", summaryEn: "Cyber resilience (NIS 2) and physical resilience (CER 2022/2557) for the same critical entities: two directives, one set of operators.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:cer", "topic:overlap", "topic:critical-entities", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Regulierungs-Überlapp", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-und-kritis-gleichzeitig-pflichten", "nis2-vs-kritis"] },
    ],
  },
  "zeit-und-status": {
    slug: "zeit-und-status",
    slugs: CATEGORY_SLUGS["zeit-und-status"],
    titleDe: "Zeit und Status",
    titleEn: "Timelines and status",
    questionDe: "Was sind die Fristen?",
    questionEn: "What are the deadlines?",
    entries: [
      {
        slug: "nis2-timeline",
        slugs: { de: "nis2-timeline", en: "nis2-timeline", nl: "nis2-tijdlijn" },
        titleDe: "NIS 2 Zeitleiste",
        titleEn: "NIS 2 timeline",
        summaryDe: "Alle EU- und nationalen Meilensteine von 2022 bis heute.",
        summaryEn: "All EU and national milestones from 2022 to today.",
      },
      {
        slug: "nis2-in-germany",
        slugs: { de: "nis2-in-germany", en: "nis2-in-germany", nl: "nis2-in-duitsland" },
        titleDe: "NIS 2 in Deutschland",
        titleEn: "NIS 2 in Germany",
        summaryDe: "BSIG, BSI, deutscher Umsetzungsstand und nächste Schritte.",
        summaryEn: "BSIG, BSI, German implementation status and next steps.",
      },
      {
        slug: "nis2-umsetzung-europa",
        slugs: { de: "nis2-umsetzung-europa", en: "nis2-eu-implementation", nl: "nis2-eu-implementatie" },
        titleDe: "NIS 2 Umsetzungsstand in Europa",
        titleEn: "NIS 2 transposition across Europe",
        summaryDe: "Welche Mitgliedstaaten sind fertig, welche hinken hinterher.",
        summaryEn: "Which member states are done, which are behind.",
      },
      {
        slug: "nis2umsucg",
        slugs: {
          de: "nis2umsucg",
          en: "nis2umsucg-german-transposition",
          nl: "nis2umsucg-duitse-omzetting",
        },
        titleDe: "NIS2UmsuCG — das deutsche Umsetzungsgesetz",
        titleEn: "NIS2UmsuCG — Germany's transposition law",
        summaryDe:
          "Das NIS2-Umsetzungs- und Cybersicherheitsstärkungsgesetz setzt die NIS 2 Richtlinie in deutsches Recht um. Was es ändert, wo es steht (Stand 2026), und warum Deutschland die EU-Frist verpasst hat.",
        summaryEn:
          "The NIS2 Implementation and Cybersecurity Strengthening Act puts the NIS 2 Directive into German law. What it changes, where it stands (as of 2026) and why Germany missed the EU deadline.",
        tags: [
          "regulation:nis2",
          "regulation:bsig",
          "topic:transposition",
          "topic:germany",
          "topic:deadline",
          "audience:ceo",
          "audience:lawyer",
          "level:intermediate",
        ],
        subCategory: "Deutschland",
        audience: ["ceo", "lawyer"],
        relatedSlugs: ["nis2-in-germany", "nis2-timeline"],
      },
      { slug: "nis2-status-niederlande", slugs: { de: "nis2-status-niederlande", en: "nis2-status-netherlands", nl: "nis2-status-nederland" }, titleDe: "NIS 2 Umsetzungsstand Niederlande", titleEn: "NIS 2 implementation status: Netherlands", summaryDe: "Cyberbeveiligingswet, RDI und NCSC-NL — wie die Niederlande NIS 2 umsetzen.", summaryEn: "Cyberbeveiligingswet, RDI and NCSC-NL — how the Netherlands implements NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:netherlands", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Niederlande", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-status-oesterreich"] },
      { slug: "nis2-status-oesterreich", slugs: { de: "nis2-status-oesterreich", en: "nis2-status-austria", nl: "nis2-status-oostenrijk" }, titleDe: "NIS 2 Umsetzungsstand Österreich", titleEn: "NIS 2 implementation status: Austria", summaryDe: "NISG, BMI und GovCERT.AT — wie Österreich NIS 2 in Landesrecht überführt.", summaryEn: "NISG, BMI and GovCERT.AT — how Austria transposes NIS 2 into national law.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:austria", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Österreich", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-status-niederlande"] },
      { slug: "nis2-status-frankreich", slugs: { de: "nis2-status-frankreich", en: "nis2-status-france", nl: "nis2-status-frankrijk" }, titleDe: "NIS 2 Umsetzungsstand Frankreich", titleEn: "NIS 2 implementation status: France", summaryDe: "Ordonnance 2024-1093, ANSSI und die französische Aufsicht — wie Frankreich NIS 2 umsetzt.", summaryEn: "Ordonnance 2024-1093, ANSSI and French supervision — how France implements NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:france", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Frankreich", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-status-niederlande"] },
      { slug: "nis2-status-spanien", slugs: { de: "nis2-status-spanien", en: "nis2-status-spain", nl: "nis2-status-spanje" }, titleDe: "NIS 2 Umsetzungsstand Spanien", titleEn: "NIS 2 implementation status: Spain", summaryDe: "Real Decreto-ley und der spanische CSIRT-Verbund INCIBE-CERT plus CCN-CERT — wie Spanien NIS 2 umsetzt.", summaryEn: "Real Decreto-ley and the Spanish CSIRT network INCIBE-CERT plus CCN-CERT — how Spain implements NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:spain", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Spanien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-italien", slugs: { de: "nis2-status-italien", en: "nis2-status-italy", nl: "nis2-status-italie" }, titleDe: "NIS 2 Umsetzungsstand Italien", titleEn: "NIS 2 implementation status: Italy", summaryDe: "Decreto Legislativo n. 138/2024 und die Agenzia per la Cybersicurezza Nazionale (ACN) — wie Italien NIS 2 umsetzt.", summaryEn: "Decreto Legislativo n. 138/2024 and the Agenzia per la Cybersicurezza Nazionale (ACN) — how Italy implements NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:italy", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Italien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-belgien", slugs: { de: "nis2-status-belgien", en: "nis2-status-belgium", nl: "nis2-status-belgie" }, titleDe: "NIS 2 Umsetzungsstand Belgien", titleEn: "NIS 2 implementation status: Belgium", summaryDe: "Loi NIS 2 vom 26. April 2024 und das Centre for Cybersecurity Belgium (CCB) — wie Belgien NIS 2 umsetzt.", summaryEn: "Belgian NIS 2 law of 26 April 2024 and the Centre for Cybersecurity Belgium (CCB) — how Belgium implements NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:belgium", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Belgien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-polen", slugs: { de: "nis2-status-polen", en: "nis2-status-poland", nl: "nis2-status-polen" }, titleDe: "NIS 2 Umsetzungsstand Polen", titleEn: "NIS 2 implementation status: Poland", summaryDe: "Novelle des Ustawa o krajowym systemie cyberbezpieczeństwa (KSC) und CSIRT NASK plus CSIRT GOV — wie Polen NIS 2 umsetzt.", summaryEn: "Amendment to the Polish National Cybersecurity Act (KSC) and CSIRT NASK plus CSIRT GOV — how Poland implements NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:poland", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Polen", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-schweden", slugs: { de: "nis2-status-schweden", en: "nis2-status-sweden", nl: "nis2-status-zweden" }, titleDe: "NIS 2 Umsetzungsstand Schweden", titleEn: "NIS 2 implementation status: Sweden", summaryDe: "Schwedische NIS 2 Umsetzung, MSB (Myndigheten för samhällsskydd och beredskap) und CERT-SE.", summaryEn: "Swedish NIS 2 transposition, MSB (Swedish Civil Contingencies Agency) and CERT-SE.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:sweden", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Schweden", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-daenemark", slugs: { de: "nis2-status-daenemark", en: "nis2-status-denmark", nl: "nis2-status-denemarken" }, titleDe: "NIS 2 Umsetzungsstand Dänemark", titleEn: "NIS 2 implementation status: Denmark", summaryDe: "Dänische NIS 2 Umsetzung, CFCS (Centre for Cyber Security) und der sektorielle Aufsichtsansatz.", summaryEn: "Danish NIS 2 transposition, CFCS (Centre for Cyber Security) and the sectoral supervision model.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:denmark", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Dänemark", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-portugal", slugs: { de: "nis2-status-portugal", en: "nis2-status-portugal", nl: "nis2-status-portugal" }, titleDe: "NIS 2 Umsetzungsstand Portugal", titleEn: "NIS 2 implementation status: Portugal", summaryDe: "Portugiesische NIS 2 Umsetzung und CNCS (Centro Nacional de Cibersegurança).", summaryEn: "Portuguese NIS 2 transposition and CNCS (National Cybersecurity Centre).", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:portugal", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Portugal", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-irland", slugs: { de: "nis2-status-irland", en: "nis2-status-ireland", nl: "nis2-status-ierland" }, titleDe: "NIS 2 Umsetzungsstand Irland", titleEn: "NIS 2 implementation status: Ireland", summaryDe: "Irische NIS 2 Umsetzung, NCSC-IE und das Department of the Environment, Climate and Communications (DECC).", summaryEn: "Irish NIS 2 transposition, NCSC-IE and the Department of the Environment, Climate and Communications (DECC).", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:ireland", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Irland", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-tschechien", slugs: { de: "nis2-status-tschechien", en: "nis2-status-czech-republic", nl: "nis2-status-tsjechie" }, titleDe: "NIS 2 Umsetzungsstand Tschechien", titleEn: "NIS 2 implementation status: Czech Republic", summaryDe: "Tschechisches Cybersicherheitsgesetz (Zákon o kybernetické bezpečnosti) und NÚKIB als Aufsichtsbehörde.", summaryEn: "Czech Cybersecurity Act (Zákon o kybernetické bezpečnosti) and NÚKIB as supervisory authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:czech", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Tschechien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-ungarn", slugs: { de: "nis2-status-ungarn", en: "nis2-status-hungary", nl: "nis2-status-hongarije" }, titleDe: "NIS 2 Umsetzungsstand Ungarn", titleEn: "NIS 2 implementation status: Hungary", summaryDe: "Ungarisches Cybersicherheitsgesetz (Act XXIII of 2023) und SZTFH als Aufsichtsbehörde — Ungarn war einer der ersten Mitgliedstaaten, die NIS 2 umgesetzt haben.", summaryEn: "Hungarian Cybersecurity Act (Act XXIII of 2023) and SZTFH as supervisory authority — Hungary was one of the first Member States to transpose NIS 2.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:hungary", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Ungarn", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-rumaenien", slugs: { de: "nis2-status-rumaenien", en: "nis2-status-romania", nl: "nis2-status-roemenie" }, titleDe: "NIS 2 Umsetzungsstand Rumänien", titleEn: "NIS 2 implementation status: Romania", summaryDe: "Rumänisches NIS 2 Umsetzungsgesetz (Lege nr. 58/2024) und DNSC als zuständige Behörde.", summaryEn: "Romanian NIS 2 transposition law (Law 58/2024) and DNSC as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:romania", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Rumänien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-griechenland", slugs: { de: "nis2-status-griechenland", en: "nis2-status-greece", nl: "nis2-status-griekenland" }, titleDe: "NIS 2 Umsetzungsstand Griechenland", titleEn: "NIS 2 implementation status: Greece", summaryDe: "Griechisches NIS 2 Umsetzungsgesetz und die Nationale Cybersicherheitsbehörde als zuständige Behörde.", summaryEn: "Greek NIS 2 transposition law and the National Cybersecurity Authority as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:greece", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Griechenland", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-slowakei", slugs: { de: "nis2-status-slowakei", en: "nis2-status-slovakia", nl: "nis2-status-slowakije" }, titleDe: "NIS 2 Umsetzungsstand Slowakei", titleEn: "NIS 2 implementation status: Slovakia", summaryDe: "Slowakisches NIS 2 Umsetzungsgesetz (Zákon č. 366/2024) und NBÚ als zuständige Behörde.", summaryEn: "Slovak NIS 2 transposition law (Act 366/2024) and NBÚ as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:slovakia", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Slowakei", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-bulgarien", slugs: { de: "nis2-status-bulgarien", en: "nis2-status-bulgaria", nl: "nis2-status-bulgarije" }, titleDe: "NIS 2 Umsetzungsstand Bulgarien", titleEn: "NIS 2 implementation status: Bulgaria", summaryDe: "Bulgarisches NIS 2 Umsetzungsgesetz und die e-Government Agency als zuständige Behörde.", summaryEn: "Bulgarian NIS 2 transposition law and the e-Government Agency as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:bulgaria", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Bulgarien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-kroatien", slugs: { de: "nis2-status-kroatien", en: "nis2-status-croatia", nl: "nis2-status-kroatie" }, titleDe: "NIS 2 Umsetzungsstand Kroatien", titleEn: "NIS 2 implementation status: Croatia", summaryDe: "Kroatisches NIS 2 Umsetzungsgesetz (Zakon o kibernetičkoj sigurnosti) und CERT.hr / SOA als zuständige Behörden.", summaryEn: "Croatian NIS 2 transposition law (Zakon o kibernetičkoj sigurnosti) and CERT.hr / SOA as competent authorities.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:croatia", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Kroatien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-luxemburg", slugs: { de: "nis2-status-luxemburg", en: "nis2-status-luxembourg", nl: "nis2-status-luxemburg" }, titleDe: "NIS 2 Umsetzungsstand Luxemburg", titleEn: "NIS 2 implementation status: Luxembourg", summaryDe: "Luxemburgisches NIS 2 Umsetzungsgesetz (Loi du 1er août 2024) und HCPN / ILR als zuständige Behörden.", summaryEn: "Luxembourg NIS 2 transposition law (Law of 1 August 2024) and HCPN / ILR as competent authorities.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:luxembourg", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Luxemburg", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-slowenien", slugs: { de: "nis2-status-slowenien", en: "nis2-status-slovenia", nl: "nis2-status-slovenie" }, titleDe: "NIS 2 Umsetzungsstand Slowenien", titleEn: "NIS 2 implementation status: Slovenia", summaryDe: "Slowenisches NIS 2 Umsetzungsgesetz und URSIV / SI-CERT als zuständige Behörden.", summaryEn: "Slovenian NIS 2 transposition law and URSIV / SI-CERT as competent authorities.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:slovenia", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Slowenien", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-zypern", slugs: { de: "nis2-status-zypern", en: "nis2-status-cyprus", nl: "nis2-status-cyprus" }, titleDe: "NIS 2 Umsetzungsstand Zypern", titleEn: "NIS 2 implementation status: Cyprus", summaryDe: "Zypriotisches NIS 2 Umsetzungsgesetz und DSA (Digital Security Authority) als zuständige Behörde.", summaryEn: "Cypriot NIS 2 transposition law and DSA (Digital Security Authority) as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:cyprus", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Zypern", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-estland", slugs: { de: "nis2-status-estland", en: "nis2-status-estonia", nl: "nis2-status-estland" }, titleDe: "NIS 2 Umsetzungsstand Estland", titleEn: "NIS 2 implementation status: Estonia", summaryDe: "Estnisches Cybersicherheitsgesetz (Küberturvalisuse seadus) und RIA (Riigi Infosüsteemi Amet) als zuständige Behörde.", summaryEn: "Estonian Cybersecurity Act (Küberturvalisuse seadus) and RIA (Information System Authority) as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:estonia", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Estland", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-litauen", slugs: { de: "nis2-status-litauen", en: "nis2-status-lithuania", nl: "nis2-status-litouwen" }, titleDe: "NIS 2 Umsetzungsstand Litauen", titleEn: "NIS 2 implementation status: Lithuania", summaryDe: "Litauisches Cybersicherheitsgesetz (Kibernetinio saugumo įstatymas) und NKSC als zuständige Behörde.", summaryEn: "Lithuanian Cybersecurity Act (Kibernetinio saugumo įstatymas) and NKSC as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:lithuania", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Litauen", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-lettland", slugs: { de: "nis2-status-lettland", en: "nis2-status-latvia", nl: "nis2-status-letland" }, titleDe: "NIS 2 Umsetzungsstand Lettland", titleEn: "NIS 2 implementation status: Latvia", summaryDe: "Lettisches Cybersicherheitsgesetz (Kiberdrošības likums) und CERT.LV als zuständige Behörde.", summaryEn: "Latvian Cybersecurity Act (Kiberdrošības likums) and CERT.LV as competent authority.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:latvia", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Lettland", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-malta", slugs: { de: "nis2-status-malta", en: "nis2-status-malta", nl: "nis2-status-malta" }, titleDe: "NIS 2 Umsetzungsstand Malta", titleEn: "NIS 2 implementation status: Malta", summaryDe: "Maltesisches NIS 2 Umsetzungsgesetz (Legal Notice 71/2025) und CIPD / CSIRTMalta als zuständige Behörden.", summaryEn: "Maltese NIS 2 transposition law (Legal Notice 71/2025) and CIPD / CSIRTMalta as competent authorities.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:malta", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Malta", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-status-finnland", slugs: { de: "nis2-status-finnland", en: "nis2-status-finland", nl: "nis2-status-finland" }, titleDe: "NIS 2 Umsetzungsstand Finnland", titleEn: "NIS 2 implementation status: Finland", summaryDe: "Finnische NIS 2 Umsetzung, Traficom und NCSC-FI.", summaryEn: "Finnish NIS 2 transposition, Traficom and NCSC-FI.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:finland", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Finnland", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"] },
      { slug: "nis2-tracker-eu", slugs: { de: "nis2-tracker-eu", en: "nis2-eu-tracker", nl: "nis2-eu-tracker" }, titleDe: "NIS 2 EU-Umsetzungstracker: alle 27 Mitgliedstaaten", titleEn: "NIS 2 EU implementation tracker: all 27 Member States", summaryDe: "Stand der NIS 2 Umsetzung in allen 27 EU-Mitgliedstaaten in einer Tabelle: nationales Gesetz, zuständige Behörde, Stand des Verfahrens.", summaryEn: "Status of NIS 2 transposition across all 27 EU Member States in a single table: national act, competent authority, status of the procedure.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "topic:transposition", "topic:eu", "audience:ceo", "audience:lawyer", "level:beginner"], subCategory: "EU-weit", audience: ["ceo", "lawyer"], relatedSlugs: ["nis2-umsetzung-europa", "nis2-in-germany"] },
    ],
  },
  troubleshooting: {
    slug: "troubleshooting",
    slugs: CATEGORY_SLUGS.troubleshooting,
    titleDe: "Troubleshooting",
    titleEn: "Troubleshooting",
    questionDe: "Was tun, wenn etwas schiefläuft?",
    questionEn: "What to do when something goes wrong?",
    entries: [
      {
        slug: "nis2-registrierung-verpasst",
        slugs: { de: "nis2-registrierung-verpasst", en: "nis2-registration-missed", nl: "nis2-registratie-gemist" },
        titleDe: "BSI-Registrierung verpasst — was nun?",
        titleEn: "Missed the BSI registration deadline — now what?",
        summaryDe: "Frist verpasst, Bußgeldrisiko, Nachregistrierung und Kommunikation mit dem BSI.",
        summaryEn: "Deadline missed, fine risk, late registration and BSI communication.",
      },
      { slug: "ransomware-was-tun-nis2", slugs: { de: "ransomware-was-tun-nis2", en: "ransomware-what-to-do-nis2", nl: "ransomware-wat-te-doen-nis2" }, titleDe: "Ransomware-Angriff — was unter NIS 2 sofort zu tun ist", titleEn: "Ransomware attack — what to do immediately under NIS 2", summaryDe: "Erste 24 Stunden: Eindämmung, Frühwarnung an das BSI (Artikel 23), Krisenkommunikation, Zahlungsentscheidung, Nachweise sichern. Was rechtlich pflicht ist, was nicht.", summaryEn: "First 24 hours: containment, early warning to BSI (Article 23), crisis communication, payment decision, evidence preservation. What is legally required, what is not.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:incident-response", "topic:ransomware", "topic:crisis", "audience:ceo", "audience:ciso", "level:beginner"], subCategory: "Vorfälle", audience: ["ceo", "ciso"], relatedSlugs: ["wie-bsi-vorfall-melden-24h", "nis2-vorfallbehandlung"] },
      { slug: "phishing-vorfall-nis2", slugs: { de: "phishing-vorfall-nis2", en: "phishing-incident-nis2", nl: "phishing-incident-nis2" }, titleDe: "Phishing-Vorfall — ist das ein erheblicher Sicherheitsvorfall?", titleEn: "Phishing incident — is this a significant incident under NIS 2?", summaryDe: "Wann eine Phishing-Welle die Schwelle nach CIR §11.6 reißt und wie die Frühwarnung an das BSI aussieht.", summaryEn: "When a phishing wave crosses the CIR §11.6 threshold and how the early warning to the BSI looks.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:incident-response", "topic:phishing", "audience:ciso", "audience:soc", "level:beginner"], subCategory: "Vorfälle", audience: ["ciso", "soc"], relatedSlugs: ["wie-bsi-vorfall-melden-24h", "nis2-vorfallbehandlung"] },
      { slug: "ddos-angriff-nis2", slugs: { de: "ddos-angriff-nis2", en: "ddos-attack-nis2", nl: "ddos-aanval-nis2" }, titleDe: "DDoS-Angriff — Eindämmung und Meldung unter NIS 2", titleEn: "DDoS attack — mitigation and reporting under NIS 2", summaryDe: "Erkennung, Eindämmung am ISP, §32 BSIG-Meldung und Auswertung nach dem Angriff.", summaryEn: "Detection, mitigation at the ISP, §32 BSIG notification, and post-incident review.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:incident-response", "topic:ddos", "audience:ciso", "audience:soc", "level:beginner"], subCategory: "Vorfälle", audience: ["ciso", "soc"], relatedSlugs: ["wie-bsi-vorfall-melden-24h", "nis2-netzsicherheit"] },
      { slug: "lieferant-gehackt-nis2", slugs: { de: "lieferant-gehackt-nis2", en: "supplier-breach-nis2", nl: "leverancier-gehackt-nis2" }, titleDe: "Lieferant gehackt — eigene Pflichten unter NIS 2", titleEn: "Supplier breached — your own NIS 2 duties", summaryDe: "Wann ein Vorfall beim Lieferanten zur eigenen Frühwarnung führt, was Artikel 21(2)(d) verlangt.", summaryEn: "When a supplier breach forces your own early warning, what Article 21(2)(d) requires.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:supply-chain", "topic:incident-response", "audience:ciso", "audience:procurement", "level:intermediate"], subCategory: "Vorfälle", audience: ["ciso", "ceo"], relatedSlugs: ["nis2-lieferkette", "nis2-lieferantenvertraege-klauseln"] },
      { slug: "cloud-anbieter-ausgefallen-nis2", slugs: { de: "cloud-anbieter-ausgefallen-nis2", en: "cloud-provider-outage-nis2", nl: "cloud-aanbieder-uitval-nis2" }, titleDe: "Cloud-Anbieter ausgefallen — meldepflichtig unter NIS 2?", titleEn: "Cloud provider outage — reportable under NIS 2?", summaryDe: "Wann eine Cloud-Störung als erheblicher Vorfall gilt und welche Schritte das Risikomanagement nach Artikel 21(2)(c) verlangt.", summaryEn: "When a cloud outage counts as a significant incident and which Article 21(2)(c) steps risk management requires.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:incident-response", "topic:cloud", "audience:ciso", "audience:ceo", "level:intermediate"], subCategory: "Vorfälle", audience: ["ciso", "ceo"], relatedSlugs: ["bin-ich-cloud-anbieter-nis2", "nis2-business-continuity"] },
      { slug: "bsi-anfrage-erhalten", slugs: { de: "bsi-anfrage-erhalten", en: "received-bsi-request", nl: "bsi-verzoek-ontvangen" }, titleDe: "BSI-Anfrage erhalten — wie reagieren?", titleEn: "Received a BSI request — how to respond", summaryDe: "Der erste Brief nach §64 BSIG: Fristen, Mitwirkungspflicht, sinnvoller Beistand, was nicht zu tun ist.", summaryEn: "The first §64 BSIG letter: deadlines, cooperation duty, sensible counsel, what not to do.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:bsig", "topic:enforcement", "topic:legal-procedure", "audience:ceo", "audience:lawyer", "level:intermediate"], subCategory: "Aufsicht", audience: ["ceo", "lawyer"], relatedSlugs: ["wie-bsi-audit-vorbereiten", "nis2-bsi-bescheid-widerspruch"] },
      { slug: "datenleck-nis2-dsgvo-parallel", slugs: { de: "datenleck-nis2-dsgvo-parallel", en: "data-breach-nis2-gdpr-parallel", nl: "datalek-nis2-avg-parallel" }, titleDe: "Datenleck — NIS 2 und DSGVO gleichzeitig", titleEn: "Data breach — NIS 2 and GDPR in parallel", summaryDe: "Zwei Aufsichten, zwei Uhren, eine Untersuchung: wie Artikel 23 NIS 2 und Artikel 33 DSGVO parallel laufen.", summaryEn: "Two supervisors, two clocks, one investigation: how Article 23 NIS 2 and Article 33 GDPR run in parallel.", authorSlug: "simon-orzel", tags: ["regulation:nis2", "regulation:gdpr", "topic:incident-response", "topic:data-breach", "audience:dpo", "audience:ciso", "level:intermediate"], subCategory: "Vorfälle", audience: ["dpo", "ciso"], relatedSlugs: ["nis2-und-dsgvo-schnittmenge", "wie-bsi-vorfall-melden-24h"] },
    ],
  },
};

// ── Derivation helpers ──────────────────────────────────────────────

/** All entries in a category, filtered to those whose publishAt has elapsed (or who have no publishAt). */
export function publishedEntries(cat: WikiTopLevel): WikiTocEntry[] {
  return WIKI_TOC[cat].entries.filter((e) => isPublished(e.slug));
}

/**
 * Top-level categories with their meta + count of *published* entries.
 * Drives /wiki hub tiles. Scheduled-but-not-yet-live entries are
 * excluded from the count so the hub does not advertise pages that
 * cannot be reached.
 */
export function topLevelSummary(): Array<WikiCategoryMeta & { count: number }> {
  return WIKI_TOP_LEVEL.map((cat) => {
    const published = publishedEntries(cat);
    return {
      ...WIKI_TOC[cat],
      // Override entries with the published-only subset so consumers (hub
      // tiles, search index, category index) never surface a page that
      // 404s when scheduled-but-not-yet-live.
      entries: published,
      count: published.length,
    };
  });
}

/**
 * Build the next-intl pathnames entries for /wiki. Includes the hub,
 * the 8 category indexes, and each individual page. The canonical key
 * (used for `<Link href="...">`) is always the German-slug path.
 */
export function wikiPathnames(): Record<string, PerLocaleSlug> {
  const result: Record<string, PerLocaleSlug> = {
    "/wiki": { de: "/wiki", en: "/wiki", nl: "/wiki" },
  };

  for (const cat of WIKI_TOP_LEVEL) {
    const meta = WIKI_TOC[cat];
    result[`/wiki/${cat}`] = {
      de: `/wiki/${meta.slugs.de}`,
      en: `/wiki/${meta.slugs.en}`,
      nl: `/wiki/${meta.slugs.nl}`,
    };
    for (const entry of meta.entries) {
      result[`/wiki/${cat}/${entry.slug}`] = {
        de: `/wiki/${meta.slugs.de}/${entry.slugs.de}`,
        en: `/wiki/${meta.slugs.en}/${entry.slugs.en}`,
        nl: `/wiki/${meta.slugs.nl}/${entry.slugs.nl}`,
      };
    }
  }

  return result;
}

/**
 * Sitemap entries for /wiki — the hub + 8 category indexes + 33 pages.
 * Returns canonical paths (German-slug) that sitemap.ts feeds through
 * `multilingualEntries()` to emit the three locale variants.
 *
 * Filters out entries whose publishAt is still in the future so Google
 * does not crawl pages that 404 in production.
 */
export function wikiSitemapPaths(): Array<{ path: string; priority: number }> {
  const out: Array<{ path: string; priority: number }> = [
    { path: "/wiki", priority: 0.8 },
  ];
  for (const cat of WIKI_TOP_LEVEL) {
    out.push({ path: `/wiki/${cat}`, priority: 0.7 });
    for (const entry of publishedEntries(cat)) {
      out.push({ path: `/wiki/${cat}/${entry.slug}`, priority: 0.6 });
    }
  }
  return out;
}

/**
 * Short-lived /docs/* → /wiki/* redirects. The first iteration of the
 * content hub shipped at /docs; we renamed to /wiki the same day. Any
 * /docs URL that escaped (linked from social, cached search snippets,
 * internal docs that hadn't been updated) 301s to the matching /wiki
 * path, per locale.
 */
export function docsToWikiRedirects(): Array<{
  source: string;
  destination: string;
  permanent: boolean;
}> {
  const out: Array<{ source: string; destination: string; permanent: boolean }> = [
    { source: "/docs", destination: "/wiki", permanent: true },
    { source: "/en/docs", destination: "/en/wiki", permanent: true },
    { source: "/nl/docs", destination: "/nl/wiki", permanent: true },
  ];
  for (const cat of WIKI_TOP_LEVEL) {
    const meta = WIKI_TOC[cat];
    out.push(
      { source: `/docs/${meta.slugs.de}`, destination: `/wiki/${meta.slugs.de}`, permanent: true },
      { source: `/en/docs/${meta.slugs.en}`, destination: `/en/wiki/${meta.slugs.en}`, permanent: true },
      { source: `/nl/docs/${meta.slugs.nl}`, destination: `/nl/wiki/${meta.slugs.nl}`, permanent: true },
    );
    for (const entry of meta.entries) {
      out.push(
        {
          source: `/docs/${meta.slugs.de}/${entry.slugs.de}`,
          destination: `/wiki/${meta.slugs.de}/${entry.slugs.de}`,
          permanent: true,
        },
        {
          source: `/en/docs/${meta.slugs.en}/${entry.slugs.en}`,
          destination: `/en/wiki/${meta.slugs.en}/${entry.slugs.en}`,
          permanent: true,
        },
        {
          source: `/nl/docs/${meta.slugs.nl}/${entry.slugs.nl}`,
          destination: `/nl/wiki/${meta.slugs.nl}/${entry.slugs.nl}`,
          permanent: true,
        },
      );
    }
  }
  return out;
}

/**
 * Legacy redirect mappings. Each migrated page contributes three
 * entries (one per locale) — the OLD locale slug at the root level →
 * the NEW /wiki/<category>/<slug> path in that locale.
 *
 * Old DE: /nis2-bussgelder → /wiki/recht-und-folgen/nis2-bussgelder
 * Old EN: /en/nis2-fines  → /en/wiki/law-and-consequences/nis2-fines
 * Old NL: /nl/nis2-boetes → /nl/wiki/recht-en-gevolgen/nis2-boetes
 */
export function wikiLegacyRedirects(): Array<{
  source: string;
  destination: string;
  permanent: boolean;
}> {
  const out: Array<{ source: string; destination: string; permanent: boolean }> = [];
  for (const cat of WIKI_TOP_LEVEL) {
    const meta = WIKI_TOC[cat];
    for (const entry of meta.entries) {
      out.push(
        {
          source: `/${entry.slugs.de}`,
          destination: `/wiki/${meta.slugs.de}/${entry.slugs.de}`,
          permanent: true,
        },
        {
          source: `/en/${entry.slugs.en}`,
          destination: `/en/wiki/${meta.slugs.en}/${entry.slugs.en}`,
          permanent: true,
        },
        {
          source: `/nl/${entry.slugs.nl}`,
          destination: `/nl/wiki/${meta.slugs.nl}/${entry.slugs.nl}`,
          permanent: true,
        },
      );
    }
  }
  return out;
}
