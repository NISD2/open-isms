/**
 * The Durchgang core: the screen script, its words and each item's state. Pure: no React, no
 * database, no request. This file is the only way in.
 */

import { JOURNEY_ORDER } from "@/lib/compliance/journey-position";
import { NIS2_SCRIPT } from "./nis2";
import type { AnyItem } from "./types";

export type { ResolvedItem, ResolvedScreen } from "./copy";
export { itemKey, resolveItem } from "./copy";
export type { NoteLocale } from "./notes";
export {
  declinedNote,
  methodNote,
  noteLine,
  sourcesNote,
  waitingNote,
} from "./notes";
export type { DurchgangEvent, ItemState, StatusRow, WaitReason } from "./state";
export {
  DURCHGANG_ACTIONS,
  itemState,
  resumeAt,
  STATE_ACTIONS,
  WAIT_REASONS,
} from "./state";
export type {
  Adoptable,
  AnyItem,
  AnyScreen,
  LearnLink,
  Provision,
  RegisterModule,
  ScreenKind,
  SourceId,
} from "./types";
export { SOURCE_IDS } from "./types";

const BY_CODE: ReadonlyMap<string, AnyItem> = new Map(
  NIS2_SCRIPT.map((i) => [i.code, i]),
);

/** The items the Durchgang walks, in journey order. */
export const WALK: readonly AnyItem[] = JOURNEY_ORDER.flatMap((code) => {
  const item = BY_CODE.get(code);
  return item ? [item] : [];
});

/** The intake fields an item asks for: on its field screens, and the one its upload fills. */
export const askedFields = (item: AnyItem): readonly string[] =>
  item.screens.flatMap<string>((s) =>
    s.kind === "fields" ? s.fields : s.kind === "evidence" && s.field ? [s.field] : [],
  );
