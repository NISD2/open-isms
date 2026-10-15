/**
 * Author personas for the docs content hub.
 *
 * Source of truth for every author byline and every schema.org Person
 * object emitted by article JSON-LD. No inline author objects in page
 * components — always import from here.
 *
 * Founder direction (2026-05-29): publisher and worksFor both resolve
 * to the NISD2 brand, never to the operator behind it — that name
 * belongs in the Impressum, not in an author byline.
 */

export interface DocsAuthor {
  /** URL-safe slug. Used in `/autor/<slug>` and as the registry foreign key. */
  slug: "simon-orzel" | "cory-hisey";
  name: string;
  jobTitle: string;
  shortBio: string;
  /** Topics this author owns. Drives default author assignment in the registry. */
  topics: string[];
  /** Author profile URL (canonical DE slug, matches an entry in i18n routing pathnames). */
  profileUrl: "/autor/simon-orzel" | "/autor/cory-hisey";
  /** Public LinkedIn URL. Emitted as sameAs in schema.org Person. */
  linkedinUrl: string;
  /** Public photo URL (without origin) — used in author profile + Person.image. */
  photoUrl: string;
  /** What a Czech profile page shows instead of the German title, bio and topics. */
  czech: {
    readonly jobTitle: string;
    readonly shortBio: string;
    readonly topics: readonly string[];
  };
}

const NISD2_ORG = {
  "@type": "Organization" as const,
  name: "NISD2",
};

export const SIMON: DocsAuthor = {
  slug: "simon-orzel",
  name: "Simon Orzel",
  jobTitle: "CEO and co-founder",
  shortBio:
    "Simon Orzel ist Mitgründer und Geschäftsführer von NISD2. Er schreibt über NIS 2 Positionierung, Geschäftsführerhaftung, EU-Cybersicherheitspolitik, und über das Geschäftsmodell hinter der Plattform.",
  topics: [
    "NIS 2 Positionierung und Anwendungsbereich",
    "§38 BSIG Geschäftsführerhaftung",
    "Bußgelder und Sanktionen (§65 BSIG, Art 32 NIS 2, Art 34 Geschäftsführungsverbot)",
    "EU-Cybersicherheitspolitik (ENISA, EU-Kommission)",
    "Build-in-Public, Open Source als Geschäftsmodell",
    "Vergleich mit anderen GRC-Tools",
    "Mission, Kosten, Verhältnismäßigkeit (Art 21(1))",
  ],
  profileUrl: "/autor/simon-orzel",
  linkedinUrl: "https://www.linkedin.com/in/simon-orzel-5a974b180/",
  photoUrl: "/images/people/simon.png",
  czech: {
    jobTitle: "CEO a spoluzakladatel",
    shortBio:
      "Simon Orzel je spoluzakladatel a jednatel NISD2. Píše o vymezení NIS 2, odpovědnosti vedení, evropské politice kybernetické bezpečnosti a o obchodním modelu platformy.",
    topics: [
      "Vymezení a působnost NIS 2",
      "Odpovědnost vedení (čl. 20 NIS 2)",
      "Pokuty a sankce (čl. 32 a 34 NIS 2)",
      "Evropská politika kybernetické bezpečnosti (ENISA, Evropská komise)",
      "Vývoj veřejně a open source jako obchodní model",
      "Srovnání s jinými nástroji GRC",
      "Poslání, náklady, přiměřenost (čl. 21 odst. 1 NIS 2)",
    ],
  },
};

export const CORY: DocsAuthor = {
  slug: "cory-hisey",
  name: "Cory Hisey",
  jobTitle: "Co-founder, technical lead",
  shortBio:
    "Cory Hisey ist Mitgründer und technischer Lead von NISD2. Er schreibt über Asset Management, Lieferantensteuerung, OT-Sicherheit, technische NIS 2 Maßnahmen, und über die praktische Umsetzung im Mittelstand.",
  topics: [
    "Asset Management (RSK 2.2, Asset-Modifier-Felder)",
    "Lieferantenmanagement und Supplier Portal",
    "OT / SCADA / ICS unter NIS 2",
    "Technische Maßnahmen nach Art 21(2)(e)(f)(g)(h)(j)",
    "Verschlüsselung und Kryptographie (CIR §9)",
    "Zugriffskontrolle und MFA (CIR §11)",
    "Incident Response Prozess",
    "Business Continuity und Backup-Strategie",
    "Schwachstellenmanagement und Patch",
    "Implementierungs-How-Tos für Mittelstand",
  ],
  profileUrl: "/autor/cory-hisey",
  linkedinUrl: "https://www.linkedin.com/in/cory-hisey-730a8a59/",
  photoUrl: "/images/people/cory.png",
  czech: {
    jobTitle: "Spoluzakladatel, technický vedoucí",
    shortBio:
      "Cory Hisey je spoluzakladatel a technický vedoucí NISD2. Píše o řízení aktiv, řízení dodavatelů, bezpečnosti OT, technických opatřeních podle NIS 2 a o praktickém zavádění ve středních firmách.",
    topics: [
      "Řízení aktiv (RSK 2.2, pole modifikátorů aktiv)",
      "Řízení dodavatelů a portál dodavatelů",
      "OT, SCADA a ICS podle NIS 2",
      "Technická opatření podle čl. 21 odst. 2 písm. e), f), g), h) a j) NIS 2",
      "Šifrování a kryptografie (bod 9 přílohy CIR)",
      "Řízení přístupu a MFA (bod 11 přílohy CIR)",
      "Postup reakce na incidenty",
      "Kontinuita činností a strategie zálohování",
      "Řízení zranitelností a záplatování",
      "Návody k zavedení pro střední firmy",
    ],
  },
};

export const AUTHORS: Record<DocsAuthor["slug"], DocsAuthor> = {
  "simon-orzel": SIMON,
  "cory-hisey": CORY,
};

/**
 * schema.org Person fragment for an author. Used by the article JSON-LD
 * builders in lib/seo.ts.
 */
export function authorPersonSchema(slug: DocsAuthor["slug"], baseUrl: string) {
  const author = AUTHORS[slug];
  return {
    "@type": "Person" as const,
    name: author.name,
    url: `${baseUrl}${author.profileUrl}`,
    image: `${baseUrl}${author.photoUrl}`,
    jobTitle: author.jobTitle,
    sameAs: [author.linkedinUrl],
    worksFor: NISD2_ORG,
  };
}
