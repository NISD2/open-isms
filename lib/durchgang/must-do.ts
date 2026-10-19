import { NIS2_SCRIPT } from "./nis2";

/** Items the law leaves no choice on (`mustDo`). */
const MUST_DO: ReadonlySet<string> = new Set(
  NIS2_SCRIPT.flatMap((item) => (item.mustDo ? [item.code] : [])),
);

/**
 * Whether the law leaves no choice on this requirement, so nobody may set it aside: not in the
 * walk (`durchgang.decline`), not on the requirement page (`assessment.updateRequirementStatus`).
 * Its own module so the requirement page reads it without the walk's state machine.
 */
export const leavesNoChoice = (code: string): boolean => MUST_DO.has(code);
