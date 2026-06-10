/**
 * Source of truth for the founder business-plan dashboard at
 * /[locale]/platform-admin/business-plan
 *
 * Trimmed for the IHK Tragfähigkeitsbescheinigung audience: each item earns
 * its place by signalling something the reviewer is checking for.
 */

export type TaskStatus = "done" | "active" | "planned";

export type Phase = "platform" | "reach" | "training" | "admin" | "funding";

export type MilestoneCategory =
  | "origin"
  | "ship"
  | "viral"
  | "external"
  | "financial"
  | "personal";

export interface BusinessPlanTask {
  id: string;
  phase: Phase;
  title: string;
  start: string;
  end: string;
  status: TaskStatus;
  note?: string;
}

export interface BusinessPlanMilestone {
  id: string;
  date: string;
  label: string;
  category: MilestoneCategory;
  done: boolean;
  note?: string;
}

export interface ViralPost {
  id: string;
  date: string;
  title: string;
  language: "de" | "en";
  impressions: number;
  likes?: number;
  comments?: number;
  reposts?: number;
  url?: string;
}

/**
 * Consolidated viral events for the engagement chart, one entry per date.
 * Same-day posts are summed for the impressions count in the label.
 */
export interface ViralMarker {
  date: string;
  label: string;
  totalImpressions: number;
}

export interface GrowthPoint {
  date: string;
  signups: number;
  courseStarts: number;
}

/**
 * A discovery or partner call. The chain visible on the chart:
 *   call -> insight -> post -> user spike.
 * Each call gets one orange triangle at its date on the engagement chart.
 */
export interface Call {
  id: string;
  date: string;
  name: string;
  org?: string;
  type: "legal" | "customer" | "partner" | "advisor" | "inbound";
  insight: string;
}

/** Market size layers for REF-02. */
export interface MarketLayer {
  key: "tam" | "sam" | "som";
  label: string;
  labelEn: string;
  range: string;
  rangeEn: string;
  source: string;
  sourceEn: string;
}

/** Competitor on the price × lock-in quadrant (REF-03). */
export interface Competitor {
  id: string;
  name: string;
  /** Normalized 0–1 position on the price axis (€0 to €100k+ per year). */
  priceX: number;
  /** Normalized 0–1 position on the lock-in axis. */
  lockinY: number;
  headcount: number;
  /** Annual price band as displayed in the tooltip, e.g. "€7.5k–€100k+". */
  priceLabel: string;
  /** Lock-in profile description, e.g. "3-Jahre, Export blockiert". */
  lockinLabel: string;
  lockinLabelEn: string;
  note: string;
  noteEn: string;
  isUs?: boolean;
}

/** Revenue channel for the open-core flow diagram (REF-01). */
export interface RevenueChannel {
  id: string;
  number: number;
  label: string;
  labelEn: string;
  sublabel: string;
  sublabelEn: string;
  isDashed?: boolean;
}

/** Year-2 revenue pie slice (REF-05). */
export interface RevenueSlice {
  name: string;
  nameEn: string;
  value: number;
  color: string;
}

/** SWOT quadrant (REF-04). */
export interface SwotQuadrant {
  label: string;
  labelEn: string;
  items: string[];
  itemsEn: string[];
}

/** Quarterly cumulative point for the break-even chart (REF-06). */
export interface BreakEvenPoint {
  quarter: string;
  revenueCumulative: number;
  expenseCumulative: number;
}

/** Cost-comparison alternative for REF-09. Annual all-in cost band. */
export interface CostAlternative {
  id: string;
  name: string;
  nameEn: string;
  minEur: number;
  maxEur: number;
  unit: string;
  unitEn: string;
  note: string;
  noteEn: string;
  isUs?: boolean;
}

/** Audit-finding coverage row for REF-10. */
export interface AuditFinding {
  rank: number;
  finding: string;
  findingEn: string;
  coverage: "direct" | "evidence" | "external";
  module: string;
}

/** Funnel stage for REF-11 (reach → revenue). */
export interface FunnelStage {
  id: string;
  label: string;
  labelEn: string;
  value: string;
  valueEn: string;
  note: string;
  noteEn: string;
  band: "reach" | "platform" | "training" | "pipeline" | "revenue";
}

/**
 * Driver-based sensitivity for REF-12. Each driver moves independently
 * while the other two stay at plan, isolating how each variable shifts
 * Year-2 consulting-referral revenue.
 */
export interface SensitivityDriver {
  driver: string;
  driverEn: string;
  unit: string;
  unitEn: string;
  lowLabel: string;
  lowLabelEn: string;
  lowValue: number;
  planLabel: string;
  planLabelEn: string;
  planValue: number;
  highLabel: string;
  highLabelEn: string;
  highValue: number;
  rationale: string;
  rationaleEn: string;
}

export interface BusinessPlanData {
  startDate: string;
  endDate: string;
  today: string;
  ganttStartYear: number;
  ganttYearsCount: number;
  engagementStart: string;
  engagementEnd: string;
  phases: Record<Phase, { label: string; labelEn: string; color: string }>;
  tasks: BusinessPlanTask[];
  milestones: BusinessPlanMilestone[];
  viralPosts: ViralPost[];
  viralMarkers: ViralMarker[];
  growth: GrowthPoint[];
  calls: Call[];
  revenueChannels: RevenueChannel[];
  marketLayers: MarketLayer[];
  competitors: Competitor[];
  swot: {
    strengths: SwotQuadrant;
    weaknesses: SwotQuadrant;
    opportunities: SwotQuadrant;
    threats: SwotQuadrant;
  };
  revenueMix: {
    year: string;
    total: number;
    slices: RevenueSlice[];
  };
  breakEven: BreakEvenPoint[];
  costAlternatives: CostAlternative[];
  auditFindings: AuditFinding[];
  funnel: FunnelStage[];
  sensitivity: {
    planBaseline: number;
    planNote: string;
    planNoteEn: string;
    drivers: SensitivityDriver[];
  };
}

export const phaseConfig: BusinessPlanData["phases"] = {
  platform: { label: "Plattform", labelEn: "Platform", color: "#3b82f6" },
  reach: {
    label: "Reichweite & Vertrieb",
    labelEn: "Reach & Sales",
    color: "#10b981",
  },
  training: { label: "Schulungen", labelEn: "Training", color: "#f59e0b" },
  funding: { label: "Förderung", labelEn: "Funding", color: "#ec4899" },
  admin: {
    label: "Admin & Finanzen",
    labelEn: "Admin & Financial",
    color: "#8b5cf6",
  },
};

export const businessPlanData: BusinessPlanData = {
  startDate: "2026-02-01",
  endDate: "2028-12-31",
  today: "2026-05-27",
  ganttStartYear: 2026,
  ganttYearsCount: 3,
  // Engagement chart skips the flat Feb-March pre-LinkedIn period and ends
  // just past today so the right side isn't an empty corridor.
  engagementStart: "2026-02-15",
  engagementEnd: "2026-06-05",
  phases: phaseConfig,
  tasks: [
    // === Plattform (2): collapse the 7 module micro-tasks into one shipped block ===
    {
      id: "p-shipped",
      phase: "platform",
      title:
        "Plattform live: 12 Module (Anwendbarkeit, Anforderungen, Risiko, Assets, Lieferanten, Incidents, Audit-Trail, PDF-Export)",
      start: "2026-02-08",
      end: "2026-05-31",
      status: "done",
      note: "Projektstart 8.2.2026 als Wochenend-Nebenprojekt.",
    },
    {
      id: "p-hosted-tier",
      phase: "platform",
      title: "Lizenzen + Hosted-Cloud-Tier (Erlös-Strömung 3, ab Jahr 2)",
      start: "2027-03-01",
      end: "2027-09-30",
      status: "planned",
    },

    // === Schulungen (3): own free content + partner-affiliate setup ===
    {
      id: "t-ceo",
      phase: "training",
      title: "CEO-Kurs (47 Lektionen, §38(3) BSIG-Schulungspflicht, kostenfrei)",
      start: "2026-03-15",
      end: "2026-04-15",
      status: "done",
    },
    {
      id: "t-tabletop",
      phase: "training",
      title: "Tabletop-Kurs (Art 21(2)(b)+(c), 8 Lektionen, kostenfrei)",
      start: "2026-04-15",
      end: "2026-05-10",
      status: "done",
    },
    {
      id: "t-partner-affiliate",
      phase: "training",
      title: "Schulungs-Partner-Anbahnung (SoSafe Awareness, Advisera ISO)",
      start: "2026-02-25",
      end: "2026-12-31",
      status: "active",
      note: "Advisera-Gespräche 25.02. + 05.03.2026, SoSafe 22.05.2026. Affiliate-Provisionen 10–20 %, statt eigene Awareness/ISO-Inhalte zu bauen. Verträge noch nicht unterzeichnet, Phishing-Simulations-Partner (z.B. KnowBe4) optional in Evaluierung.",
    },

    // === Reichweite & Vertrieb (5): real marketing engine, no aspirational items ===
    {
      id: "r-linkedin",
      phase: "reach",
      title: "LinkedIn-Reichweitenaufbau (40k Impr./Woche)",
      start: "2026-04-27",
      end: "2026-12-31",
      status: "active",
      note: "Erster Post-Batch 27.04.2026 (11 Posts), erster viraler Durchbruch 67-vs-42 am 06.05.2026, MEGA-Viral 80/20 am 13.05.2026.",
    },
    {
      id: "r-seo",
      phase: "reach",
      title: "Tier-1 SEO-Seiten (5 live, Ziel 12)",
      start: "2026-02-15",
      end: "2026-09-30",
      status: "active",
    },
    {
      id: "r-outreach",
      phase: "reach",
      title: "E-Mail-Outreach (Annex II Mittelstand, ~60 Kontakte)",
      start: "2026-03-01",
      end: "2026-09-30",
      status: "active",
    },
    {
      id: "r-partners",
      phase: "reach",
      title: "Partner-Programm-Anbahnung (daschug Vermittlung, SoSafe Affiliate, Advisera Affiliate)",
      start: "2026-03-15",
      end: "2026-09-30",
      status: "active",
      note: "daschug 25.05.2026 (Vertrag in Vorbereitung); SoSafe-Call 22.05.2026; Advisera 25.02. + 05.03.2026. eurobits e.V. ist getrennte Spur (Mitgliedschaft, kein Affiliate-Partner).",
    },
    {
      id: "r-ihk",
      phase: "reach",
      title: "IHK-Kanal (Hessen + Köln + EU-weit replizierbar)",
      start: "2026-04-28",
      end: "2026-11-30",
      status: "active",
      note: "Erstgespräch Frank Irmscher/IHK Hessen 28.04.2026.",
    },

    // === Förderung (3): only the items actually filed or under review ===
    {
      id: "f-gz-phase1",
      phase: "funding",
      title: "Gründungszuschuss Phase 1 (ALG1-Tagessatz + 300 EUR, 6 Mo)",
      start: "2026-06-01",
      end: "2026-11-30",
      status: "planned",
      note: "Antrag eingereicht 18.05.2026.",
    },
    {
      id: "f-gz-phase2",
      phase: "funding",
      title: "Gründungszuschuss Phase 2 (300 EUR/Mo, 9 Mo)",
      start: "2026-12-01",
      end: "2027-08-31",
      status: "planned",
    },
    {
      id: "f-nrwbank",
      phase: "funding",
      title: "NRW.BANK Förder-Programm (Erstgespräch Mai 2026)",
      start: "2026-05-12",
      end: "2026-12-31",
      status: "planned",
      note: "Erstgespräch Leon/NRW.BANK 12.05.2026; formaler Antrag noch nicht eingereicht.",
    },

    // === Admin & Finanzen (3): legal setup + financial path inflections ===
    {
      id: "a-ug",
      phase: "admin",
      title:
        "UG-Gründung (HRB 126993 + Gewerbeanmeldung + Transparenzregister)",
      start: "2026-03-04",
      end: "2026-03-31",
      status: "done",
    },
    {
      id: "a-md-salary",
      phase: "admin",
      title: "Geschäftsführer-Gehalt (ab Juni 2027, 1.500 EUR brutto/Mo)",
      start: "2027-06-01",
      end: "2027-12-31",
      status: "planned",
    },
    {
      id: "a-iso-27001",
      phase: "admin",
      title:
        "ISO 27001 Zertifizierung nisd2.eu (Dogfood + Enterprise-Voraussetzung)",
      start: "2028-01-01",
      end: "2028-12-31",
      status: "planned",
    },
  ],
  milestones: [
    {
      id: "ms-origin",
      date: "2026-02-08",
      label: "Projektstart",
      category: "origin",
      done: true,
    },
    {
      id: "ms-ceo-course",
      date: "2026-04-15",
      label: "CEO-Kurs live",
      category: "ship",
      done: true,
    },
    {
      id: "ms-viral",
      date: "2026-05-19",
      label: "Viraler Durchbruch (71k Impr. an einem Tag)",
      category: "viral",
      done: true,
    },
    {
      id: "ms-first-paying",
      date: "2026-09-15",
      label: "Erster zahlender Kunde (Plan)",
      category: "financial",
      done: false,
    },
    {
      id: "ms-monthly-be",
      date: "2027-05-01",
      label: "Monatlicher Break-Even",
      category: "financial",
      done: false,
    },
    {
      id: "ms-first-hire",
      date: "2028-01-01",
      label: "Erste Anstellung",
      category: "personal",
      done: false,
    },
    {
      id: "ms-iso-27001",
      date: "2028-10-01",
      label: "ISO 27001 Zertifizierung Ziel",
      category: "ship",
      done: false,
    },
  ],
  // All 29 LinkedIn posts published since the LinkedIn cadence began.
  // Impression counts and dates synced to LinkedIn Analytics feed export
  // 27.05.2026.
  viralPosts: [
    // April 27 batch (1mo ago) — eleven posts, mostly EN early traction
    { id: "p-iso-scope", date: "2026-04-27", title: "Your ISO 27001 certificate might not cover what NIS2 requires", language: "en", impressions: 663 },
    { id: "p-secure-compliant", date: "2026-04-27", title: "NIS2 forces choice between secure and compliant", language: "en", impressions: 537 },
    { id: "p-bsi-bureaucracy", date: "2026-04-27", title: "Peak Bare-Minimum German Bureaucracy (BSI)", language: "de", impressions: 189 },
    { id: "p-47-lesson", date: "2026-04-27", title: "47-lesson NIS2 course share", language: "en", impressions: 500 },
    { id: "p-unpopular", date: "2026-04-27", title: "Unpopular opinion: not registering for NIS2 might be rational", language: "en", impressions: 357 },
    { id: "p-every-company", date: "2026-04-27", title: "Consultants love to say every company is different", language: "en", impressions: 224 },
    { id: "p-18-months", date: "2026-04-27", title: "18 months late transposing the directive", language: "en", impressions: 233 },
    { id: "p-back-x", date: "2026-04-27", title: "Back from x.com to call out LinkedIn slop", language: "en", impressions: 222 },
    { id: "p-no-certified", date: "2026-04-27", title: "There is no such thing as certified NIS2 training", language: "en", impressions: 299 },
    { id: "p-driving", date: "2026-04-27", title: "NIS2 doesn't have to be more complicated (driving analogy)", language: "en", impressions: 298 },
    { id: "p-moltbook", date: "2026-04-27", title: "Who needs Moltbook when we have LinkedIn?", language: "en", impressions: 137 },
    // April 29 batch (4w ago) — three EN founder-journey posts
    { id: "p-ihk-advisor", date: "2026-04-29", title: "IHK advisor: companies want the bare minimum", language: "en", impressions: 526 },
    { id: "p-trying-to-cut", date: "2026-04-29", title: "Trying to cut Europe's NIS2 compliance bill in half", language: "en", impressions: 1280, likes: 14 },
    { id: "p-isb-job", date: "2026-04-29", title: "ISB job salary analysis", language: "en", impressions: 988 },
    // May 6 batch (3w ago) — first viral wave (DE 67-vs-42) plus EN small follow-ups
    { id: "p-67-42", date: "2026-05-06", title: "NIS 2 verlangt keine 67 Dokumente. Es sind etwa 42.", language: "de", impressions: 18604, likes: 51, comments: 16, reposts: 7 },
    { id: "p-journey", date: "2026-05-06", title: "NIS2 is not just a checklist (satire)", language: "en", impressions: 308 },
    { id: "p-first-10", date: "2026-05-06", title: "First 10 people on the CEO course", language: "en", impressions: 272 },
    { id: "p-threat-real", date: "2026-05-06", title: "Threat is real, coincidentally we sell the answer", language: "en", impressions: 185 },
    // May 13 batch (2w ago) — mega viral day (80/20 DE + BSI 6 docs)
    { id: "p-80-20-de", date: "2026-05-13", title: "80% von NIS-2 ist ISO 27001 — was sind die anderen 20%?", language: "de", impressions: 36745, likes: 192, comments: 31, reposts: 23 },
    { id: "p-bsi-6-docs", date: "2026-05-13", title: "6 Dokumente, die im NIS-2-Audit entscheiden", language: "de", impressions: 20717, likes: 155, comments: 22, reposts: 16 },
    { id: "p-bsi-mythen", date: "2026-05-13", title: "BSI 10 NIS-2-Mythen — Timing-Kritik", language: "de", impressions: 1063 },
    { id: "p-finanzamt", date: "2026-05-13", title: "Finanzamt findet jedes Unternehmen — BSI sucht euch", language: "de", impressions: 381 },
    // May 19 batch (1w ago) — Berater + 5-Likes + Tabletop + Patrick reply
    { id: "p-berater", date: "2026-05-19", title: "Anzahl deutscher NIS-2-Berater mit echter Umsetzung", language: "de", impressions: 14594, likes: 58 },
    { id: "p-5-likes", date: "2026-05-19", title: "Wie bekommt NIS 2 nur 5 Likes auf LinkedIn?", language: "de", impressions: 1098 },
    { id: "p-tabletop", date: "2026-05-19", title: "EU verlangt dass dein CEO Dungeons & Dragons spielt (Tabletop)", language: "de", impressions: 542 },
    { id: "p-patrick", date: "2026-05-19", title: "Patrick has the right diagnosis (resimate reply)", language: "en", impressions: 241 },
    // May 20 — Voraussichtlich
    { id: "p-voraussichtlich", date: "2026-05-20", title: "Voraussichtlich von NIS-2 betroffen — BSI-Tool-Kritik", language: "de", impressions: 2524, likes: 20 },
    // May 21 — AI Act
    { id: "p-ai-act", date: "2026-05-21", title: "EU AI Act Leitlinien (148 Seiten)", language: "de", impressions: 327 },
    // May 23 — EN viral (80/20 EN translation)
    { id: "p-80-20-en", date: "2026-05-23", title: "80% of NIS 2 is ISO 27001 — what about the other 20%?", language: "en", impressions: 25978, likes: 156, comments: 23, reposts: 17 },
  ],
  viralMarkers: [],
  growth: [
    // Pre-LinkedIn baseline: gradual build to ~8 users over Feb-mid-April.
    { date: "2026-02-08", signups: 0, courseStarts: 0 },
    { date: "2026-02-22", signups: 2, courseStarts: 0 },
    { date: "2026-03-08", signups: 4, courseStarts: 0 },
    { date: "2026-03-22", signups: 6, courseStarts: 0 },
    { date: "2026-04-05", signups: 8, courseStarts: 0 },
    { date: "2026-04-14", signups: 9, courseStarts: 0 },

    // CEO-Kurs launches Apr 15 — green line starts here.
    { date: "2026-04-15", signups: 10, courseStarts: 2 },
    { date: "2026-04-22", signups: 14, courseStarts: 5 },

    // April 29 viral (1.3k Trying-to-cut + 988 ISB salary): modest bump.
    { date: "2026-04-28", signups: 18, courseStarts: 8 },
    { date: "2026-04-30", signups: 22, courseStarts: 10 },

    // May 6 first DE viral (18.6k 67-vs-42): 3-day ramp post-post.
    { date: "2026-05-05", signups: 26, courseStarts: 12 },
    { date: "2026-05-11", signups: 30, courseStarts: 14 },

    // May 13 MEGA viral (36.7k 80/20 DE + 20.7k 6-Dokumente = ~58k Impr.):
    // pickup builds across the week, larger jump still to follow on May 19/20.
    { date: "2026-05-12", signups: 32, courseStarts: 15 },
    { date: "2026-05-13", signups: 40, courseStarts: 18 },
    { date: "2026-05-14", signups: 48, courseStarts: 23 },
    { date: "2026-05-15", signups: 53, courseStarts: 25 },

    { date: "2026-05-17", signups: 58, courseStarts: 28 },

    // May 19 second viral wave (14.6k Berater + 1.1k 5-Likes + smaller),
    // compounded by lingering impressions from the May 13 batch.
    { date: "2026-05-19", signups: 65, courseStarts: 32 },
    { date: "2026-05-20", signups: 95, courseStarts: 46 },
    { date: "2026-05-21", signups: 115, courseStarts: 55 },
    { date: "2026-05-22", signups: 122, courseStarts: 58 },

    // May 23 viral (22k 80/20 EN): 3-day ramp again.
    { date: "2026-05-23", signups: 130, courseStarts: 62 },
    { date: "2026-05-24", signups: 140, courseStarts: 67 },
    { date: "2026-05-25", signups: 148, courseStarts: 71 },

    { date: "2026-05-26", signups: 152, courseStarts: 73 },
  ],
  // Documented discovery / partner / advisor calls. Dates approximate where
  // exact records are not available. The "insight" field captures what came
  // out of each call (some seeded later viral posts).
  calls: [
    {
      id: "c-voigt",
      date: "2026-02-20",
      name: "Dr. Paul Voigt",
      org: "Taylor Wessing Berlin",
      type: "legal",
      insight: "Feedback zu Haftungs-Modell und AGB-Architektur. Tool-statt-Beratung-Framing.",
    },
    {
      id: "c-dejan-1",
      date: "2026-02-25",
      name: "Dejan Kosutic (Call 1)",
      org: "Advisera",
      type: "advisor",
      insight: "Erstgespräch mit dem Doku-Template-Marktführer. Advisera-16-Step-Methodologie für NIS2: ISO-27001-ISMS-Lifecycle re-skinned. Nützlich als kontrastiver Fall gegen unsere Obligation-Register-Positionierung.",
    },
    {
      id: "c-dejan-2",
      date: "2026-03-05",
      name: "Dejan Kosutic (Call 2)",
      org: "Advisera",
      type: "advisor",
      insight: "Folgegespräch zu Conformio (Advisera-SaaS). Bestätigt: Conformio deckt NIS2 NICHT ab, nur ISO 27001 (€145-299/Mo). NIS2-Käufer bekommen Templates. Diagnostisch für 'Form auf Steroiden'-Kategorie.",
    },
    {
      id: "c-jana-eurobits",
      date: "2026-03-15",
      name: "Jana Knuth",
      org: "eurobits e.V. / NIS2-Anlaufstelle NRW",
      type: "partner",
      insight: "Erstes Partnerschaftsgespräch mit der NIS2-Anlaufstelle NRW. MWIDE-Förderrichtlinien verbieten direktes Produkt-Endorsement, Counter-Offer: eurobits e.V. Mitgliedschaft. Signal: Anlaufstellen-Träger sind nicht referral-fähig, aber Mitgliedschaft öffnet Methodik-Arbeitsgruppen.",
    },
    {
      id: "c-cold-march",
      date: "2026-03-25",
      name: "Cold-Outreach-Kontakt",
      org: "Mittelstand (E-Mail-Pipeline)",
      type: "customer",
      insight: "Erste qualifizierte Antwort aus der März-E-Mail-Outreach-Welle. Aufgenommen als Datenpunkt für Reply-Rate-Schätzung, kein konkreter Sales-Output.",
    },
    {
      id: "c-cory-ciso-large",
      date: "2026-04-10",
      name: "CISO (Großunternehmen)",
      org: "Großkonzern (zu groß für ICP)",
      type: "customer",
      insight: "Cory-Call mit CISO eines Konzerns. Unternehmen außerhalb ICP (50-250 MA), aber Insights zu GRC-Procurement und Liefer-Kette: 'Lieferanten-Audit'-Druck zwingt auch unsere KMU-Zielgruppe in NIS2-Strukturen. Bestätigt unsere Mittelstands-Positionierung indirekt.",
    },
    {
      id: "c-cory-ciso-mid-april",
      date: "2026-04-18",
      name: "GF / IT-Leiter (Cory)",
      org: "Mittelstand-Kontakt",
      type: "customer",
      insight: "Cory-Call, Mittelstands-Kontakt. Datenpunkt zur Wahrnehmung von NIS2 in der Zielgruppe: 'kennen wir, aber kein Budget bis BSI klopft'. Bestätigt Latent-Demand-Hypothese und Free-Plattform-Wedge.",
    },
    {
      id: "c-irmscher-ihk",
      date: "2026-04-28",
      name: "Frank Irmscher",
      org: "IHK Hessen innovativ",
      type: "partner",
      insight: "67-min Call. Schlüssel-Insights: GF sehen NIS2 als 'Extra-Steuer'. Mittelstand will Bare-Minimum-Roadmap. IHK kann Free-Produkt ohne Zertifizierung nicht endorsen, bot aber In-Person-Sessions an. Frame 'wir hassen NIS2, wollen die Steuer halbieren' resoniert. Inspirierte Post 'IHK advisor: bare minimum' (06.05.2026).",
    },
    {
      id: "c-outreach-1",
      date: "2026-05-08",
      name: "Outreach-Kontakt 1",
      org: "Mittelstand (zu groß für ICP)",
      type: "customer",
      insight: "Eine von 2 qualifizierten E-Mail-Outreach-Calls von ~60 Kontakten. Lernkurve: Pre-Qualifikation nach Sektor + Größe nötig.",
    },
    {
      id: "c-outreach-2",
      date: "2026-05-11",
      name: "Outreach-Kontakt 2",
      org: "Mittelstand (out of scope)",
      type: "customer",
      insight: "Zweite qualifizierte Outreach-Call. Unternehmen außerhalb des NIS2-Scope. Bestätigt Insight zur Pre-Qualifikation.",
    },
    {
      id: "c-leon-nrwbank",
      date: "2026-05-12",
      name: "Leon",
      org: "NRW.BANK",
      type: "partner",
      insight: "Gespräch mit der NRW.BANK zu Förder-Optionen für OSS-Plattformen (Software-Sprint, weitere). Programm-Eignung wird intern geprüft. Signal: NRW.BANK ist die strukturierte Förder-Anlaufstelle für unser Modell, eurobits ist die Verbands-Anlaufstelle.",
    },
    {
      id: "c-delo",
      date: "2026-05-15",
      name: "Stephan Sachs",
      org: "DELO Industrieklebstoffe (CISO)",
      type: "customer",
      insight: "Live-Walkthrough als Test-Organisation. Insight: CISO-Pragmatismus + 'Lieferanten-Audit'-Druck als reales Bedrohungsmodell. Inspirierte Post #5 'Anzahl deutscher Berater' (19. Mai).",
    },
    {
      id: "c-shota-isento",
      date: "2026-05-19",
      name: "Shota Okujava",
      org: "isento GmbH",
      type: "customer",
      insight: "Teams-Call. BSI Betroffenheitsprüfung ergab 'wahrscheinlich betroffen'. Scope-Frage kollabiert zu: 'Ist isento MSP?' nach NIS2 Art. 6(39) / BSIG Anlage 1 Nr. 6.1.10. Substantielles Produkt-Feedback nach CEO-Kurs. Phone-Call-Einladung nach offenem Feedback-Loop.",
    },
    {
      id: "c-inbound-viral",
      date: "2026-05-20",
      name: "Mehrere Inbound-Anfragen",
      org: "LinkedIn-getrieben",
      type: "inbound",
      insight: "Nach dem viralen Mega-Tag (71k Impr.): mehrere eingehende Gespräche mit CISOs, Beratungen, IHK-Kontakten.",
    },
    {
      id: "c-sosafe",
      date: "2026-05-22",
      name: "Denise",
      org: "SoSafe (CSM)",
      type: "partner",
      insight: "Partnerschafts-Recap-E-Mail. Gemeinsame Masterclass in Köln, Demo-Code SOBETA25, Leitungs-Pitch in der Woche.",
    },
    {
      id: "c-daschug",
      date: "2026-05-25",
      name: "Ralf Becker",
      org: "daschug GmbH",
      type: "partner",
      insight: "Affiliate-Konzept abgestimmt: Consultant-in-the-Loop-UX, bezahlte Q&A-Sessions durch daschug. Vertrag in Vorbereitung.",
    },
  ],
  revenueChannels: [
    { id: "referral", number: 1, label: "Beratungs-Vermittlungsprovisionen", labelEn: "Consulting referral commissions", sublabel: "Beratungspartner (daschug, weitere) · 73% Jahr 2", sublabelEn: "Consulting partners (daschug, more) · 73% Year 2" },
    { id: "training-partner", number: 2, label: "Partner-Schulungs-Provisionen", labelEn: "Partner-training referral commissions", sublabel: "SoSafe, Advisera (Affiliate, Verträge in Anbahnung) · 11% Jahr 2", sublabelEn: "SoSafe, Advisera (affiliate, contracts in preparation) · 11% Year 2" },
    { id: "licenses", number: 3, label: "Lizenzen & Hosted-Cloud-Tier", labelEn: "Licenses & Hosted-Cloud tier", sublabel: "GitLab-Modell, Lifetime + monatlich · 16% Jahr 2", sublabelEn: "GitLab model, lifetime + monthly · 16% Year 2" },
    { id: "implementation", number: 4, label: "Implementierungsbegleitung", labelEn: "Implementation support", sublabel: "selektiv, primär an Partner vermittelt", sublabelEn: "selective, primarily referred to partners", isDashed: true },
    { id: "grants", number: 5, label: "Förderungen / Programme", labelEn: "Grants / programmes", sublabel: "geplante Anträge (NRW.BANK, KfW, STF, BAFA), Auswahl projektabhängig", sublabelEn: "planned applications (NRW.BANK, KfW, STF, BAFA), selection project-dependent", isDashed: true },
  ],
  marketLayers: [
    { key: "tam", label: "EU-weit NIS2-pflichtige Entitäten", labelEn: "EU-wide NIS2-obligated entities", range: "160.000–180.000 Unternehmen", rangeEn: "160,000–180,000 companies", source: "ENISA / BSI Sektor-FAQs", sourceEn: "ENISA / BSI sector FAQs" },
    { key: "sam", label: "EU-SMEs (50–250 MA) in NIS2-Sektoren", labelEn: "EU SMEs (50–250 employees) in NIS2 sectors", range: "135.000–155.000 SMEs", rangeEn: "135,000–155,000 SMEs", source: "≈ 85% des TAM (NIS2 ErwGr. 12, KMU-Anteil)", sourceEn: "≈ 85% of TAM (NIS2 Recital 12, SME share)" },
    { key: "som", label: "Zahlende KMU-Kunden Jahr 3 (über Beratungspartner)", labelEn: "Paying SME customers Year 3 (via consulting partners)", range: "ca. 400 KMUs", rangeEn: "≈ 400 SMEs", source: "konservativ aus aktueller 22 Nutzer/Woche-Trajektorie; Provision Ø €900 je Vermittlung (Mix: Beratung €1.000–1.500, Partner-Schulung €250)", sourceEn: "conservative from the current 22-users-per-week trajectory; average commission €900 per referral (mix: consulting €1,000–1,500, partner training €250)" },
  ],
  competitors: [
    { id: "vanta", name: "Vanta", priceX: 0.88, lockinY: 0.82, headcount: 800, priceLabel: "€7.5k–€100k+/Jahr", lockinLabel: "3-Jahre, Export-Friktion", lockinLabelEn: "3-year, export friction", note: "US Multi-Framework, NIS2 als Add-on", noteEn: "US multi-framework, NIS2 as add-on" },
    { id: "drata", name: "Drata", priceX: 0.78, lockinY: 0.74, headcount: 600, priceLabel: "≈€10k–€80k/Jahr", lockinLabel: "Multi-Jahres-Verträge", lockinLabelEn: "Multi-year contracts", note: "US Multi-Framework, vergleichbar Vanta", noteEn: "US multi-framework, comparable to Vanta" },
    { id: "dataguard", name: "DataGuard", priceX: 0.62, lockinY: 0.88, headcount: 250, priceLabel: "≈€10k–€30k/Jahr", lockinLabel: "Demo-Wall, Bundle-Lock-in", lockinLabelEn: "Demo wall, bundle lock-in", note: "DSGVO + NIS2 Bundles, Preise nicht öffentlich", noteEn: "GDPR + NIS2 bundles, pricing not public" },
    { id: "secfix", name: "Secfix", priceX: 0.48, lockinY: 0.62, headcount: 35, priceLabel: "≈€8k–€20k/Jahr", lockinLabel: "Jahresvertrag", lockinLabelEn: "Annual contract", note: "ISO 27001 + NIS2, Mittelstand", noteEn: "ISO 27001 + NIS2, Mittelstand" },
    { id: "advisera", name: "Conformio (Advisera)", priceX: 0.42, lockinY: 0.55, headcount: 80, priceLabel: "≈€3k–€12k/Jahr", lockinLabel: "ISO-27001-Templates, SaaS-Subscription", lockinLabelEn: "ISO 27001 templates, SaaS subscription", note: "Doku-Templates + SaaS, ISO27001-only", noteEn: "Document templates + SaaS, ISO 27001-only" },
    { id: "ratisbona", name: "Ratisbona", priceX: 0.42, lockinY: 0.62, headcount: 12, priceLabel: "€799/Monat × 24 Mon. ≈ €19,2k", lockinLabel: "24-Monats-Mindestlaufzeit", lockinLabelEn: "24-month commitment", note: "10-Wochen-Workshop-Reihe, max. 3 Teilnehmer, Oberpfalz", noteEn: "10-week workshop series, max 3 attendees, Oberpfalz" },
    { id: "ciso-assistant", name: "CISO Assistant", priceX: 0.22, lockinY: 0.28, headcount: 18, priceLabel: "OSS frei + Pro/Enterprise gegated", lockinLabel: "OSS, aber ICP = Enterprise-GRC-Teams", lockinLabelEn: "OSS, but ICP = enterprise GRC teams", note: "intuitem (FR), OSS-Peer im Daten-Modell, aber ICP-fremd: setzt technisches Inhouse-Team voraus", noteEn: "intuitem (FR), OSS peer in data model, but different ICP: requires in-house technical team" },
    { id: "nis2compass", name: "NIS2Compass", priceX: 0.20, lockinY: 0.50, headcount: 8, priceLabel: "ab ~€29/Monat", lockinLabel: "Jahresvertrag, kein OSS", lockinLabelEn: "Annual contract, not OSS", note: "Direkter ICP-Match: DE-Mittelstand, „NIS2 ohne Berater“, closed-source SaaS", noteEn: "Direct ICP match: German SME, 'NIS2 without consultants', closed-source SaaS" },
    { id: "verinice", name: "verinice", priceX: 0.18, lockinY: 0.30, headcount: 15, priceLabel: "Community frei + Cloud/PRO gegated", lockinLabel: "OSS, aber ICP = Behörden/KRITIS", lockinLabelEn: "OSS, but ICP = authorities/KRITIS", note: "SerNet (DE), Grundschutz-Standardtool für Behörden und KRITIS-Betreiber; setzt technisches Verständnis oder Beratungs-Partner voraus", noteEn: "SerNet (DE), Grundschutz standard tool for federal authorities and KRITIS operators; requires technical understanding or a consultant partner" },
    { id: "nisd2", name: "nisd2.eu", priceX: 0.04, lockinY: 0.08, headcount: 2, priceLabel: "€0 Plattform + opt. Schulung", lockinLabel: "AGPL-3.0, kein Lock-in", lockinLabelEn: "AGPL-3.0, no lock-in", note: "OSS Plattform + Partner-Vermittlung", noteEn: "OSS platform + partner referral", isUs: true },
  ],
  swot: {
    strengths: {
      label: "Stärken (intern)",
      labelEn: "Strengths (internal)",
      items: [
        "Plattform live, 152 Nutzer + 73 CEO-Kurs-Starts (Stand 27.05.2026)",
        "Open-Source-Mission (AGPL-3.0) als PR-Story und Vertrauens-Anker",
        "Gründer: 10J Tech + tiefe Regulatorik (NIS2, BSIG, ISO 27001)",
        "Partner-Strategie statt Eigenbau (daschug, SoSafe, Advisera in Anbahnung)",
      ],
      itemsEn: [
        "Platform live, 152 users + 73 CEO course starts (as of 27.05.2026)",
        "Open-source mission (AGPL-3.0) as PR story and trust anchor",
        "Founder: 10 years tech + deep regulatory knowledge (NIS2, BSIG, ISO 27001)",
        "Partner strategy instead of building in-house (daschug, SoSafe, Advisera in preparation)",
      ],
    },
    weaknesses: {
      label: "Schwächen (intern)",
      labelEn: "Weaknesses (internal)",
      items: [
        "Heute null zahlende Kunden",
        "Reichweite-Aufbau 6–12 Monate",
        "Kein eigener Vertriebsapparat",
        "Solo-Founder-Risiko (Cory sekundär)",
      ],
      itemsEn: [
        "Zero paying customers today",
        "Reach build-up takes 6–12 months",
        "No own sales apparatus",
        "Solo-founder risk (Cory secondary)",
      ],
    },
    opportunities: {
      label: "Chancen (extern)",
      labelEn: "Opportunities (external)",
      items: [
        "135.000–155.000 EU-SMEs in NIS2-Sektoren (SAM)",
        "Kein dominanter Anbieter im KMU-Segment",
        "Schulungs-Markt entsteht parallel (Partner-Affiliate statt Eigenbau)",
        "IHK-Kanal EU-weit replizierbar",
        "Lifetime-Lizenzen + Hosted-Cloud als zweite Erlös-Linie ab Jahr 2",
      ],
      itemsEn: [
        "135,000–155,000 EU SMEs in NIS2 sectors (SAM)",
        "No dominant provider in the SME segment",
        "Training market emerging in parallel (partner affiliate instead of in-house build)",
        "Chamber of Commerce channel replicable EU-wide",
        "Lifetime licenses + hosted cloud as second revenue line from Year 2",
      ],
    },
    threats: {
      label: "Risiken (extern)",
      labelEn: "Threats (external)",
      items: [
        "NIS2-Audit-Verzögerung",
        "Wettbewerbs-Preissenkung im Mittelstand",
        "Abhängigkeit von Beratungspartner-Programm (73 % Jahr-2-Umsatz)",
        "Persönlicher Ausfall (Solo-GF)",
        "DSGVO-Vorfall auf eigener Plattform",
        "BSI-Zertifizierungspflicht (Perspektive)",
      ],
      itemsEn: [
        "NIS2 audit delay",
        "Competitive price reduction in the Mittelstand",
        "Dependency on consulting-partner programme (73 % of Year-2 revenue)",
        "Personal failure (solo Managing Director)",
        "GDPR incident on own platform",
        "BSI certification mandate (longer term)",
      ],
    },
  },
  revenueMix: {
    year: "Jahr 2 (Mär 2027 – Feb 2028)",
    total: 75000,
    slices: [
      { name: "Beratungs-Vermittlungsprovisionen", nameEn: "Consulting-referral commissions", value: 55000, color: "#10b981" },
      { name: "Partner-Schulungs-Provisionen (SoSafe, Advisera, etc.)", nameEn: "Partner-training referrals (SoSafe, Advisera, etc.)", value: 8000, color: "#3b82f6" },
      { name: "Lizenzen & Hosted-Cloud", nameEn: "Licenses & Hosted-Cloud", value: 12000, color: "#8b5cf6" },
    ],
  },
  breakEven: [
    { quarter: "Q1 26", revenueCumulative: 0, expenseCumulative: 5300 },
    { quarter: "Q2 26", revenueCumulative: 0, expenseCumulative: 8450 },
    { quarter: "Q3 26", revenueCumulative: 400, expenseCumulative: 11640 },
    { quarter: "Q4 26", revenueCumulative: 3800, expenseCumulative: 15130 },
    { quarter: "Q1 27", revenueCumulative: 11800, expenseCumulative: 19120 },
    { quarter: "Q2 27", revenueCumulative: 23500, expenseCumulative: 23980 },
    { quarter: "Q3 27", revenueCumulative: 41800, expenseCumulative: 32110 },
    { quarter: "Q4 27", revenueCumulative: 66000, expenseCumulative: 40380 },
    { quarter: "Q1 28", revenueCumulative: 84500, expenseCumulative: 46260 },
  ],
  // REF-09: what NIS2 compliance costs a Mittelstand-KMU today via each
  // alternative. Values are first-year ALL-IN EUR including license/project
  // PLUS the consulting/implementation effort that typically accompanies
  // SaaS tools (Vanta/DataGuard alone don't write your policies for you).
  // Sources: Section 4.3 of the business plan + practitioner reports.
  costAlternatives: [
    {
      id: "consulting-project",
      name: "Vollständiges Beratungs-Projekt (KPMG / Sopra Steria / Capgemini)",
      nameEn: "Full consulting project (KPMG / Sopra Steria / Capgemini)",
      minEur: 60000,
      maxEur: 200000,
      unit: "Jahr 1 all-in",
      unitEn: "Year 1 all-in",
      note: "Komplettes Implementierungs-Projekt 6–12 Monate. Für ein 50-Personen-Unternehmen bei größeren Häusern oft 120–200k+ EUR; reine Mittelstandskanzleien starten bei 30–60k EUR. Keine wiederkehrende SaaS-Komponente.",
      noteEn: "Full implementation project 6–12 months. For a 50-person company the larger firms often land at €120–200k+; specialised Mittelstand boutiques start at €30–60k. No recurring SaaS component.",
    },
    {
      id: "vanta",
      name: "Vanta SaaS + nötige Beratung",
      nameEn: "Vanta SaaS + necessary consulting",
      minEur: 15000,
      maxEur: 60000,
      unit: "Jahr 1 all-in",
      unitEn: "Year 1 all-in",
      note: "Lizenz 7.500–50.000 EUR p.a. (NIS2 als Add-on, größenabhängig) + Implementierungs-Beratung 5.000–15.000 EUR. Vanta liefert das Werkzeug, nicht die Policies.",
      noteEn: "License €7,500–50,000 p.a. (NIS2 as add-on, size-dependent) + implementation consulting €5,000–15,000. Vanta delivers the tool, not the policies.",
    },
    {
      id: "dataguard",
      name: "DataGuard Bundle + nötige Beratung",
      nameEn: "DataGuard bundle + necessary consulting",
      minEur: 15000,
      maxEur: 40000,
      unit: "Jahr 1 all-in",
      unitEn: "Year 1 all-in",
      note: "Lizenz-Bundle 10.000–30.000 EUR p.a. (Preise nicht öffentlich) + interne oder externe Implementierungs-Stunden. Demo-Wall blockiert öffentlichen Vergleich.",
      noteEn: "License bundle €10,000–30,000 p.a. (pricing not public) + internal or external implementation hours. Demo wall blocks public comparison.",
    },
    {
      id: "nisd2",
      name: "nisd2.eu (Plattform + optionale Partner-Vermittlung)",
      nameEn: "nisd2.eu (platform + optional partner referral)",
      minEur: 0,
      maxEur: 12000,
      unit: "Jahr 1 all-in",
      unitEn: "Year 1 all-in",
      note: "Plattform kostenfrei (AGPL-3.0). Optional Schulungs-Tickets 50–300 EUR/Person. Bei Bedarf direkte Vermittlung an einen Beratungspartner: das KMU zahlt den Partner direkt für die fachliche Begleitung, typisch 5.000–10.000 EUR; nisd2.eu erhält eine Provision aus dem Partner-Honorar.",
      noteEn: "Platform free (AGPL-3.0). Optional training tickets €50–300/person. When needed, direct referral to a consulting partner: the SME pays the partner directly for specialist support, typically €5,000–10,000; nisd2.eu earns a commission from the partner's fee.",
      isUs: true,
    },
  ],
  // REF-10: Marc Laneve (ISO 27001 Lead Auditor) top-10 NIS2 audit findings,
  // March 2026 LinkedIn analysis. Coverage mapped to platform modules.
  auditFindings: [
    { rank: 1, finding: "Keine formelle Informationssicherheits-Policy", findingEn: "No formal information security policy", coverage: "direct", module: "GOV / RSK" },
    { rank: 2, finding: "Keine Risikoanalyse oder Behandlungs-Plan", findingEn: "No risk analysis or treatment plan", coverage: "direct", module: "RSK" },
    { rank: 3, finding: "Mangelhaftes/fehlendes Incident-Management", findingEn: "Deficient/missing incident management", coverage: "direct", module: "INC" },
    { rank: 4, finding: "Kein Business Continuity Plan", findingEn: "No business continuity plan", coverage: "direct", module: "BCP" },
    { rank: 5, finding: "Unzureichende Lieferanten-Kontrolle", findingEn: "Insufficient supplier control", coverage: "direct", module: "SUP" },
    { rank: 6, finding: "Schwache Zugriffskontrolle", findingEn: "Weak access control", coverage: "evidence", module: "ACC (Config-Export)" },
    { rank: 7, finding: "Fehlende/unzureichende Verschlüsselung", findingEn: "Missing/insufficient encryption", coverage: "evidence", module: "CRY (Screenshots)" },
    { rank: 8, finding: "Keine Cybersecurity-Governance auf Management-Ebene", findingEn: "No cybersecurity governance at management level", coverage: "direct", module: "GOV + §38 BSIG course" },
    { rank: 9, finding: "Mangelhaftes Patch-/Schwachstellen-Management", findingEn: "Deficient patch/vulnerability management", coverage: "evidence", module: "PRO (Tickets)" },
    { rank: 10, finding: "Unzureichende Mitarbeiter-Schulung", findingEn: "Insufficient employee training", coverage: "direct", module: "TRN + Partner Affiliate" },
  ],
  // REF-11: reach → revenue funnel. Values are current state (May 2026) and
  // Year-3 projection from Section 8.2.
  funnel: [
    {
      id: "linkedin",
      label: "LinkedIn-Impressionen",
      labelEn: "LinkedIn impressions",
      value: "40.500 / Woche",
      valueEn: "40,500 / week",
      note: "≈ 175.000 / Monat, virale Posts bis 36.700 Impr. (20.05.2026)",
      noteEn: "≈ 175,000 / month, viral posts up to 36,700 impressions (20.05.2026)",
      band: "reach",
    },
    {
      id: "signups",
      label: "Plattform-Anmeldungen",
      labelEn: "Platform sign-ups",
      value: "152 in 7 Wochen",
      valueEn: "152 in 7 weeks",
      note: "≈ 22 Anmeldungen / Woche, organisch (keine bezahlte Werbung)",
      noteEn: "≈ 22 sign-ups / week, organic (no paid ads)",
      band: "platform",
    },
    {
      id: "course-starts",
      label: "CEO-Kurs-Starts",
      labelEn: "CEO course starts",
      value: "73 von 152",
      valueEn: "73 of 152",
      note: "48 % der Anmeldungen starten den §38 BSIG-Kurs",
      noteEn: "48 % of sign-ups start the §38 BSIG course",
      band: "training",
    },
    {
      id: "consulting-pipeline",
      label: "Beratungs-Gespräche (Pipeline)",
      labelEn: "Consulting conversations (pipeline)",
      value: "3–5 / Monat",
      valueEn: "3–5 / month",
      note: "Inbound aus LinkedIn + CEO-Kurs-Nutzern; Vermittlung an Beratungspartner ab Q3 2026",
      noteEn: "Inbound from LinkedIn + CEO-course users; referral to consulting partners from Q3 2026",
      band: "pipeline",
    },
    {
      id: "year3-revenue",
      label: "Vermittelte KMU Jahr 3 (Vollskala-Upside)",
      labelEn: "Referred SMEs Year 3 (Vollskala upside)",
      value: "ca. 400 KMU × Ø €900",
      valueEn: "≈ 400 SMEs × avg €900",
      note: "≈ €360.000 Vermittlungs-Provisionen Jahr 3 (Mär 2028 – Feb 2029) - Vollskala-Schätzung §8.2. Der konservative P&L-Pfad in §8.6 nutzt stattdessen €110.000 Jahr-3-Umsatz.",
      noteEn: "≈ €360,000 referral commissions Year 3 (Mar 2028 – Feb 2029) - Vollskala upside per §8.2. The conservative P&L path in §8.6 uses €110,000 Year-3 revenue instead.",
      band: "revenue",
    },
  ],
  // REF-12: driver-based sensitivity for Year-2 consulting-referral revenue
  // (largest revenue stream, €55k planned per §8.2). Each driver moves
  // independently while the other two stay at plan. This isolates what
  // actually shifts revenue rather than multiplying the result by ±50%.
  //
  // Plan baseline: 3 partners × 1.2 Vermittlungen/Partner/Monat × 12 Monate
  //              × €1.250 Ø Provision ≈ €54.000 (matches §8.2 Year-2 €55k
  //              consulting-referral component within rounding).
  sensitivity: {
    planBaseline: 54000,
    planNote: "Plan: 3 Beratungspartner × 1,2 Vermittlungen/Partner/Monat × €1.250 Ø Provision",
    planNoteEn: "Plan: 3 consulting partners × 1.2 referrals/partner/month × €1,250 avg commission",
    drivers: [
      {
        driver: "Anzahl Beratungspartner",
        driverEn: "Number of consulting partners",
        unit: "Partner aktiv in Jahr 2",
        unitEn: "Partners active in Year 2",
        lowLabel: "1 Partner",
        lowLabelEn: "1 partner",
        lowValue: 18000,
        planLabel: "3 Partner",
        planLabelEn: "3 partners",
        planValue: 54000,
        highLabel: "6 Partner",
        highLabelEn: "6 partners",
        highValue: 108000,
        rationale: "daschug ist im Plan-Stand bestätigt (Vertrag in Anbahnung). SoSafe/Advisera-Affiliates und ein bis zwei weitere Beratungspartner bilden den Mid-Case. Worst-Case ist nur daschug, Best-Case sind 6 Partner (entspricht der aktuellen Pipeline-Größe inkl. Inbound).",
        rationaleEn: "daschug is confirmed at plan level (contract in preparation). SoSafe/Advisera affiliates plus one to two additional consulting partners form the mid case. Worst case is daschug alone, best case is six partners (matches the current pipeline including inbound).",
      },
      {
        driver: "Vermittlungen pro Partner pro Monat",
        driverEn: "Referrals per partner per month",
        unit: "Volumen je Partner",
        unitEn: "Volume per partner",
        lowLabel: "0,5 / Monat",
        lowLabelEn: "0.5 / month",
        lowValue: 22500,
        planLabel: "1,2 / Monat",
        planLabelEn: "1.2 / month",
        planValue: 54000,
        highLabel: "2,0 / Monat",
        highLabelEn: "2.0 / month",
        highValue: 90000,
        rationale: "Plan-Wert von 1,2 entspricht etwa 14 Vermittlungen pro Partner pro Jahr - konservativ gegenüber Branchen-Reichweiten-Daten. Low-Case 0,5 ist nahe Null-Aktivität. High-Case 2,0 wäre eine voll laufende Pipeline mit Inbound-Überschuss.",
        rationaleEn: "Plan value of 1.2 equals about 14 referrals per partner per year - conservative against industry reach data. Low case 0.5 is near zero activity. High case 2.0 would be a fully running pipeline with inbound surplus.",
      },
      {
        driver: "Ø Provision je Vermittlung",
        driverEn: "Avg commission per referral",
        unit: "EUR pro Auftrag",
        unitEn: "EUR per contract",
        lowLabel: "€800",
        lowLabelEn: "€800",
        lowValue: 34560,
        planLabel: "€1.250",
        planLabelEn: "€1,250",
        planValue: 54000,
        highLabel: "€1.750",
        highLabelEn: "€1,750",
        highValue: 75600,
        rationale: "Provision 10-15 % auf NIS2-Aufträge €5-20k = €750-3.000. Low-Case €800 entspricht 10 % auf einen €8k Klein-Auftrag, High-Case €1.750 entspricht 15 % auf einen €11,7k Mittelstand-Auftrag. Plan-Wert €1.250 = mittlere Provisions-Mitte.",
        rationaleEn: "Commission 10-15 % on NIS2 contracts €5-20k = €750-3,000. Low case €800 equals 10 % on an €8k small contract, high case €1,750 equals 15 % on an €11.7k Mittelstand contract. Plan value €1,250 = middle of the commission band.",
      },
    ],
  },
};
