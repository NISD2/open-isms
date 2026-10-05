/**
 * What the walk leaves in a company's account: the documents it writes and the records it keeps.
 * Read off the screen script, never listed by hand, so the approval page (/pricing/approval) names
 * nothing the walk does not produce. A new screen kind does not compile until it is placed here.
 *
 * Only items every company walks count; an item for operators of critical facilities alone
 * (`onlyFor`) is left out, since the page speaks to everyone.
 */
import { WALK, WALK_POLICIES } from "./index";
import type { AnyScreen, PolicyTemplate } from "./types";

export type WalkRecord =
  | "assets"
  | "suppliers"
  | "risks"
  | "agreements"
  | "logins"
  | "critical"
  | "backups"
  | "crypto"
  | "training_management"
  | "training_staff"
  | "management_review"
  | "approvals";

/** The record a screen writes into, or null for a screen that explains, asks or shows. */
export const recordOf = (screen: AnyScreen): WalkRecord | null => {
  switch (screen.kind) {
    case "assets":
    case "specify":
      return "assets";
    case "register":
      switch (screen.module) {
        case "supplier":
          return "suppliers";
        case "management_review":
          return "management_review";
        case "training_record":
          return screen.audience === "management"
            ? "training_management"
            : "training_staff";
        default:
          return screen satisfies never;
      }
    case "adopt":
    case "rate":
    case "riskmap":
      return "risks";
    case "agreements":
      return "agreements";
    case "logins":
      return "logins";
    case "critical":
      return "critical";
    case "backups":
      return "backups";
    case "crypto":
      return "crypto";
    case "approve":
      return "approvals";
    // Answers on a fields or evidence screen go into the item's own record and its document;
    // a policy screen is a document (`WALK_DOCUMENTS`).
    case "learn":
    case "prepare":
    case "compare":
    case "sample":
    case "reading":
    case "provision":
    case "fields":
    case "evidence":
    case "policy":
    case "ongoing":
    case "done":
      return null;
    default:
      return screen satisfies never;
  }
};

const forEveryone = new Set(
  WALK.filter((item) => item.onlyFor === undefined).map((item) => item.code),
);

/** The documents the walk writes, in walk order. */
export const WALK_DOCUMENTS: readonly PolicyTemplate[] = [
  ...new Set(WALK_POLICIES.filter((p) => forEveryone.has(p.code)).map((p) => p.policy)),
];

/** The records the walk keeps, in the order it first writes each. */
export const WALK_RECORDS: readonly WalkRecord[] = [
  ...new Set(
    WALK.filter((item) => forEveryone.has(item.code)).flatMap((item) => {
      const screens: readonly AnyScreen[] = item.screens;
      return screens.flatMap((screen) => recordOf(screen) ?? []);
    }),
  ),
];
