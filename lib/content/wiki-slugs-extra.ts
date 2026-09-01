/**
 * Localized wiki URL slugs for the locales beyond de/en/nl.
 *
 * Why this file exists, separately from wiki-toc.ts:
 *
 * All ten locales already ship complete wiki translations (~2 MB of
 * messages/info/<locale>.json each), but only de/en/nl ever had localized
 * URL slugs — `fill()` in i18n/routing.ts silently handed the other seven
 * the English slug. So an Italian reader got Italian prose at
 * /it/wiki/timelines-and-status/nis2-eu-tracker: translated content on an
 * English URL, which is the half of the investment that search engines
 * and human readers both see first.
 *
 * Coverage is deliberately partial and prioritised by traffic, not
 * completeness:
 *   - ALL nine category slugs, for all four locales. The category sits in
 *     every wiki URL, so this is the highest-leverage 36 strings here.
 *   - ALL 32 zeit-und-status entries. That category is 45% of wiki
 *     traffic (756 visitors in the 30 days to 2026-08-31) and its slugs
 *     are formulaic country names.
 *   - The highest-traffic entries from the other categories.
 *
 * Everything absent from here keeps inheriting the English slug exactly
 * as before — that is the documented `fill()` fallback, not a bug. Add
 * entries as native speakers review them; nothing breaks in the meantime.
 *
 * Slugs are ASCII-folded on purpose (wdrozenie, not wdrożenie;
 * comparatie, not comparație). Percent-encoded non-ASCII in a URL is
 * legal but reads as noise when shared in a Teams message or pasted into
 * a document, which is how 54 visitors/month reach this site.
 *
 * ANY change to a slug already in this file moves a live, indexed URL.
 * localizedWikiSlugRedirects() in wiki-toc.ts emits a 301 for every entry
 * whose localized slug differs from the English one, so the old URL keeps
 * working — but that only helps if the OLD value stays derivable. Prefer
 * adding over editing.
 */

import type { WikiTopLevel } from "./wiki-toc";

/** Locales that gained slugs after de/en/nl. */
export const EXTRA_SLUG_LOCALES = ["pl", "ro", "fr", "it"] as const;
export type ExtraSlugLocale = (typeof EXTRA_SLUG_LOCALES)[number];

type Extra = Partial<Record<ExtraSlugLocale, string>>;

/** Category slug per locale. Present in every wiki URL under it. */
export const EXTRA_CATEGORY_SLUGS: Record<WikiTopLevel, Extra> = {
  anwendungsbereich: {
    pl: "zakres-stosowania",
    ro: "domeniu-de-aplicare",
    fr: "champ-d-application",
    it: "ambito-di-applicazione",
  },
  sektoren: { pl: "sektory", ro: "sectoare", fr: "secteurs", it: "settori" },
  grundlagen: {
    pl: "podstawy",
    ro: "notiuni-de-baza",
    fr: "fondamentaux",
    it: "fondamenti",
  },
  umsetzung: {
    pl: "wdrozenie",
    ro: "implementare",
    fr: "mise-en-oeuvre",
    it: "attuazione",
  },
  "recht-und-folgen": {
    pl: "prawo-i-konsekwencje",
    ro: "drept-si-consecinte",
    fr: "droit-et-consequences",
    it: "diritto-e-conseguenze",
  },
  vergleich: {
    pl: "porownanie",
    ro: "comparatie",
    fr: "comparaison",
    it: "confronto",
  },
  // Universal term — same in all four, listed so the map is exhaustive
  // and a reader does not have to wonder whether it was forgotten.
  "open-source": {
    pl: "open-source",
    ro: "open-source",
    fr: "open-source",
    it: "open-source",
  },
  "zeit-und-status": {
    pl: "terminy-i-status",
    ro: "termene-si-status",
    fr: "calendrier-et-statut",
    it: "scadenze-e-stato",
  },
  troubleshooting: {
    pl: "rozwiazywanie-problemow",
    ro: "depanare",
    fr: "resolution-de-problemes",
    it: "risoluzione-dei-problemi",
  },
};

/**
 * Entry slugs, keyed by the canonical (German) slug from WIKI_TOC.
 *
 * Omissions are intentional where the English slug is already the term
 * every language uses: regulation and standard identifiers
 * (cir-2024-2690, nis2-iso-27001), institutional acronyms
 * (enisa-tig-nis2), and the German transposition act's own name
 * (nis2umsucg). Translating those would make them harder to find, not
 * easier.
 */
export const EXTRA_ENTRY_SLUGS: Record<string, Extra> = {
  // ── zeit-und-status — 45% of wiki traffic, localized in full ────────
  "nis2-timeline": {
    pl: "harmonogram-nis2",
    ro: "calendar-nis2",
    fr: "calendrier-nis2",
    it: "cronologia-nis2",
  },
  "nis2-events": {
    pl: "wydarzenia-nis2",
    ro: "evenimente-nis2",
    fr: "evenements-nis2",
    it: "eventi-nis2",
  },
  "nis2-in-germany": {
    pl: "nis2-w-niemczech",
    ro: "nis2-in-germania",
    fr: "nis2-en-allemagne",
    it: "nis2-in-germania",
  },
  "nis2-umsetzung-europa": {
    pl: "wdrozenie-nis2-w-ue",
    ro: "implementarea-nis2-in-ue",
    fr: "mise-en-oeuvre-nis2-dans-l-ue",
    it: "attuazione-nis2-nell-ue",
  },
  "nis2-tracker-eu": {
    pl: "tracker-nis2-ue",
    ro: "tracker-nis2-ue",
    fr: "suivi-nis2-ue",
    it: "tracker-nis2-ue",
  },
  "nis2-status-niederlande": {
    pl: "nis2-status-holandia",
    ro: "nis2-status-olanda",
    fr: "nis2-statut-pays-bas",
    it: "nis2-stato-paesi-bassi",
  },
  "nis2-status-oesterreich": {
    pl: "nis2-status-austria",
    ro: "nis2-status-austria",
    fr: "nis2-statut-autriche",
    it: "nis2-stato-austria",
  },
  "nis2-status-frankreich": {
    pl: "nis2-status-francja",
    ro: "nis2-status-franta",
    fr: "nis2-statut-france",
    it: "nis2-stato-francia",
  },
  "nis2-status-spanien": {
    pl: "nis2-status-hiszpania",
    ro: "nis2-status-spania",
    fr: "nis2-statut-espagne",
    it: "nis2-stato-spagna",
  },
  "nis2-status-italien": {
    pl: "nis2-status-wlochy",
    ro: "nis2-status-italia",
    fr: "nis2-statut-italie",
    it: "nis2-stato-italia",
  },
  "nis2-status-belgien": {
    pl: "nis2-status-belgia",
    ro: "nis2-status-belgia",
    fr: "nis2-statut-belgique",
    it: "nis2-stato-belgio",
  },
  "nis2-status-polen": {
    pl: "nis2-status-polska",
    ro: "nis2-status-polonia",
    fr: "nis2-statut-pologne",
    it: "nis2-stato-polonia",
  },
  "nis2-status-schweden": {
    pl: "nis2-status-szwecja",
    ro: "nis2-status-suedia",
    fr: "nis2-statut-suede",
    it: "nis2-stato-svezia",
  },
  "nis2-status-daenemark": {
    pl: "nis2-status-dania",
    ro: "nis2-status-danemarca",
    fr: "nis2-statut-danemark",
    it: "nis2-stato-danimarca",
  },
  "nis2-status-portugal": {
    pl: "nis2-status-portugalia",
    ro: "nis2-status-portugalia",
    fr: "nis2-statut-portugal",
    it: "nis2-stato-portogallo",
  },
  "nis2-status-irland": {
    pl: "nis2-status-irlandia",
    ro: "nis2-status-irlanda",
    fr: "nis2-statut-irlande",
    it: "nis2-stato-irlanda",
  },
  "nis2-status-tschechien": {
    pl: "nis2-status-czechy",
    ro: "nis2-status-cehia",
    fr: "nis2-statut-republique-tcheque",
    it: "nis2-stato-repubblica-ceca",
  },
  "nis2-status-ungarn": {
    pl: "nis2-status-wegry",
    ro: "nis2-status-ungaria",
    fr: "nis2-statut-hongrie",
    it: "nis2-stato-ungheria",
  },
  "nis2-status-rumaenien": {
    pl: "nis2-status-rumunia",
    ro: "nis2-status-romania",
    fr: "nis2-statut-roumanie",
    it: "nis2-stato-romania",
  },
  "nis2-status-griechenland": {
    pl: "nis2-status-grecja",
    ro: "nis2-status-grecia",
    fr: "nis2-statut-grece",
    it: "nis2-stato-grecia",
  },
  "nis2-status-slowakei": {
    pl: "nis2-status-slowacja",
    ro: "nis2-status-slovacia",
    fr: "nis2-statut-slovaquie",
    it: "nis2-stato-slovacchia",
  },
  "nis2-status-bulgarien": {
    pl: "nis2-status-bulgaria",
    ro: "nis2-status-bulgaria",
    fr: "nis2-statut-bulgarie",
    it: "nis2-stato-bulgaria",
  },
  "nis2-status-kroatien": {
    pl: "nis2-status-chorwacja",
    ro: "nis2-status-croatia",
    fr: "nis2-statut-croatie",
    it: "nis2-stato-croazia",
  },
  "nis2-status-luxemburg": {
    pl: "nis2-status-luksemburg",
    ro: "nis2-status-luxemburg",
    fr: "nis2-statut-luxembourg",
    it: "nis2-stato-lussemburgo",
  },
  "nis2-status-slowenien": {
    pl: "nis2-status-slowenia",
    ro: "nis2-status-slovenia",
    fr: "nis2-statut-slovenie",
    it: "nis2-stato-slovenia",
  },
  "nis2-status-zypern": {
    pl: "nis2-status-cypr",
    ro: "nis2-status-cipru",
    fr: "nis2-statut-chypre",
    it: "nis2-stato-cipro",
  },
  "nis2-status-estland": {
    pl: "nis2-status-estonia",
    ro: "nis2-status-estonia",
    fr: "nis2-statut-estonie",
    it: "nis2-stato-estonia",
  },
  "nis2-status-litauen": {
    pl: "nis2-status-litwa",
    ro: "nis2-status-lituania",
    fr: "nis2-statut-lituanie",
    it: "nis2-stato-lituania",
  },
  "nis2-status-lettland": {
    pl: "nis2-status-lotwa",
    ro: "nis2-status-letonia",
    fr: "nis2-statut-lettonie",
    it: "nis2-stato-lettonia",
  },
  "nis2-status-malta": {
    pl: "nis2-status-malta",
    ro: "nis2-status-malta",
    fr: "nis2-statut-malte",
    it: "nis2-stato-malta",
  },
  "nis2-status-finnland": {
    pl: "nis2-status-finlandia",
    ro: "nis2-status-finlanda",
    fr: "nis2-statut-finlande",
    it: "nis2-stato-finlandia",
  },
  // nis2umsucg: the German transposition act's own short name. Left on
  // the English slug in every locale on purpose — it is a proper noun.

  // ── umsetzung — second-largest category (290 visitors) ──────────────
  "nis2-roadmap": {
    pl: "mapa-drogowa-nis2",
    ro: "foaie-de-parcurs-nis2",
    fr: "feuille-de-route-nis2",
    it: "roadmap-nis2",
  },
  "nis2-requirements": {
    pl: "wymagania-nis2",
    ro: "cerinte-nis2",
    fr: "exigences-nis2",
    it: "requisiti-nis2",
  },
  "nis2-meldepflicht": {
    pl: "obowiazek-zgloszenia-nis2",
    ro: "obligatia-de-raportare-nis2",
    fr: "obligation-de-notification-nis2",
    it: "obbligo-di-notifica-nis2",
  },
  "nis2-documents": {
    pl: "dokumenty-nis2",
    ro: "documente-nis2",
    fr: "documents-nis2",
    it: "documenti-nis2",
  },
  "nis2-zugriffskontrolle": {
    pl: "kontrola-dostepu-nis2",
    ro: "controlul-accesului-nis2",
    fr: "controle-d-acces-nis2",
    it: "controllo-degli-accessi-nis2",
  },
  "nis2-backup-strategie": {
    pl: "strategia-kopii-zapasowych-nis2",
    ro: "strategie-de-backup-nis2",
    fr: "strategie-de-sauvegarde-nis2",
    it: "strategia-di-backup-nis2",
  },

  // ── grundlagen ─────────────────────────────────────────────────────
  "what-is-nis2": {
    pl: "czym-jest-nis2",
    ro: "ce-este-nis2",
    fr: "qu-est-ce-que-nis2",
    it: "cos-e-nis2",
  },

  // ── anwendungsbereich ──────────────────────────────────────────────
  "bin-ich-cloud-anbieter-nis2": {
    pl: "czy-jestem-dostawca-chmury-nis2",
    ro: "sunt-furnizor-de-cloud-nis2",
    fr: "suis-je-fournisseur-cloud-nis2",
    it: "sono-un-fornitore-cloud-nis2",
  },
  "bin-ich-msp-managed-service-provider": {
    pl: "czy-jestem-msp-nis2",
    ro: "sunt-msp-nis2",
    fr: "suis-je-msp-nis2",
    it: "sono-un-msp-nis2",
  },
  "nis2-einrichtungen": {
    pl: "podmioty-nis2",
    ro: "entitati-nis2",
    fr: "entites-nis2",
    it: "soggetti-nis2",
  },
  "bin-ich-vertrauensdiensteanbieter-nis2": {
    pl: "czy-jestem-dostawca-uslug-zaufania-nis2",
    ro: "sunt-prestator-de-servicii-de-incredere-nis2",
    fr: "suis-je-prestataire-de-services-de-confiance-nis2",
    it: "sono-un-prestatore-di-servizi-fiduciari-nis2",
  },

  // ── sektoren ───────────────────────────────────────────────────────
  "nis2-lebensmittel": {
    pl: "nis2-zywnosc",
    ro: "nis2-alimente",
    fr: "nis2-agroalimentaire",
    it: "nis2-alimentare",
  },
  "nis2-gesundheitswesen": {
    pl: "nis2-ochrona-zdrowia",
    ro: "nis2-sanatate",
    fr: "nis2-sante",
    it: "nis2-sanita",
  },

  // ── recht-und-folgen ───────────────────────────────────────────────
  geschaftsfuhrerhaftung: {
    pl: "odpowiedzialnosc-zarzadu-nis2",
    ro: "raspunderea-conducerii-nis2",
    fr: "responsabilite-des-dirigeants-nis2",
    it: "responsabilita-degli-amministratori-nis2",
  },
};
