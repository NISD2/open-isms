import type {
  ItemState,
  RegisterModule,
  ResolvedScreen,
  WalkLocale,
} from "@/lib/durchgang";
import type { FieldMeta } from "@/lib/forms/schema-introspect";
import type { RouterOutputs } from "@/lib/trpc/client";

interface RegisterRows {
  supplier: RouterOutputs["supplier"]["list"];
  training_record: RouterOutputs["training"]["list"];
  management_review: RouterOutputs["managementReview"]["list"];
}

/** The registers an item's screens show, as their own routers return them. */
export type Registers = Readonly<{ [M in RegisterModule]: RegisterRows[M] }>;

/** The company's members, for a field that names a person. */
export type Team = RouterOutputs["team"]["listMembers"];

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

/** A piece of glossed text: plain, or a term with what it means. */
export type Gloss =
  | { readonly text: string }
  | { readonly term: string; readonly definition: string };

/** Everything one item's screens need, resolved on the server. */
export interface ItemView {
  readonly code: string;
  readonly section: string;
  readonly title: string;
  readonly image: string | null;
  readonly missed: readonly string[];
  readonly terms: readonly Term[];
  readonly citations: readonly Citation[];
  /** The requirement's own legal reference, as the duty card prints it. */
  readonly duty: string;
  /**
   * The provision the duty card's sentence rests on, which the whole card opens. Never the
   * category link, which can open a different paragraph (spec §0.7, correction 3).
   */
  readonly dutyHref: string;
  /**
   * The item's texts that explain a term in place, keyed by the text itself: learn paragraphs,
   * leads and the "often missed" lines. Matched on the server, so the dictionary stays there.
   */
  readonly gloss: Readonly<Record<string, readonly Gloss[]>>;
  readonly screens: readonly ResolvedScreen[];
  readonly statusId: string | null;
  readonly assessmentId: string | null;
  readonly categoryId: string;
  /** The requirement page's category, where the full editors and registers live. */
  readonly categorySlug: string;
  /** What the company already saved for this requirement. No platform defaults. */
  readonly answers: Readonly<Record<string, unknown>>;
  readonly fields: Readonly<Record<string, FieldMeta>>;
  /** Only the registers the item has a screen for are loaded. */
  readonly registers: Partial<Registers>;
  /** Loaded only for an item with a field that names a person. */
  readonly team: Team;
  /**
   * The company's asset register as it stood when the item opened, for an item with asset
   * screens, else null: the catalogue items already on it, which the checklists show ticked, and
   * the entries that are no catalogue item. A returning company gets the same short checklists
   * as a new one, never the full register.
   */
  readonly register: {
    readonly listed: readonly string[];
    readonly others: readonly string[];
  } | null;
  /** When the company took over the BSI method in the walk; a second pass then writes nothing. */
  readonly adoptedAt: Date | null;
  /** Loaded only for an item with a registration portals or reporting channels screen. */
  readonly registration: Registration | null;
  /**
   * Who is walking: the default for a person the item names, and whether they may approve the
   * walk's documents as management or invite someone who does.
   */
  readonly viewer: {
    readonly id: string;
    readonly management: boolean;
    readonly admin: boolean;
  };
  readonly locale: WalkLocale;
}
