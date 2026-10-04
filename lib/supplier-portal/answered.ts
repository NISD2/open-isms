/** Whether a questionnaire value is an answer: a blank string is not; `false` and `0` are. */
export function isAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}
