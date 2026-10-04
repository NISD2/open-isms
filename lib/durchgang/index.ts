/**
 * The Durchgang core: the screen script, its words and each item's state. Pure: no React, no
 * database, no request. This file is the only way in.
 */

import { JOURNEY_ORDER } from "@/lib/compliance/journey-position";
import { NIS2_SCRIPT } from "./nis2";
import type { AnyItem, AnyScreen, PolicyTemplate, WalkFacts } from "./types";

export type { ResolvedItem, ResolvedScreen } from "./copy";
export { itemKey, marker, ONGOING_COPY, resolveItem } from "./copy";
export type { CoveredBy, Covering, JourneyEntry, JourneyRow } from "./coverage";
export { coveredState, journeyStates } from "./coverage";
export type { Gap, GapFacts, ShownGap } from "./gaps";
export { GAP_STEP, gapLines, gapsOf } from "./gaps";
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
  asksHosting,
  asksSecondFactor,
  byLevel,
  cellCount,
  fromScale,
  hostingOf,
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
  reviewedWithinYear,
  STATE_ACTIONS,
  signLast,
  WAIT_REASONS,
  walkItemState,
} from "./state";
export { contactSuggestions } from "./suggest";
export type {
  Adoptable,
  AnyItem,
  AnyScreen,
  BackupFrequency,
  EntityType,
  Hosting,
  LearnLink,
  MfaMethod,
  PolicyList,
  PolicyTemplate,
  Provision,
  RegisterModule,
  ScreenKind,
  SuggestSource,
  TrainingAudience,
  WalkFacts,
  WalkLocale,
} from "./types";
export {
  askedFields,
  BACKUP_FREQUENCIES,
  HOSTINGS,
  MANAGEMENT_ROLE,
  MFA_METHODS,
  POLICY_LISTS,
  POLICY_TEMPLATES,
} from "./types";

const BY_CODE: ReadonlyMap<string, AnyItem> = new Map(
  NIS2_SCRIPT.map((i) => [i.code, i]),
);

const approves = (item: AnyItem): boolean =>
  item.screens.some((s: AnyScreen) => s.kind === "approve");

const IN_JOURNEY_ORDER: readonly AnyItem[] = JOURNEY_ORDER.flatMap((code) => {
  const item = BY_CODE.get(code);
  return item ? [item] : [];
});

/**
 * Every item of the script in journey order, with the approval last: management signs what came
 * before it, including an item the journey puts later. For looking an item up by its code; what a
 * company walks is `walkOf`.
 */
export const WALK: readonly AnyItem[] = [
  ...IN_JOURNEY_ORDER.filter((item) => !approves(item)),
  ...IN_JOURNEY_ORDER.filter(approves),
];

/**
 * The item a company not set up yet walks before setting itself up: registering with the BSI asks
 * for the name with its legal form and the sector (§ 33 Abs. 1 Nr. 1 and 3 BSIG), which setting up
 * then asks for again (Simon, 04.10.2026: "after the registration they will understand and they
 * will actually know what to fill out here").
 */
export const SETUP_AFTER = "12.2";

/** Whether a company not set up yet may open this item: the walk up to the registration. */
export const opensBeforeSetup = (code: string): boolean => {
  const at = WALK.findIndex((item) => item.code === code);
  return at !== -1 && at <= WALK.findIndex((item) => item.code === SETUP_AFTER);
};

/** The walk with setting up the company in its place, right after the registration. */
export const withSetup = <T extends { readonly code: string }>(
  walk: readonly T[],
  setup: T,
): readonly T[] => {
  const after = walk.findIndex((entry) => entry.code === SETUP_AFTER) + 1;
  return [...walk.slice(0, after), setup, ...walk.slice(after)];
};

/**
 * Whether the company operates a critical facility: its profile says KRITIS, or the fact recorded
 * for §§ 31 Abs. 2 and 39 Abs. 1 BSIG does. Nothing in the app writes that fact yet, so today the
 * entity type decides; a measured threshold will count the moment it is recorded.
 */
export const operatesCriticalFacility = (company: WalkFacts): boolean =>
  company.entityType === "kritis" || company.criticalInstallation === "yes";

/** The items a company walks: those for every entity, and those addressed to what it is. */
export const walkOf = (company: WalkFacts): readonly AnyItem[] =>
  WALK.filter((item) => item.onlyFor === undefined || operatesCriticalFacility(company));

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
