import { ALL_ITEMS } from "./walks";

/** Items the law leaves no choice on (`mustDo`), in every walk. */
const MUST_DO: ReadonlySet<string> = new Set(
  ALL_ITEMS.flatMap((item) => (item.mustDo ? [item.code] : [])),
);

/**
 * Whether the law leaves no choice on this requirement, so nobody may set it aside: not in the
 * walk (`durchgang.decline`), not on the requirement page (`assessment.updateRequirementStatus`).
 * Its own module so the requirement page reads it without the walk's state machine.
 */
export const leavesNoChoice = (code: string): boolean => MUST_DO.has(code);
