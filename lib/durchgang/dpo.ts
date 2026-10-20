import { DPO_SCHEMA } from "@/lib/compliance/category-schemas/gdpr";

/**
 * The data protection officer as G-DPO.1 recorded it: not answered yet, none designated, or
 * designated (required or voluntarily), with the name and published contact where given. The one
 * reading of those answers, for the documents that name the DPO and for the record's header.
 */
export type DpoRecord =
  | { readonly kind: "open" }
  | { readonly kind: "none" }
  | {
      readonly kind: "designated";
      readonly name: string | null;
      readonly contact: string | null;
    };

const READ = DPO_SCHEMA.pick({
  dpoDecision: true,
  dpoName: true,
  dpoContact: true,
}).partial();

const filled = (value: string | undefined): string | null => value?.trim() || null;

/** G-DPO.1's answers as a DPO record; answers that do not parse read as not answered. */
export const dpoOf = (answers: Readonly<Record<string, unknown>>): DpoRecord => {
  const parsed = READ.safeParse(answers);
  if (!parsed.success) return { kind: "open" };
  const { dpoDecision, dpoName, dpoContact } = parsed.data;
  switch (dpoDecision) {
    case "none":
      return { kind: "none" };
    case "required":
    case "voluntary":
      return { kind: "designated", name: filled(dpoName), contact: filled(dpoContact) };
    default:
      return { kind: "open" };
  }
};
