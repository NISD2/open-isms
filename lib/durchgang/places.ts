import type { AnyItem, AnyScreen } from "./types";

/** The registers the walk writes into, each with its own page in the portal. */
export const WALK_REGISTERS = [
  "assets",
  "suppliers",
  "risks",
  "policies",
  "training",
  "managementReviews",
] as const;
export type WalkRegister = (typeof WALK_REGISTERS)[number];

/** Which screens write into which register. */
const WRITES: Readonly<Record<WalkRegister, (screen: AnyScreen) => boolean>> = {
  assets: (s) =>
    s.kind === "assets" ||
    s.kind === "logins" ||
    s.kind === "backups" ||
    s.kind === "critical",
  suppliers: (s) =>
    s.kind === "agreements" || (s.kind === "register" && s.module === "supplier"),
  risks: (s) => s.kind === "rate" || s.kind === "riskmap",
  policies: (s) => s.kind === "policy" || s.kind === "crypto",
  training: (s) => s.kind === "register" && s.module === "training_record",
  managementReviews: (s) => s.kind === "register" && s.module === "management_review",
};

/**
 * Where a register is filled in the walk: each item that writes into it, in walk order, with the
 * index of its first screen that does, so a register page can send a person to that very step.
 */
export function placesOf(
  walk: readonly AnyItem[],
  register: WalkRegister,
): ReadonlyArray<{ readonly code: string; readonly at: number }> {
  return walk.flatMap((item) => {
    const screens: readonly AnyScreen[] = item.screens;
    const at = screens.findIndex(WRITES[register]);
    return at === -1 ? [] : [{ code: item.code, at }];
  });
}
