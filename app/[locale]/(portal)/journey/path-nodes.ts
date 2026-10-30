import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import {
  type DotState,
  isDoneState,
  journeyIndex,
  priorityRank,
} from "@/lib/compliance/journey-position";
import { requirementStatusLabel } from "@/lib/compliance/status-words";
import { type CoveredBy, type WalkLocale, walkLocaleOf } from "@/lib/durchgang";
import { type JourneyItem, liveNode } from "./views";

export type { DotState };

/**
 * The languages the journey's own labels are written in: the walk's, since a Czech reader moves
 * between the two. Any other page language reads English.
 */
export type JourneyLocale = WalkLocale;
export const journeyLocaleOf = walkLocaleOf;

/** One label in each journey language. */
export type Localized = Readonly<Record<JourneyLocale, string>>;

type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  readonly other: string;
};

/** A count with the noun form its language takes for it ("1 den", "3 dny", "5 dní"). */
export const countOf = (
  locale: JourneyLocale,
  count: number,
  forms: PluralForms,
): string =>
  `${count} ${forms[new Intl.PluralRules(locale).select(count)] ?? forms.other}`;

export type NodeStatus = "done" | "current" | "upcoming";
export type ColumnKey = "leadership" | "security" | "it" | "operations";
export type Band = "minimum" | "year" | "later";
/** The two orderings the flow can show. Both render all steps. */
export type Order = "defensible" | "chrono";

/** A unified node the flow renders (one per requirement). */
export type FlowNode = {
  id: string;
  code: string; // "2.2"
  label: string;
  categorySlug: string;
  categoryCode: string;
  band: Band;
  column: ColumnKey;
  ownerRole: string;
  status: NodeStatus;
  /** Raw companyRequirementStatus, for the aggregate filter chips. */
  rawStatus: string;
  /** Where the requirement stands (`coveredState`); every view draws and labels from it. */
  state: DotState;
  /** What decided `state` when it was not work on the requirement itself, else null. */
  coveredBy: CoveredBy | null;
  /** Recurring-review cycle: the next review (nextReviewDate) is in the past. */
  isOverdue: boolean;
  /** Days until the next review (negative = overdue). null = no review date. */
  dueInDays: number | null;
  priority: string | null;
  description: string | null;
  legalRef: string | null;
  frequency: string | null;
  /** Index within the category, for re-deriving process order. */
  sortOrder: number;
  /** Assigned sign-offs done vs required (N-of-M management sign-off). */
  signOff: { signed: number; total: number };
};

/** Journey rollup counts. Single source of truth for the aggregate shape
 *  shared by the board, the preview sample data, and the journey router. */
export type Aggregate = {
  total: number;
  done: number;
  awaitingSignoff: number;
  overdue: number;
  dueSoon: number;
  open: number;
};

/**
 * Swimlane columns, in display order. "Management" matches the §38 language; the Czech column
 * names the management duties of § 4 in both measure decrees.
 */
export const COLUMNS: {
  key: ColumnKey;
  label: Localized;
  info: Localized;
}[] = [
  {
    key: "leadership",
    label: { en: "Management", de: "Geschäftsführung", cs: "Vedení" },
    info: {
      en: "Approves and is accountable. Signs off governance, budget and the duties under §38.",
      de: "Genehmigt und verantwortet. Gibt Governance, Budget und die Pflichten nach §38 frei.",
      cs: "Schvaluje a nese odpovědnost. Schvaluje řízení, rozpočet a povinnosti vrcholného vedení podle § 4 vyhlášky č. 410/2025 Sb. a § 4 vyhlášky č. 409/2025 Sb.",
    },
  },
  {
    key: "security",
    label: { en: "Security", de: "Sicherheit", cs: "Bezpečnost" },
    info: {
      en: "Drives risk, incidents, access, training and effectiveness (CISO).",
      de: "Steuert Risiko, Vorfälle, Zugriff, Schulung und Wirksamkeit (CISO).",
      cs: "Řídí rizika, incidenty, přístupy, školení a účinnost (CISO).",
    },
  },
  {
    key: "it",
    label: { en: "IT", de: "IT", cs: "IT" },
    info: {
      en: "Implements technical controls: cryptography, patching, authentication.",
      de: "Setzt technische Maßnahmen um: Kryptografie, Patches, Authentifizierung.",
      cs: "Zavádí technická opatření: kryptografii, záplaty, autentizaci.",
    },
  },
  {
    key: "operations",
    label: { en: "Operations", de: "Betrieb", cs: "Provoz" },
    info: {
      en: "Owns continuity, backups and supplier management.",
      de: "Verantwortet Kontinuität, Backups und Lieferantenmanagement.",
      cs: "Odpovídá za kontinuitu, zálohy a řízení dodavatelů.",
    },
  },
];

/**
 * Criticality bands, top to bottom. Each maps to a rough phase so the path
 * reads as "you have time": the defensible minimum in month one, the rest
 * spread over the following months. It is NOT all due in two weeks.
 */
export const BANDS: {
  key: Band;
  name: Localized;
  hint: Localized;
  phase: Localized;
}[] = [
  {
    key: "minimum",
    name: {
      en: "Defensible minimum",
      de: "Belastbares Minimum",
      cs: "Obhajitelné minimum",
    },
    hint: {
      en: "The mandatory, foundational controls",
      de: "Die verpflichtenden, grundlegenden Maßnahmen",
      cs: "Povinná základní opatření",
    },
    phase: { en: "In the first month", de: "Im ersten Monat", cs: "V prvním měsíci" },
  },
  {
    key: "year",
    name: { en: "Over the year", de: "Im Lauf des Jahres", cs: "V průběhu roku" },
    hint: {
      en: "The remaining measures, step by step",
      de: "Die übrigen Maßnahmen, Schritt für Schritt",
      cs: "Zbývající opatření, krok za krokem",
    },
    phase: { en: "In the first year", de: "Im ersten Jahr", cs: "V prvním roce" },
  },
  {
    key: "later",
    name: { en: "Lower priority", de: "Geringere Priorität", cs: "Nižší priorita" },
    hint: {
      en: "Once the rest is in place",
      de: "Wenn der Rest steht",
      cs: "Až bude zbytek hotový",
    },
    phase: { en: "After that", de: "Danach", cs: "Poté" },
  },
];

const ROLE_COLUMN: Record<string, ColumnKey> = {
  ceo: "leadership",
  legal: "leadership",
  ciso: "security",
  hr_director: "security",
  cto: "it",
  coo: "operations",
  cpo: "operations",
};

export const ROLE_LABEL: Record<string, Localized> = {
  ceo: { en: "Management", de: "Geschäftsführung", cs: "Vedení" },
  legal: { en: "Legal", de: "Recht", cs: "Právní oddělení" },
  ciso: { en: "CISO", de: "CISO", cs: "CISO" },
  hr_director: { en: "HR", de: "HR", cs: "HR" },
  cto: { en: "IT lead", de: "IT-Leitung", cs: "Vedoucí IT" },
  coo: { en: "Operations", de: "Betrieb", cs: "Provoz" },
  cpo: { en: "Procurement", de: "Einkauf", cs: "Nákup" },
};

/**
 * Display names for the 12 NIS2 categories (chrono section headers) where the framework's English
 * name is not the one shown. The Czech names are the category pages' own (compliance.categories),
 * so a heading here reads the same as the page it leads to.
 */
const CATEGORY_NAME: Record<Exclude<JourneyLocale, "en">, Record<string, string>> = {
  de: {
    GOV: "Governance",
    RSK: "Risikomanagement",
    INC: "Vorfallsbehandlung",
    BCP: "Geschäftskontinuität",
    SUP: "Lieferanten und Lieferkette",
    PRO: "Patches und Schwachstellen",
    EFF: "Wirksamkeitsprüfung",
    TRN: "Schulung",
    CRY: "Kryptografie",
    ACC: "Zugriffssteuerung",
    AUT: "Authentifizierung",
    REG: "Registrierung",
  },
  cs: {
    GOV: "Řízení a odpovědnost",
    RSK: "Řízení rizik",
    INC: "Řešení incidentů",
    BCP: "Kontinuita podnikání",
    SUP: "Bezpečnost dodavatelského řetězce",
    PRO: "Nákup a vývoj",
    EFF: "Posouzení účinnosti",
    TRN: "Kybernetická hygiena a školení",
    CRY: "Kryptografie a šifrování",
    ACC: "Řízení přístupu a personální bezpečnost",
    AUT: "Autentizace a komunikace",
    REG: "Registrace a hlášení",
  },
};

/** Categories in process order, for the chronological view's group headers. */
export const ORDERED_CATEGORIES: {
  code: string;
  name: Localized;
  slug: string;
  sortOrder: number;
}[] = [...nis2Categories]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((c) => {
    const en = c.name ?? c.code;
    return {
      code: c.code,
      name: {
        en,
        de: CATEGORY_NAME.de[c.code] ?? en,
        cs: CATEGORY_NAME.cs[c.code] ?? en,
      },
      slug: c.slug ?? c.code.toLowerCase(),
      sortOrder: c.sortOrder,
    };
  });

/** Localized human labels for requirement.frequency slugs. */
export const FREQUENCY_LABEL: Record<string, Localized> = {
  annual: { en: "Annual", de: "Jährlich", cs: "Ročně" },
  quarterly: { en: "Quarterly", de: "Vierteljährlich", cs: "Čtvrtletně" },
  monthly: { en: "Monthly", de: "Monatlich", cs: "Měsíčně" },
  "every-3-years": { en: "Every 3 years", de: "Alle 3 Jahre", cs: "Každé 3 roky" },
  "on-change": { en: "On change", de: "Bei Änderung", cs: "Při změně" },
  "one-time": { en: "One-time", de: "Einmalig", cs: "Jednorázově" },
  ongoing: { en: "Ongoing", de: "Laufend", cs: "Průběžně" },
};

const CATEGORY_ROLE: Record<string, string> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.relevantRoles?.[0] ?? "ciso"]),
);

const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.sortOrder]),
);

/**
 * True journey position: the shared urgency-then-process order.
 *
 * Read from the canonical helper rather than restated here, because the
 * guided path, the swimlane banner, the activation nudge and the digest are
 * only ever consistent while they read the same function.
 */
function globalOrder(item: JourneyItem): number {
  return journeyIndex(item.code);
}

/**
 * Process order: the category sequence, then the index within it, ignoring
 * urgency. Journey order leads with criticality, so the swimlane's
 * chronological mode has to re-sort rather than take the incoming order —
 * without this its row numbers ran 1, 9, 23 inside a single category.
 */
export function processOrder(node: Pick<FlowNode, "categoryCode" | "sortOrder">): number {
  return (CATEGORY_ORDER[node.categoryCode] ?? 99) * 100 + node.sortOrder;
}

/** Band display rank, for the defensible-minimum ordering. */
export const BAND_RANK: Record<Band, number> = {
  minimum: 0,
  year: 1,
  later: 2,
};

function columnFor(role: string): ColumnKey {
  return ROLE_COLUMN[role] ?? "security";
}

/** Where a requirement node links to. One definition for every journey view. */
export function requirementHref(node: Pick<FlowNode, "categorySlug" | "code">) {
  return {
    pathname: "/compliance/[categorySlug]/[requirementCode]" as const,
    params: { categorySlug: node.categorySlug, requirementCode: node.code },
  };
}

/**
 * The call to action on the live step: whether work has already begun on it, or only the
 * sign-off is left. The hero, the pinned bar and the pill over the node all say this, and must
 * agree.
 */
export function startLabel(state: DotState, locale: JourneyLocale): string {
  if (state === "awaiting") return START_LABEL.awaiting[locale];
  if (state === "started") return START_LABEL.started[locale];
  return START_LABEL.todo[locale];
}

const START_LABEL: Record<"awaiting" | "started" | "todo", Localized> = {
  awaiting: { en: "Sign off", de: "Freigeben", cs: "Schválit" },
  started: { en: "Continue", de: "Weiter", cs: "Pokračovat" },
  todo: { en: "Start", de: "Anfangen", cs: "Začít" },
};

/** Tailwind text colour for a state, so a status reads the same in every view. */
export function statusTone(state: DotState): string {
  if (state === "signed") return "text-primary";
  if (state === "awaiting") return "text-amber-600 dark:text-amber-400";
  if (state === "rejected") return "text-destructive";
  return "text-muted-foreground";
}

/** Localized requirement.frequency, falling back to the raw slug. */
export function frequencyLabel(
  frequency: string | null,
  locale: JourneyLocale,
): string | null {
  if (!frequency) return null;
  return FREQUENCY_LABEL[frequency]?.[locale] ?? frequency;
}

const REVIEW_CLOCK: Record<
  JourneyLocale,
  { overdue: (days: number) => string; today: string; next: (days: number) => string }
> = {
  en: {
    overdue: (days) =>
      `Review ${countOf("en", days, { one: "day", other: "days" })} overdue`,
    today: "Review due today",
    next: (days) =>
      `Next review in ${countOf("en", days, { one: "day", other: "days" })}`,
  },
  de: {
    overdue: (days) =>
      `Prüfung ${countOf("de", days, { one: "Tag", other: "Tage" })} überfällig`,
    today: "Prüfung heute fällig",
    next: (days) =>
      `Nächste Prüfung in ${countOf("de", days, { one: "Tag", other: "Tagen" })}`,
  },
  cs: {
    overdue: (days) =>
      `Přezkum ${countOf("cs", days, { one: "den", few: "dny", other: "dní" })} po termínu`,
    today: "Přezkum je na řadě dnes",
    next: (days) =>
      `Další přezkum za ${countOf("cs", days, { one: "den", few: "dny", other: "dní" })}`,
  },
};

/**
 * Localized recurring-review clock, or null where there is no review date.
 *
 * Only ever called with the server-computed `dueInDays`, which is gated to
 * review statuses: a never-done item carries an initial implementation
 * deadline, and calling that a late review would be wrong.
 */
export function reviewLabel(
  dueInDays: number | null,
  locale: JourneyLocale,
): string | null {
  if (dueInDays === null) return null;
  const clock = REVIEW_CLOCK[locale];
  if (dueInDays < 0) return clock.overdue(-dueInDays);
  if (dueInDays === 0) return clock.today;
  return clock.next(dueInDays);
}

/** A node's status in the words every export uses too (`requirementStatusLabel`). */
export const statusLabel = (
  node: Pick<FlowNode, "rawStatus" | "state" | "coveredBy">,
  locale: JourneyLocale,
): string =>
  requirementStatusLabel({ ...node, approved: node.rawStatus === "approved" }, locale);

/** The band a priority falls in, off the one priority-to-tier mapping. */
function bandForPriority(priority: string | null): Band {
  return (["minimum", "year", "later"] as const)[priorityRank(priority)];
}

/**
 * Requirement-level nodes (all 49, coded like "2.2"), pre-sorted into the
 * canonical chronological (process) order. The flow re-groups them per the
 * active ordering. CEO sign-off items move to the Management column.
 */
export function buildRequirementNodes(items: JourneyItem[]): FlowNode[] {
  const live = liveNode(items)?.code ?? null;
  return [...items]
    .sort((a, b) => globalOrder(a) - globalOrder(b))
    .map((it) => {
      const ownerRole =
        it.requiredSignOffRole === "ceo"
          ? "ceo"
          : (CATEGORY_ROLE[it.categoryCode] ?? "ciso");
      const done = isDoneState(it.state);
      const status: NodeStatus = done
        ? "done"
        : it.code === live
          ? "current"
          : "upcoming";
      return {
        id: it.id,
        code: it.code,
        label: it.title,
        categorySlug: it.categorySlug,
        categoryCode: it.categoryCode,
        band: bandForPriority(it.priority),
        column: columnFor(ownerRole),
        ownerRole,
        status,
        rawStatus: it.status,
        state: it.state,
        coveredBy: it.coveredBy,
        // Recurring review (server-computed, calendar days, review-status-gated).
        isOverdue: it.dueInDays !== null && it.dueInDays < 0,
        dueInDays: it.dueInDays,
        priority: it.priority,
        description: it.description,
        legalRef: it.legalRef,
        frequency: it.frequency,
        sortOrder: it.sortOrder,
        signOff: it.signOff,
      };
    });
}
