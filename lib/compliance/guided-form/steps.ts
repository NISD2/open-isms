/**
 * The opening of the Durchgang, as data. Pure: no database, no React, no IO.
 *
 * **This file used to hold a three-screen interview and it was deleted on 25.09.2026.** It asked
 * twenty-one options across three screens to move four of fifty-three items, which is the same
 * ratio that got the proportionality engine retired the day before: measured, the perfect set of
 * interview answers moved four decisions out of about 144. Rebuilding it as onboarding did not make
 * it earn its keep. The screen at the end of it said "53 von 53 gelten für Sie", which is a promise
 * of subtraction paying out nothing.
 *
 * What replaces it is not a smaller interview. It is no interview: the journey's own first items,
 * in journey order, one question per screen. Item 12.1 already asks the classification question,
 * and it has **two** options rather than twenty-one, because the statute has two categories. Item
 * 12.2 is the BSI registration, which answers by post, so it is the first real test of leaving a
 * step waiting.
 *
 * The fields each screen collects are named from `REG_SCHEMA` in `lib/compliance/category-schemas.ts`
 * rather than restated here, so adding a field to that schema does not need an edit in this file.
 */

import type { ItemState } from "./policy";

// ---------------------------------------------------------------------------
// The steps
// ---------------------------------------------------------------------------

export type StepId = "welcome" | "classification" | "sectors" | "registration";

/**
 * provision  shows something and asks for nothing. It can never block, which is why the flow
 *            opens with one.
 * question   asks for the fields of one journey item. One question per screen.
 */
export type StepKind = "provision" | "question";

/**
 * What the sidebar may say, expressed as a claim against the vendored statute rather than as prose
 * someone can edit. The test resolves every paragraph and phrase in `data/law/bsig-2025.json`, so a
 * sidebar cannot quietly start quoting a law that does not say it.
 *
 * The sidebar explains and never recommends. The moment it recommends we are selling an opinion,
 * which is what the engine was retired for.
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
  /** Keys of `REG_SCHEMA` this screen collects. Empty where the screen asks for nothing. */
  readonly fields: readonly string[];
  readonly sidebar: Sidebar | null;
  /** Why this step sits at this position. The order carries the design, so it is written down. */
  readonly why: string;
}

/**
 * The order, and it is the journey's own order rather than one invented for onboarding.
 *
 * Journey position ranks 12.1 first and 12.2 second, ahead of the management training and the risk
 * methodology. That is not an accident of sorting: you cannot register with the BSI without knowing
 * which category you are in, and the registration form asks.
 */
export const STEPS = [
  {
    id: "welcome",
    kind: "provision",
    item: "12.1",
    fields: [],
    sidebar: null,
    why: "Provision asks for nothing, so it can never block. Opening on a question would put the first possible wait on screen one.",
  },
  {
    id: "classification",
    kind: "question",
    item: "12.1",
    fields: ["entityClassification"],
    sidebar: {
      paragraphs: ["§ 28"],
      phrases: [
        "Als besonders wichtige Einrichtung gelten",
        "Als wichtige Einrichtungen gelten",
      ],
    },
    why: "First because the statute has exactly two categories and everything after it, the registration included, depends on which one. Two options, not a taxonomy.",
  },
  {
    id: "sectors",
    kind: "question",
    item: "12.1",
    fields: ["applicableSectors"],
    sidebar: {
      paragraphs: ["§ 28"],
      phrases: ["in Anlage 1 bestimmten Einrichtungsarten"],
    },
    why: "Second because it is the rest of item 12.1 and it is a recall question, which should never be the first thing someone meets.",
  },
  {
    id: "registration",
    kind: "question",
    item: "12.2",
    fields: ["mukAccountId", "bsiRegistrationDate", "registrationProofUploaded"],
    sidebar: {
      paragraphs: ["§ 33"],
      phrases: ["Pflicht zur Registrierung nicht erfüllt"],
    },
    why: "The BSI answers by post, so this is the first step that can genuinely be blocked on the outside world. It is placed early on purpose: if waiting works here, it works everywhere.",
  },
] as const satisfies readonly Step[];

// ---------------------------------------------------------------------------
// What the company has said so far
// ---------------------------------------------------------------------------

/**
 * A step left waiting: a recorded state with a reason, never a skip and never a failure.
 *
 * Item 12.2 is the example that makes this compulsory rather than nice. Without it the first
 * externally blocked step stops the whole Durchgang on day one, in the exact place the visitor was
 * supposed to feel progress.
 */
export interface Waiting {
  readonly reason: string;
  /** ISO date, where they named one. A wait with no date is still a wait. */
  readonly until?: string;
}

export interface Answers {
  /** Keyed by `REG_SCHEMA` field name. The shape the category intake blob already stores. */
  readonly values: Readonly<Record<string, unknown>>;
  readonly waiting: Readonly<Partial<Record<StepId, Waiting>>>;
}

export const NOTHING_ANSWERED: Answers = { values: {}, waiting: {} };

/** An answer is present when it is not empty. An empty string is not an answer. */
export const hasValue = (v: unknown): boolean =>
  v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "");

// ---------------------------------------------------------------------------
// State and navigation
// ---------------------------------------------------------------------------

/**
 * A step's state, in the policy's own vocabulary so `resumeAt` works over steps and items alike.
 *
 * `required` is passed in rather than restated here, because which fields are required is decided
 * by the Zod schema and duplicating that would let the two drift.
 *
 * A step that asks nothing is settled: there is nothing to come back for, so a returning visitor is
 * not made to re-read the introduction.
 */
export const stepState = (
  step: Step,
  a: Answers,
  required: ReadonlySet<string>,
): ItemState => {
  const must = step.fields.filter((f) => required.has(f));
  if (must.length === 0) return "settled";
  if (must.every((f) => hasValue(a.values[f]))) return "settled";
  return a.waiting[step.id] ? "blocked" : "open";
};

/** A step can be left waiting only if it asks for something. */
export const canWait = (step: Step): boolean => step.kind === "question";

const indexOf = (id: StepId): number => STEPS.findIndex((s) => s.id === id);

export const stepById = (id: string): Step | null =>
  STEPS.find((s) => s.id === id) ?? null;

export const stepAfter = (id: StepId): Step | null => STEPS[indexOf(id) + 1] ?? null;

export const stepBefore = (id: StepId): Step | null => {
  const i = indexOf(id);
  return i > 0 ? (STEPS[i - 1] ?? null) : null;
};
