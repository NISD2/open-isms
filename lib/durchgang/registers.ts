import type { CountableModule } from "@/lib/compliance/module-tables";

/**
 * A register the requirement page shows for the item (its `moduleRef`), which a screen shows as
 * the list itself. The asset register has its own screen kind, because it is offered in slices.
 */
const REGISTER_MODULES = [
  "supplier",
  "training_record",
  "management_review",
] as const satisfies readonly CountableModule[];
export type RegisterModule = (typeof REGISTER_MODULES)[number];

/**
 * Whose trainings a training screen lists and adds: management's, which § 38 Abs. 3 BSIG asks
 * for, or the rest of the staff's, which § 30 Abs. 2 Nr. 7 asks for. One register holds both.
 */
export type TrainingAudience = "management" | "staff";

/**
 * How a training line of each audience is filed: management's as the § 38 Abs. 3 training, the
 * staff's as awareness training. The walk's screen and an assistant's rows (lib/mcp) both use it.
 */
export const TRAINING_ROW = {
  management: { trainingType: "management", isManagement: true },
  staff: { trainingType: "awareness", isManagement: false },
} as const satisfies Record<
  TrainingAudience,
  { readonly trainingType: string; readonly isManagement: boolean }
>;

/** Whether a training register row belongs to the audience a screen lists. */
export const inAudience = (
  row: { readonly isManagement: boolean | null },
  audience: TrainingAudience,
): boolean => Boolean(row.isManagement) === TRAINING_ROW[audience].isManagement;
