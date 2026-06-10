// Single source of truth for the scoring logic lives in the
// @nisd2/nis2-gap-assessment-schema OSS package. This file re-exports it so
// in-repo consumers keep their lib/gap-assessment/ import paths.

export {
  computeDomainScores,
  computeGaps,
  computeScores,
} from "@nisd2/nis2-gap-assessment-schema";
