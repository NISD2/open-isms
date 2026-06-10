// Single source of truth for the gap-assessment data lives in the
// @nisd2/nis2-gap-assessment-schema OSS package. This file re-exports it so
// in-repo consumers keep their lib/gap-assessment/ import paths.
//
// Bumping the OSS package version is the only way to change the data —
// `bun update @nisd2/nis2-gap-assessment-schema` then verify the lock pins the
// new commit.

import { gapAssessment } from "@nisd2/nis2-gap-assessment-schema";
import type { GapAssessmentData } from "@nisd2/nis2-gap-assessment-schema";

export function getGapAssessmentData(): GapAssessmentData {
  return gapAssessment;
}

export {
  gapDomainSchema,
  gapQuestionSchema,
  gapAssessmentDataSchema,
  answerMapSchema,
  CRITICALITY,
  RESPONDENT,
  CONSEQUENCE,
  TIME_TO_FIX,
  ANSWER,
  MATURITY_LEVELS,
} from "./schema";

export type {
  GapDomain,
  GapQuestion,
  GapAssessmentData,
  AnswerMap,
  DomainScore,
  GapItem,
  AssessmentScores,
} from "./schema";
