import type { ItemState, RegisterModule, ResolvedScreen } from "@/lib/durchgang";
import type { FieldMeta } from "@/lib/forms/schema-introspect";
import type { RouterOutputs } from "@/lib/trpc/client";

interface RegisterRows {
  supplier: RouterOutputs["supplier"]["list"];
  team: RouterOutputs["team"]["listMembers"];
  training_record: RouterOutputs["training"]["list"];
  management_review: RouterOutputs["managementReview"]["list"];
}

/** The registers an item's screens show, as their own routers return them. */
export type Registers = Readonly<{ [M in RegisterModule]: RegisterRows[M] }>;

/** Where a company registers, for the registration screen. */
export type Registration = RouterOutputs["durchgang"]["portals"];

export interface Citation {
  readonly label: string;
  readonly citation: string;
  readonly href: string | null;
  /** Scope the reader needs beside the citation, e.g. that the CIR binds only some entities. */
  readonly note: string | null;
}

export interface Term {
  readonly term: string;
  readonly definition: string;
  readonly source: string | null;
}

/** One item of the walk, as the home screen and the "Als Nächstes" card show it. */
export interface WalkEntry {
  readonly code: string;
  readonly section: string;
  readonly headline: string;
  readonly teaser: string;
  readonly image: string | null;
  readonly state: ItemState;
}

/** Everything one item's screens need, resolved on the server. */
export interface ItemView {
  readonly code: string;
  readonly section: string;
  readonly title: string;
  readonly image: string | null;
  readonly missed: readonly string[];
  readonly terms: readonly Term[];
  readonly citations: readonly Citation[];
  /** The requirement's own legal reference, shown without a link (spec §0.7, correction 3). */
  readonly duty: string;
  readonly screens: readonly ResolvedScreen[];
  readonly statusId: string | null;
  readonly assessmentId: string | null;
  readonly categoryId: string;
  /** What the company already saved for this requirement. No platform defaults. */
  readonly answers: Readonly<Record<string, unknown>>;
  readonly fields: Readonly<Record<string, FieldMeta>>;
  /** Only the registers the item has a screen for are loaded. */
  readonly registers: Partial<Registers>;
  /**
   * The company's asset register as it stood when the item opened, for an item with asset
   * screens, else null. The catalogue only seeds an empty register: with rows in it, the asset
   * screens become the register itself, so nothing is matched back to the catalogue by name.
   */
  readonly assets: RouterOutputs["asset"]["list"] | null;
  /** When the company took over the BSI method in the walk; a second pass then writes nothing. */
  readonly adoptedAt: Date | null;
  /** Loaded only for an item with the registration portals screen. */
  readonly registration: Registration | null;
  readonly locale: "de" | "en";
}
