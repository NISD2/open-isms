/**
 * What a lifecycle email says about a company's walkthrough: how many steps its home lists, how
 * many are finished, and the step its Continue button opens. Pure, and the home's own rules
 * (components/durchgang/DurchgangHome.tsx): a company not set up yet walks setting itself up as a
 * step of its own (`withSetup`), a step is finished when `isSettled` says so, and the next one is
 * `resumeAt`'s. A locked walk, an account that has not paid, has walked nothing: its home shows
 * every step open, so the email does too.
 */
import {
  type AnyItem,
  type ItemState,
  isSettled,
  NIS2_WALK,
  resumeAt,
  SETUP_STEP,
  withSetup,
} from "@/lib/durchgang";

/** A step of the walk as its home lists it: one of the items, or setting up the company. */
export type WalkStep =
  | { readonly kind: "item"; readonly item: AnyItem }
  | { readonly kind: "setup" };

export interface WalkProgress {
  readonly total: number;
  readonly done: number;
  /** The step Continue opens; null when every step is finished. */
  readonly next: WalkStep | null;
}

const OPEN: ItemState = { kind: "open" };

interface Entry {
  readonly code: string;
  readonly step: WalkStep;
  readonly state: ItemState;
}

export function walkProgress({
  walk,
  states,
  setUp,
}: {
  /** The items of the NIS 2 walk the company walks (`itemsFor`): the walk the emails are about. */
  readonly walk: readonly AnyItem[];
  /** Each item's state by code (`walkStates`); null for a locked walk. */
  readonly states: ReadonlyMap<string, ItemState> | null;
  /** Whether the company is set up; until it is, setting it up is a step. */
  readonly setUp: boolean;
}): WalkProgress {
  const items = walk.map(
    (item): Entry => ({
      code: item.code,
      step: { kind: "item", item },
      state: states?.get(item.code) ?? OPEN,
    }),
  );
  const steps = setUp
    ? items
    : withSetup<Entry>(NIS2_WALK, items, {
        code: SETUP_STEP,
        step: { kind: "setup" },
        state: OPEN,
      });
  return {
    total: steps.length,
    done: steps.filter((s) => isSettled(s.state)).length,
    next: resumeAt(steps, (s) => s.state)?.step ?? null,
  };
}
