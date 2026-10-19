/**
 * Every walk, and the lookups that span them. Requirement codes are unique across frameworks
 * (`requirement.code`), so a code names its walk, and a procedure that takes a code needs no
 * framework beside it.
 */

import { NIS2_WALK } from "./nis2";
import type {
  AnyItem,
  AnyScreen,
  PolicyTemplate,
  Walk,
  WalkFacts,
  WalkFramework,
} from "./types";

export const WALKS: Readonly<Record<WalkFramework, Walk>> = { nis2: NIS2_WALK };

const BY_CODE: ReadonlyMap<string, { readonly walk: Walk; readonly item: AnyItem }> =
  new Map(
    Object.values(WALKS).flatMap((walk) =>
      walk.items.map((item) => [item.code, { walk, item }] as const),
    ),
  );

/** The walk an item belongs to, or null for a code no walk has. */
export const walkOfCode = (code: string): Walk | null => BY_CODE.get(code)?.walk ?? null;

/** An item of any walk by its code, or null. */
export const itemOf = (code: string): AnyItem | null => BY_CODE.get(code)?.item ?? null;

/** Every item of every walk. */
export const ALL_ITEMS: readonly AnyItem[] = [...BY_CODE.values()].map((e) => e.item);

/**
 * Whether the company operates a critical facility: its profile says KRITIS, or the fact recorded
 * for §§ 31 Abs. 2 and 39 Abs. 1 BSIG does. Nothing in the app writes that fact yet, so today the
 * entity type decides; a measured threshold will count the moment it is recorded.
 */
export const operatesCriticalFacility = (company: WalkFacts): boolean =>
  company.entityType === "kritis" || company.criticalInstallation === "yes";

/** The items of a walk a company walks: those for every company, and those addressed to what it is. */
export const itemsFor = (walk: Walk, company: WalkFacts): readonly AnyItem[] =>
  walk.items.filter(
    (item) => item.onlyFor === undefined || operatesCriticalFacility(company),
  );

const screensOf = (item: AnyItem): readonly AnyScreen[] => item.screens;

/** Where management approves a walk's documents: the item and the index of its screen. */
export const approvalOf = (
  walk: Walk,
): { readonly code: string; readonly at: number } | null =>
  walk.items.flatMap((item) => {
    const at = screensOf(item).findIndex((s) => s.kind === "approve");
    return at === -1 ? [] : [{ code: item.code, at }];
  })[0] ?? null;

/** Every policy a walk writes: the item, its template and the index of its policy screen. */
export const policiesOf = (
  walk: Walk,
): ReadonlyArray<{
  readonly code: string;
  readonly policy: PolicyTemplate;
  readonly at: number;
}> =>
  walk.items.flatMap((item) =>
    screensOf(item).flatMap((screen, at) =>
      screen.kind === "policy" ? [{ code: item.code, policy: screen.policy, at }] : [],
    ),
  );

/** Whether a company not set up yet may open this item: the walk up to its `setupAfter`. */
export const opensBeforeSetup = (code: string): boolean => {
  const walk = walkOfCode(code);
  if (!walk?.setupAfter) return false;
  const { setupAfter } = walk;
  const at = walk.items.findIndex((item) => item.code === code);
  return at <= walk.items.findIndex((item) => item.code === setupAfter);
};

/** A walk's steps with setting up the company in its place, right after its `setupAfter`. */
export const withSetup = <T extends { readonly code: string }>(
  walk: Walk,
  steps: readonly T[],
  setup: T,
): readonly T[] => {
  if (!walk.setupAfter) return steps;
  const { setupAfter } = walk;
  const after = steps.findIndex((entry) => entry.code === setupAfter) + 1;
  return [...steps.slice(0, after), setup, ...steps.slice(after)];
};
