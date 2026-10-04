import {
  type Condition,
  conditionsHold,
} from "@nisd2/nis2-supply-chain-questionnaire-schema/schema";

/** Whether a questionnaire value is an answer: a blank string is not; `false` and `0` are. */
export function isAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/**
 * Whether a customer reading a supplier's answers sees this question: when it applies, and also
 * when the supplier answered it while one of the questions it depends on is still open. A
 * supplier who answered before those questions existed keeps showing what it said; a question is
 * left out only once every question it depends on is answered and none lets it apply.
 */
export function shownToReader(
  question: { readonly id: string; readonly conditions: readonly Condition[] },
  answers: Readonly<Record<string, unknown>>,
): boolean {
  if (conditionsHold(question.conditions, answers)) return true;
  return (
    isAnswered(answers[question.id]) &&
    question.conditions.some((condition) => !isAnswered(answers[condition.field]))
  );
}
