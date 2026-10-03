/**
 * How the journey shows the requirements the walk leaves out. Pure.
 *
 * Each of them says in `COVERED_BY` where the part every entity owes is met, or that no statute
 * asks it of every entity. What the walk leaves out of them is CIR 2024/2690 detail, and the CIR
 * binds the digital providers § 30 Abs. 3 BSIG lists, so for those companies every requirement
 * stays its own.
 */

import { type DotState, journeyState } from "@/lib/compliance/journey-position";
import type { SECTORS } from "@/lib/organization/constants";
import { COVERED_BY } from "./nis2";
import { type DurchgangEvent, itemState, type StatusRow } from "./state";

/**
 * The sectors the § 30 Abs. 3 providers are in: DNS, TLD registries, cloud, data centres, CDNs
 * and trust services (digital infrastructure), managed and managed security services, online
 * marketplaces, search engines and social networks. A company records its sector, not its
 * service type, so an internet exchange in digital infrastructure keeps every requirement too,
 * which errs towards asking more.
 */
const CIR_SECTORS: readonly string[] = [
  "digital_infrastructure",
  "ict_service_management",
  "digital_providers",
] satisfies readonly (typeof SECTORS)[number][];

/** What decided a requirement's state, when it was not work on the requirement itself. */
export type CoveredBy =
  /** Met inside these walk items, which were filled in through the walk. */
  | { readonly kind: "walk"; readonly codes: readonly string[] }
  /** No statute asks it of this company. */
  | { readonly kind: "not_required" };

/** A walk item as a covered requirement reads it: its journey state, and whether it was filled in through the walk. */
export interface Covering {
  readonly state: DotState;
  readonly walked: boolean;
}

/**
 * A requirement's state on the journey once its coverage is counted.
 *
 * Work on the requirement itself wins: a sign-off, a rejection, a wait for sign-off of its own.
 * Otherwise a requirement met inside walk items follows them once every one was filled in
 * through the walk: signed off when all are, waiting for sign-off when all are at least that far.
 * A 6.3 signed on its own requirement page does not count, because that page writes none of the
 * clauses the walk's rules carry. A requirement no statute asks of the company is not applicable
 * to it until someone works on it.
 */
export function coveredState(
  code: string,
  own: DotState,
  company: { readonly sector: string; readonly walks: readonly string[] },
  covering: (code: string) => Covering,
): { readonly state: DotState; readonly coveredBy: CoveredBy | null } {
  const mine = { state: own, coveredBy: null };
  if (own !== "todo" && own !== "started") return mine;
  if (CIR_SECTORS.includes(company.sector) || company.walks.includes(code)) return mine;
  const codes = COVERED_BY[code];
  if (codes === undefined) return mine;
  if (codes === null) {
    return own === "todo" ? { state: "na", coveredBy: { kind: "not_required" } } : mine;
  }
  const items = codes.map(covering);
  if (!items.every((i) => i.walked)) return mine;
  const state: DotState | null = items.every((i) => i.state === "signed")
    ? "signed"
    : items.every((i) => i.state === "signed" || i.state === "awaiting")
      ? "awaiting"
      : null;
  return state ? { state, coveredBy: { kind: "walk", codes } } : mine;
}

/** A requirement's status row, as the journey reads it. */
export interface JourneyRow extends StatusRow {
  readonly code: string;
  readonly requirementId: string;
}

export interface JourneyEntry {
  readonly state: DotState;
  readonly coveredBy: CoveredBy | null;
}

/**
 * Where each requirement stands on the journey, by code: its own state from its status and the
 * walk's newest event for it, then what its coverage makes of that (`coveredState`). The journey
 * and every export read this one computation, so a requirement met inside the walk reads done in
 * all of them. `company` null leaves every requirement its own state.
 */
export function journeyStates(
  rows: readonly JourneyRow[],
  events: ReadonlyMap<string | null, DurchgangEvent>,
  company: { readonly sector: string; readonly walks: readonly string[] } | null,
): ReadonlyMap<string, JourneyEntry> {
  const own = new Map(
    rows.map((r): [string, Covering] => {
      const latest = events.get(r.requirementId) ?? null;
      return [
        r.code,
        {
          state: journeyState(r.status, itemState(r, latest)),
          walked: latest?.action === "durchgang.item_done",
        },
      ];
    }),
  );
  const covering = (code: string): Covering =>
    own.get(code) ?? { state: "todo", walked: false };
  return new Map(
    rows.map((r): [string, JourneyEntry] => {
      const mine = covering(r.code).state;
      return [
        r.code,
        company
          ? coveredState(r.code, mine, company, covering)
          : { state: mine, coveredBy: null },
      ];
    }),
  );
}
