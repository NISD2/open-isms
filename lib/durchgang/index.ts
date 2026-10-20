/**
 * The Durchgang core: the screen script, its words and each item's state. Pure: no React, no
 * database, no request. This file is the only way in.
 */

export { answerRefsOf, refKey } from "./answer-refs";
export type { ResolvedItem, ResolvedScreen } from "./copy";
export { itemKey, marker, ONGOING_COPY, resolveItem } from "./copy";
export type { CoveredBy, Covering, JourneyEntry, JourneyRow } from "./coverage";
export { coveredState, journeyStates } from "./coverage";
export { alsoCountsFor } from "./credit";
export type { DpoRecord } from "./dpo";
export { dpoOf } from "./dpo";
export type { Gap, GapFacts, ShownGap } from "./gaps";
export { GAP_STEP, gapLines, gapsOf, withPlanSlot } from "./gaps";
export { GDPR_WALK } from "./gdpr";
export type {
  ActivityFact,
  ActivityGroup,
  LegalBasis,
  ProcessorAnswer,
  ProcessorFact,
  ProcessorRole,
  StoredProcessor,
  SubprocessorAuthorisation,
  ThroughSupplier,
  TransferMechanism,
} from "./gdpr-records";
export {
  ACTIVITY_FACTS,
  ACTIVITY_GROUPS,
  isProcessor,
  isYesNoFact,
  LEGAL_BASES,
  legalBasesIn,
  PROCESSOR_ROLES,
  processorAnswerSchema,
  roleOf,
  SUBPROCESSOR_AUTHORISATIONS,
  storedAnswer,
  TRANSFER_MECHANISMS,
  throughSupplier,
  transferComplete,
  YES_NO_FACTS,
} from "./gdpr-records";
export { dutyHref } from "./law";
export { leavesNoChoice } from "./must-do";
export { NIS2_WALK } from "./nis2";
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
  WALK_DATE_LOCALE,
  waitingNote,
} from "./notes";
export type { CryptoLabels, PolicyDocument, PolicyPart } from "./policy";
export {
  acceptedCryptoText,
  criticalProcessesText,
  dataProtectionOfficerText,
  personText,
  policyNames,
  policyParts,
  policySignature,
  policyText,
  policyTitle,
  recoveryOrderText,
  reportingChannelText,
  securityDocumentsText,
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
export { itemHref, WALK_ROUTES } from "./routes";
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
  isSettled,
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
  AnswerRef,
  AnyItem,
  AnyScreen,
  BackupFrequency,
  ClauseEvidence,
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
  Walk,
  WalkFacts,
  WalkFramework,
  WalkLocale,
} from "./types";
export {
  askedFields,
  BACKUP_FREQUENCIES,
  HOSTINGS,
  inAudience,
  MANAGEMENT_ROLE,
  MFA_METHODS,
  POLICY_LISTS,
  POLICY_TEMPLATES,
  TRAINING_ROW,
  WALK_FRAMEWORKS,
  WALK_LOCALES,
  walkLocaleOf,
} from "./types";
export {
  ALL_ITEMS,
  approvalOf,
  itemOf,
  itemsFor,
  opensBeforeSetup,
  operatesCriticalFacility,
  personFieldsOf,
  policiesOf,
  WALKS,
  walkOfCode,
  withSetup,
} from "./walks";

import { walkOfCode } from "./walks";

/** Setting up the company, as a step of the walk. It has no item code, so it carries its own. */
export const SETUP_STEP = "unternehmen";

/**
 * Whether an account that has not ordered may walk this step: setting up the company, and each
 * walk's steps up to its `lastFreeStep`, in walk order.
 */
export const isFreeStep = (code: string): boolean => {
  if (code === SETUP_STEP) return true;
  const walk = walkOfCode(code);
  if (!walk) return false;
  const { lastFreeStep } = walk;
  const at = walk.items.findIndex((item) => item.code === code);
  return at <= walk.items.findIndex((item) => item.code === lastFreeStep);
};
