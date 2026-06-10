// Single source of truth for the gap-assessment schema lives in the
// @nisd2/nis2-gap-assessment-schema OSS package. This file re-exports it so
// in-repo consumers keep their lib/gap-assessment/ import paths.

export {
  CRITICALITY,
  RESPONDENT,
  CONSEQUENCE,
  TIME_TO_FIX,
  ANSWER,
  MATURITY_LEVELS,
  gapDomainSchema,
  gapQuestionSchema,
  gapAssessmentDataSchema,
  answerMapSchema,
} from "@nisd2/nis2-gap-assessment-schema";

export type {
  GapDomain,
  GapQuestion,
  GapAssessmentData,
  AnswerMap,
  DomainScore,
  GapItem,
  AssessmentScores,
  MaturityKey,
  CriticalityValue,
  RespondentValue,
  ConsequenceValue,
  TimeToFixValue,
  AnswerValue,
} from "@nisd2/nis2-gap-assessment-schema";
