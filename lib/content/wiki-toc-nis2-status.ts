import type { WikiTocEntry } from "./wiki-toc";

/**
 * The first half of the per-country NIS 2 implementation status pages under zeit-und-status, in
 * hub order; the second half is in wiki-toc-nis2-status-more.ts. Kept apart from wiki-toc.ts,
 * which is over the size limit and may not grow (scripts/file-size/policy.ts).
 */
export const NIS2_STATUS_ENTRIES: WikiTocEntry[] = [
  {
    slug: "nis2-status-niederlande",
    slugs: {
      de: "nis2-status-niederlande",
      en: "nis2-status-netherlands",
      nl: "nis2-status-nederland",
    },
    titleDe: "NIS 2 Umsetzungsstand Niederlande",
    titleEn: "NIS 2 implementation status: Netherlands",
    summaryDe:
      "Cyberbeveiligingswet, RDI und NCSC-NL — wie die Niederlande NIS 2 umsetzen.",
    summaryEn:
      "Cyberbeveiligingswet, RDI and NCSC-NL — how the Netherlands implements NIS 2.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:netherlands",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Niederlande",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-status-oesterreich"],
  },
  {
    slug: "nis2-status-oesterreich",
    slugs: {
      de: "nis2-status-oesterreich",
      en: "nis2-status-austria",
      nl: "nis2-status-oostenrijk",
    },
    titleDe: "NIS 2 Umsetzungsstand Österreich",
    titleEn: "NIS 2 implementation status: Austria",
    summaryDe:
      "NISG, BMI und GovCERT.AT — wie Österreich NIS 2 in Landesrecht überführt.",
    summaryEn:
      "NISG, BMI and GovCERT.AT — how Austria transposes NIS 2 into national law.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:austria",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Österreich",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-status-niederlande"],
  },
  {
    slug: "nis2-status-frankreich",
    slugs: {
      de: "nis2-status-frankreich",
      en: "nis2-status-france",
      nl: "nis2-status-frankrijk",
    },
    titleDe: "NIS 2 Umsetzungsstand Frankreich",
    titleEn: "NIS 2 implementation status: France",
    summaryDe:
      "Gesetzentwurf zu Resilienz und Cybersicherheit, ANSSI und die französische Aufsicht: wo Frankreich bei der Umsetzung von NIS 2 steht.",
    summaryEn:
      "Resilience and cybersecurity bill, ANSSI and French supervision: where France stands on implementing NIS 2.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:france",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Frankreich",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-status-niederlande"],
  },
  {
    slug: "nis2-status-spanien",
    slugs: {
      de: "nis2-status-spanien",
      en: "nis2-status-spain",
      nl: "nis2-status-spanje",
    },
    titleDe: "NIS 2 Umsetzungsstand Spanien",
    titleEn: "NIS 2 implementation status: Spain",
    summaryDe:
      "Real Decreto-ley und der spanische CSIRT-Verbund INCIBE-CERT plus CCN-CERT — wie Spanien NIS 2 umsetzt.",
    summaryEn:
      "Real Decreto-ley and the Spanish CSIRT network INCIBE-CERT plus CCN-CERT — how Spain implements NIS 2.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:spain",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Spanien",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-italien",
    slugs: {
      de: "nis2-status-italien",
      en: "nis2-status-italy",
      nl: "nis2-status-italie",
    },
    titleDe: "NIS 2 Umsetzungsstand Italien",
    titleEn: "NIS 2 implementation status: Italy",
    summaryDe:
      "Decreto Legislativo n. 138/2024 und die Agenzia per la Cybersicurezza Nazionale (ACN) — wie Italien NIS 2 umsetzt.",
    summaryEn:
      "Decreto Legislativo n. 138/2024 and the Agenzia per la Cybersicurezza Nazionale (ACN) — how Italy implements NIS 2.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:italy",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Italien",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-belgien",
    slugs: {
      de: "nis2-status-belgien",
      en: "nis2-status-belgium",
      nl: "nis2-status-belgie",
    },
    titleDe: "NIS 2 Umsetzungsstand Belgien",
    titleEn: "NIS 2 implementation status: Belgium",
    summaryDe:
      "Loi NIS 2 vom 26. April 2024 und das Centre for Cybersecurity Belgium (CCB) — wie Belgien NIS 2 umsetzt.",
    summaryEn:
      "Belgian NIS 2 law of 26 April 2024 and the Centre for Cybersecurity Belgium (CCB) — how Belgium implements NIS 2.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:belgium",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Belgien",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-polen",
    slugs: { de: "nis2-status-polen", en: "nis2-status-poland", nl: "nis2-status-polen" },
    titleDe: "NIS 2 Umsetzungsstand Polen",
    titleEn: "NIS 2 implementation status: Poland",
    summaryDe:
      "Novelle des Ustawa o krajowym systemie cyberbezpieczeństwa (KSC) und CSIRT NASK plus CSIRT GOV — wie Polen NIS 2 umsetzt.",
    summaryEn:
      "Amendment to the Polish National Cybersecurity Act (KSC) and CSIRT NASK plus CSIRT GOV — how Poland implements NIS 2.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:poland",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Polen",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-schweden",
    slugs: {
      de: "nis2-status-schweden",
      en: "nis2-status-sweden",
      nl: "nis2-status-zweden",
    },
    titleDe: "NIS 2 Umsetzungsstand Schweden",
    titleEn: "NIS 2 implementation status: Sweden",
    summaryDe:
      "Schwedische NIS 2 Umsetzung, das Nationale Cybersicherheitszentrum (NCSC) bei der FRA und CERT-SE.",
    summaryEn:
      "Swedish NIS 2 transposition, the National Cyber Security Centre (NCSC) at FRA and CERT-SE.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:sweden",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Schweden",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-daenemark",
    slugs: {
      de: "nis2-status-daenemark",
      en: "nis2-status-denmark",
      nl: "nis2-status-denemarken",
    },
    titleDe: "NIS 2 Umsetzungsstand Dänemark",
    titleEn: "NIS 2 implementation status: Denmark",
    summaryDe:
      "Dänische NIS 2 Umsetzung, CFCS (Centre for Cyber Security) und der sektorielle Aufsichtsansatz.",
    summaryEn:
      "Danish NIS 2 transposition, CFCS (Centre for Cyber Security) and the sectoral supervision model.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:denmark",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Dänemark",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-portugal",
    slugs: {
      de: "nis2-status-portugal",
      en: "nis2-status-portugal",
      nl: "nis2-status-portugal",
    },
    titleDe: "NIS 2 Umsetzungsstand Portugal",
    titleEn: "NIS 2 implementation status: Portugal",
    summaryDe:
      "Portugiesische NIS 2 Umsetzung und CNCS (Centro Nacional de Cibersegurança).",
    summaryEn: "Portuguese NIS 2 transposition and CNCS (National Cybersecurity Centre).",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:portugal",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Portugal",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-irland",
    slugs: {
      de: "nis2-status-irland",
      en: "nis2-status-ireland",
      nl: "nis2-status-ierland",
    },
    titleDe: "NIS 2 Umsetzungsstand Irland",
    titleEn: "NIS 2 implementation status: Ireland",
    summaryDe:
      "Irische NIS 2 Umsetzung, NCSC-IE und das Department of Justice, Home Affairs and Migration.",
    summaryEn:
      "Irish NIS 2 transposition, NCSC-IE and the Department of Justice, Home Affairs and Migration.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:ireland",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Irland",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-tschechien",
    slugs: {
      de: "nis2-status-tschechien",
      en: "nis2-status-czech-republic",
      nl: "nis2-status-tsjechie",
    },
    titleDe: "NIS 2 Umsetzungsstand Tschechien",
    titleEn: "NIS 2 implementation status: Czech Republic",
    summaryDe:
      "Tschechisches Cybersicherheitsgesetz (Zákon o kybernetické bezpečnosti) und NÚKIB als Aufsichtsbehörde.",
    summaryEn:
      "Czech Cybersecurity Act (Zákon o kybernetické bezpečnosti) and NÚKIB as supervisory authority.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:czech",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Tschechien",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
  {
    slug: "nis2-status-ungarn",
    slugs: {
      de: "nis2-status-ungarn",
      en: "nis2-status-hungary",
      nl: "nis2-status-hongarije",
    },
    titleDe: "NIS 2 Umsetzungsstand Ungarn",
    titleEn: "NIS 2 implementation status: Hungary",
    summaryDe:
      "Ungarisches Cybersicherheitsgesetz (Act XXIII of 2023) und SZTFH als Aufsichtsbehörde — Ungarn war einer der ersten Mitgliedstaaten, die NIS 2 umgesetzt haben.",
    summaryEn:
      "Hungarian Cybersecurity Act (Act XXIII of 2023) and SZTFH as supervisory authority — Hungary was one of the first Member States to transpose NIS 2.",
    authorSlug: "simon-orzel",
    tags: [
      "regulation:nis2",
      "topic:transposition",
      "topic:hungary",
      "audience:ceo",
      "audience:lawyer",
      "level:intermediate",
    ],
    subCategory: "Ungarn",
    audience: ["ceo", "lawyer"],
    relatedSlugs: ["nis2-umsetzung-europa", "nis2-tracker-eu"],
  },
];
