/**
 * The Durchgang core: the screen script, its words and each item's state. Pure: no React, no
 * database, no request. This file is the only way in.
 */

import { JOURNEY_ORDER } from "@/lib/compliance/journey-position";
import { NIS2_SCRIPT } from "./nis2";
import type { AnyItem, AnyScreen, PolicyTemplate } from "./types";

export type { ResolvedItem, ResolvedScreen } from "./copy";
export { itemKey, marker, resolveItem } from "./copy";
export { dutyHref } from "./law";
export {
  agreementsNote,
  approvedNote,
  backupsNote,
  criticalNote,
  cryptoNote,
  declinedNote,
  enteredDay,
  loginsNote,
  methodNote,
  noteLine,
  recordDay,
  recordedDay,
  waitingNote,
} from "./notes";
export type { CryptoLabels, PolicyDocument, PolicyPart } from "./policy";
export {
  acceptedCryptoText,
  criticalProcessesText,
  personText,
  policyNames,
  policyParts,
  policySignature,
  policyText,
  policyTitle,
  recoveryOrderText,
  reportingChannelText,
} from "./policy";
export type {
  AssetSlice,
  LinkedRisk,
  MappedRisk,
  ProviderLink,
  RatedKind,
  Rating,
  RatingRow,
  RatingTarget,
  Standing,
  StoredRisk,
} from "./ratings";
export {
  byLevel,
  cellCount,
  fromScale,
  inCell,
  levelGroups,
  levelOf,
  levelOfStanding,
  providersOf,
  RATED_KINDS,
  ratingKey,
  ratingRows,
  ratingText,
  recoveryOrder,
  SUPPLIER_LEVEL,
  signsIn,
  sliceOf,
  standingOf,
  toScale,
  treatmentFor,
} from "./ratings";
export type {
  DurchgangAction,
  DurchgangEvent,
  ItemState,
  StatusRow,
  WaitReason,
} from "./state";
export {
  awaitingSignature,
  DURCHGANG_ACTIONS,
  itemState,
  resumeAt,
  STATE_ACTIONS,
  WAIT_REASONS,
} from "./state";
export { contactSuggestions } from "./suggest";
export type {
  Adoptable,
  AnyItem,
  AnyScreen,
  BackupFrequency,
  LearnLink,
  MfaMethod,
  PolicyList,
  PolicyTemplate,
  Provision,
  RegisterModule,
  ScreenKind,
  SuggestSource,
  TrainingAudience,
  WalkLocale,
} from "./types";
export {
  askedFields,
  BACKUP_FREQUENCIES,
  MANAGEMENT_ROLE,
  MFA_METHODS,
  POLICY_LISTS,
  POLICY_TEMPLATES,
} from "./types";

const BY_CODE: ReadonlyMap<string, AnyItem> = new Map(
  NIS2_SCRIPT.map((i) => [i.code, i]),
);

/** The items the Durchgang walks, in journey order. */
export const WALK: readonly AnyItem[] = JOURNEY_ORDER.flatMap((code) => {
  const item = BY_CODE.get(code);
  return item ? [item] : [];
});

/** Where management approves the walk's documents: the item and the index of its screen. */
export const APPROVAL_SCREEN: { readonly code: string; readonly at: number } | null =
  WALK.flatMap((item) => {
    const screens: readonly AnyScreen[] = item.screens;
    const at = screens.findIndex((s) => s.kind === "approve");
    return at === -1 ? [] : [{ code: item.code, at }];
  })[0] ?? null;

/** Every policy the walk writes: the item, its template and the index of its policy screen. */
export const WALK_POLICIES: ReadonlyArray<{
  readonly code: string;
  readonly policy: PolicyTemplate;
  readonly at: number;
}> = WALK.flatMap((item) => {
  const screens: readonly AnyScreen[] = item.screens;
  return screens.flatMap((screen, at) =>
    screen.kind === "policy" ? [{ code: item.code, policy: screen.policy, at }] : [],
  );
});
