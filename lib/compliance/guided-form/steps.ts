/**
 * The opening of the Durchgang, as data. Pure: no database, no React, no IO.
 *
 * This is the flow that runs before payment, and it is the product rather than a demo (mvnis2.md
 * §4.11). Two fears are relieved in order: provision first, because it costs the visitor nothing,
 * then subtraction, which needs three facts from them and hands back a shorter list.
 *
 * It splits journey item 12.1, "NIS2-Klassifizierung & Geltungsbereich", which is one screen today
 * and asks the hardest question in the product in a single breath. The three facts it needs are
 * exactly the three the policy reads on every later step, so splitting it is not cosmetic: each
 * screen settles one field that the rest of the Durchgang then depends on.
 *
 * The flow is data so that three things are true at once. The order can be argued about without
 * touching a component. `resumeAt` from the policy works over it unchanged, which is what keeps a
 * step waiting on the outside world from stopping day one. And the order itself is testable, which
 * matters because the order carries most of the design.
 *
 * Nothing here decides anything for the company. It says which question is open to them next.
 */

import {
  type Addressee,
  applies,
  type ItemState,
  type Settled,
  type StatusFacts,
} from "./policy";

// ---------------------------------------------------------------------------
// Answer options that are statutory, so they are quoted rather than written
// ---------------------------------------------------------------------------

/**
 * The sector groups § 35 Abs. 2 names, in the statute's own words and its own order.
 *
 * Quoted rather than paraphrased because the question is whether the reader's sector is on this
 * list, and a paraphrase changes the answer. The test resolves every one of these in the vendored
 * § 35, so a tidier wording cannot creep in.
 */
export const SECTORS_35_2 = [
  "Finanzwesen",
  "Leistungen der Sozialversicherung sowie Grundsicherung für Arbeitsuchende",
  "digitale Infrastruktur",
  "Verwaltung von IKT-Diensten",
  "Digitale Dienste",
] as const;

// ---------------------------------------------------------------------------
// The steps
// ---------------------------------------------------------------------------

export type StepId =
  | "welcome"
  | "sector"
  | "service_types"
  | "critical_installation"
  | "your_number";

/**
 * provision   shows something and asks for nothing. It can never block, which is why the flow
 *             opens with one.
 * fact        asks for exactly one of the three status facts. One question per screen.
 * reflection  shows their own answers back. This is the pattern the onboarding study is clearest
 *             about and the second half of the aha.
 */
export type StepKind = "provision" | "fact" | "reflection";

/**
 * What the sidebar may say, expressed as a claim against the vendored statute rather than as prose
 * someone can edit. The test resolves every paragraph and every phrase in `data/law/bsig-2025.json`,
 * so a sidebar cannot quietly start quoting a law that does not say it.
 *
 * The sidebar explains and never recommends. The moment it recommends we are selling an opinion,
 * which is what the retired engine was retired for.
 */
export interface Sidebar {
  /** Paragraph keys as the vendored statute names them, for example "§ 28". */
  readonly paragraphs: readonly string[];
  /** Phrases quoted on screen, which must appear verbatim in one of those paragraphs. */
  readonly phrases: readonly string[];
}

export interface Step {
  readonly id: StepId;
  readonly kind: StepKind;
  /** The journey item this screen serves. Several screens may serve one item. */
  readonly item: string;
  /** The one status fact this step settles. Null for anything that asks nothing. */
  readonly settles: keyof StatusFacts | null;
  readonly sidebar: Sidebar | null;
  /** Why this step sits at this position. The order carries the design, so it is written down. */
  readonly why: string;
}

/**
 * The order, and it is deliberate rather than the order the statute or the policy lists in.
 *
 * The governing rule is competence before difficulty: the first question someone meets should be
 * one they already know the answer to, because a flow of this length loses people at the first
 * question that makes them feel stupid. That puts the sector first and the threshold last, which
 * is the reverse of how § 28 is organised.
 */
export const STEPS = [
  {
    id: "welcome",
    kind: "provision",
    item: "12.1",
    settles: null,
    sidebar: null,
    why: "Provision relieves the larger fear and asks for nothing, so it can never block. Opening on a question would put the first possible wait on screen one.",
  },
  {
    id: "sector",
    kind: "fact",
    item: "12.1",
    settles: "sector35_2",
    sidebar: {
      paragraphs: ["§ 35"],
      phrases: [...SECTORS_35_2],
    },
    why: "First because they already know the answer and it is recognition from a short list. The opening question is a confirmation rather than a test.",
  },
  {
    id: "service_types",
    kind: "fact",
    item: "12.1",
    settles: "serviceTypes",
    sidebar: {
      paragraphs: ["§ 60", "§ 30"],
      phrases: ["DNS-Diensteanbieter", "Managed Service Provider"],
    },
    why: "Second because the truth here is plural: a company can be more than one of these, and multi-select is the honest shape. Still recognition, not recall.",
  },
  {
    id: "critical_installation",
    kind: "fact",
    item: "12.1",
    settles: "criticalInstallation",
    sidebar: {
      paragraphs: ["§ 28", "§ 31"],
      phrases: [
        "Als besonders wichtige Einrichtung gelten",
        "Betreiber kritischer Anlagen",
      ],
    },
    why: "Last of the three because it is the only one that can send someone away to look up a threshold, so it is the only one likely to be left waiting. A wait costs nothing here, because the two easy answers are already recorded.",
  },
  {
    id: "your_number",
    kind: "reflection",
    item: "12.1",
    settles: null,
    sidebar: null,
    why: "Immediately after the facts, because showing the answers back is what turns three questions into a shorter list. Delaying it spends the answers without paying for them.",
  },
] as const satisfies readonly Step[];

// ---------------------------------------------------------------------------
// What the company has said so far
// ---------------------------------------------------------------------------

/**
 * A step left waiting: a recorded state with a reason, never a skip and never a failure.
 *
 * The example that makes this compulsory rather than nice is the next journey item, 12.2, the BSI
 * registration, which answers by post. Without this the first externally blocked step stops the
 * whole Durchgang on day one, in the exact place the visitor was supposed to feel progress.
 */
export interface Waiting {
  readonly reason: string;
  /** ISO date, where they named one. A wait with no date is still a wait. */
  readonly until?: string;
}

export interface Answers {
  readonly facts: StatusFacts;
  readonly waiting: Readonly<Partial<Record<StepId, Waiting>>>;
}

export const NOTHING_ANSWERED: Answers = {
  facts: {
    criticalInstallation: "unsettled",
    serviceTypes: "unsettled",
    sector35_2: "unsettled",
  },
  waiting: {},
};

/**
 * Whether one status fact has an answer.
 *
 * `serviceTypes` carries its unknown differently from the other two, and the difference is
 * load-bearing: an empty list means "none of these", which is a real answer a company gave, while
 * "unsettled" means nobody has said. Collapsing the two is how a form quietly asserts something
 * the company never said, which is the defect this whole module exists to avoid.
 */
const answered = (f: StatusFacts, key: keyof StatusFacts): boolean =>
  key === "serviceTypes" ? f.serviceTypes !== "unsettled" : f[key] !== "unsettled";

// ---------------------------------------------------------------------------
// State and navigation
// ---------------------------------------------------------------------------

/**
 * A step's state, in the policy's own vocabulary so `resumeAt` works over steps and items alike.
 *
 * A step that asks nothing is settled: there is nothing to come back for, so a returning visitor
 * is not made to re-read the introduction.
 */
export const stepState = (step: Step, a: Answers): ItemState => {
  if (step.kind !== "fact" || step.settles === null) return "settled";
  if (answered(a.facts, step.settles)) return "settled";
  return a.waiting[step.id] ? "blocked" : "open";
};

/** Answering clears a wait, so a step is never both. The tests enumerate this as a property. */
export const isWaiting = (step: Step, a: Answers): boolean =>
  stepState(step, a) === "blocked";

/** A step can be left waiting only if it asks for something. */
export const canWait = (step: Step): boolean => step.kind === "fact";

const indexOf = (id: StepId): number => STEPS.findIndex((s) => s.id === id);

export const stepById = (id: string): Step | null =>
  STEPS.find((s) => s.id === id) ?? null;

export const stepAfter = (id: StepId): Step | null => STEPS[indexOf(id) + 1] ?? null;

export const stepBefore = (id: StepId): Step | null => {
  const i = indexOf(id);
  return i > 0 ? (STEPS[i - 1] ?? null) : null;
};

// ---------------------------------------------------------------------------
// The number they are shown back
// ---------------------------------------------------------------------------

/**
 * One addressee that does not address them, with the count it removes.
 *
 * Carried separately rather than summed because the screen has to name the reason. A list that
 * gets shorter without a reason is a magic trick. With the reason it is the thing that would
 * survive an audit, which is the entire point of the subtraction.
 */
export interface Removed {
  readonly addressee: Addressee;
  readonly count: number;
}

export interface Reduction {
  /** Items that address this company on the facts given so far. */
  readonly addressed: number;
  /** Items that do not, grouped by the reason they do not. */
  readonly removed: readonly Removed[];
  /** Items whose addressee turns on a fact nobody has settled. Neither counted nor removed. */
  readonly unsettled: number;
  readonly total: number;
}

/**
 * Sort the register against the three facts.
 *
 * Counts ITEMS and not control decisions, deliberately. The control count is the more impressive
 * number and we cannot derive it honestly yet: it comes from the crosswalk, which a later slice
 * seeds. Showing a number we cannot derive would break the one rule this product sells on.
 *
 * An unsettled fact removes nothing and adds nothing. It is its own bucket, so a half-finished
 * flow shows a smaller certain number rather than a larger uncertain one.
 */
export const reduction = (
  items: readonly { readonly addressee: Addressee }[],
  facts: StatusFacts,
): Reduction => {
  const verdicts = items.map((i) => ({
    addressee: i.addressee,
    verdict: applies(i.addressee, facts),
  }));
  const groupedBy = (v: Settled): Removed[] => {
    const hits = verdicts.filter((x) => x.verdict === v);
    return [...new Set(hits.map((h) => h.addressee))].map((a) => ({
      addressee: a,
      count: hits.filter((h) => h.addressee === a).length,
    }));
  };
  return {
    addressed: verdicts.filter((v) => v.verdict === "yes").length,
    removed: groupedBy("no"),
    unsettled: verdicts.filter((v) => v.verdict === "unsettled").length,
    total: items.length,
  };
};
