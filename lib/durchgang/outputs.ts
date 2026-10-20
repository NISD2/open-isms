/**
 * What the walk leaves in a company's account: the documents it writes and the records it keeps.
 * Read off the screen script, never listed by hand, so the approval page (/pricing/approval) names
 * nothing the walk does not produce. A new screen kind does not compile until it is placed here.
 *
 * Only items every company walks count; an item for operators of critical facilities alone
 * (`onlyFor`) is left out, since the page speaks to everyone. The offer is every walk (NIS 2 and
 * the GDPR since 20.10.2026), so these are all walks' outputs, NIS 2's first.
 */
import type { AnyScreen, PolicyTemplate } from "./types";
import { ALL_ITEMS, policiesOf, WALKS } from "./walks";

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
  | "approvals"
  | "processing_activities"
  | "processors";

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
    case "activities":
    case "describe":
      return "processing_activities";
    case "processors":
      return "processors";
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
  ALL_ITEMS.filter((item) => item.onlyFor === undefined).map((item) => item.code),
);

/** The documents the walks write, in walk order. */
export const WALK_DOCUMENTS: readonly PolicyTemplate[] = [
  ...new Set(
    Object.values(WALKS)
      .flatMap(policiesOf)
      .filter((p) => forEveryone.has(p.code))
      .map((p) => p.policy),
  ),
];

/** The records the walks keep, in the order they first write each. */
export const WALK_RECORDS: readonly WalkRecord[] = [
  ...new Set(
    ALL_ITEMS.filter((item) => forEveryone.has(item.code)).flatMap((item) => {
      const screens: readonly AnyScreen[] = item.screens;
      return screens.flatMap((screen) => recordOf(screen) ?? []);
    }),
  ),
];
