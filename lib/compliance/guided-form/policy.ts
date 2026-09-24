/**
 * The policy of the guided form. Pure: no database, no React, no IO.
 *
 * This is all that survives of the proportionality engine that was designed and then retired on
 * 24.09.2026. Measured over every company shape it could distinguish, the perfect set of interview
 * answers moved four decisions out of about 144. The work is reduced per step, by having or not
 * having the object, so an engine that sizes everything up front had nothing to do.
 *
 * What is left answers four questions and nothing else:
 *
 *   applies           does this item address this company, given three status facts
 *   bindingReference  which rulebook governs the § 30 Abs. 2 areas for them
 *   allowedOutcomes   which decisions a control may take, from its BSI grade
 *   itemState         unmapped, blocked, open or settled
 *
 * Every branch is a rule in RULES, carrying its statutory anchor and an honest label: some follow
 * from the statute, the rest are product rules the statute permits and does not contradict. The
 * test resolves every anchor against the vendored text of the BSIG rather than against a comment.
 *
 * Nothing here decides for the company. It says which decisions are open to them.
 */

// ---------------------------------------------------------------------------
// Vocabulary. English in code; the BSI's German labels belong in the interface.
// ---------------------------------------------------------------------------

/** BSI grade. required = Basis (MUSS), expected = Standard (SOLLTE), optional = erhöhter Schutzbedarf (KANN). */
export type ControlGrade = "required" | "expected" | "optional";

/**
 * What a company may record against one control.
 *
 * The two dispensable outcomes follow the BSI's own Grundschutz-Check, which lets a requirement be
 * "entbehrlich" either because nothing it applies to exists or because an equivalent measure covers
 * it. Leaving the second out would force a company that meets a requirement differently to either
 * overclaim "done" or leave the item open for ever.
 */
export type ControlOutcome =
  | "done"
  | "no_object"
  | "covered_otherwise"
  | "justified"
  | "deferred";

/** A fact that may be unknown. Unknown asserts nothing, in either direction. */
export type Settled = "yes" | "no" | "unsettled";

/** Who a provision addresses, read off the statute's own wording. */
export type Addressee =
  | "all"
  | "critical_installation"
  | "service_type_60_1"
  | "sector_35_2";

export type FactorId =
  | "risk_exposure"
  | "size"
  | "implementation_cost"
  | "likelihood_and_severity"
  | "societal_and_economic_impact";

/** The five factors of § 30 Abs. 1 Satz 2 BSIG, with the statute's own words. */
export const FACTORS: readonly { readonly id: FactorId; readonly statutory: string }[] = [
  { id: "risk_exposure", statutory: "das Ausmaß der Risikoexposition" },
  { id: "size", statutory: "die Größe der Einrichtung" },
  { id: "implementation_cost", statutory: "die Umsetzungskosten" },
  {
    id: "likelihood_and_severity",
    statutory: "die Eintrittswahrscheinlichkeit und Schwere von Sicherheitsvorfällen",
  },
  {
    id: "societal_and_economic_impact",
    statutory: "ihre gesellschaftlichen und wirtschaftlichen Auswirkungen",
  },
];

export type Justification = Readonly<Partial<Record<FactorId, string>>>;

// ---------------------------------------------------------------------------
// The twelve singled-out service types, and the two statutory lists they sit on
// ---------------------------------------------------------------------------

export interface ServiceType {
  readonly id: string;
  /** The statute's wording in § 30 Abs. 3, or null where that list omits it. Checked by test. */
  readonly phrase30Abs3: string | null;
  /** The statute's wording in § 60 Abs. 1 Satz 1, or null where that list omits it. Checked by test. */
  readonly phrase60Abs1: string | null;
}

export const SERVICE_TYPES = [
  { id: "dns", phrase30Abs3: "DNS-Diensteanbieter", phrase60Abs1: "DNS-Diensteanbieter" },
  {
    id: "tld_registry",
    phrase30Abs3: "Top Level Domain Name Registries",
    phrase60Abs1: "Top Level Domain Name Registries",
  },
  {
    id: "registry_service_provider",
    phrase30Abs3: null,
    phrase60Abs1: "Domain-Name-Registry-Dienstleister",
  },
  {
    id: "cloud",
    phrase30Abs3: "Cloud-Computing-Dienstleister",
    phrase60Abs1: "Anbieter von Cloud-Computing-Diensten",
  },
  {
    id: "data_centre",
    phrase30Abs3: "Anbieter von Rechenzentrumsdiensten",
    phrase60Abs1: "Anbieter von Rechenzentrumsdiensten",
  },
  {
    id: "cdn",
    phrase30Abs3: "Betreiber von Content Delivery Networks",
    phrase60Abs1: "Betreiber von Content Delivery Networks",
  },
  {
    id: "managed_service",
    phrase30Abs3: "Managed Service Provider",
    phrase60Abs1: "Managed Service Provider",
  },
  {
    id: "managed_security_service",
    phrase30Abs3: "Managed Security Service Provider",
    phrase60Abs1: "Managed Security Service Provider",
  },
  {
    id: "marketplace",
    phrase30Abs3: "Anbieter von Online-Marktplätzen",
    phrase60Abs1: "Anbieter von Online-Marktplätzen",
  },
  {
    id: "search_engine",
    phrase30Abs3: "Online-Suchmaschinen",
    phrase60Abs1: "Online-Suchmaschinen",
  },
  {
    id: "social_network",
    phrase30Abs3: "Plattformen für Dienste sozialer Netzwerke",
    phrase60Abs1: "Plattformen für Dienste sozialer Netzwerke",
  },
  { id: "trust_service", phrase30Abs3: "Vertrauensdiensteanbieter", phrase60Abs1: null },
] as const satisfies readonly ServiceType[];

export type ServiceTypeId = (typeof SERVICE_TYPES)[number]["id"];

/**
 * The three status facts. Derived once from the organisation, read on every step.
 *
 * `serviceTypes` counts only where the company is in scope AS that provider. Using a managed
 * service provider is not being one, and the existing applicability classifier settles that.
 */
export interface StatusFacts {
  readonly criticalInstallation: Settled;
  readonly serviceTypes: readonly ServiceTypeId[] | "unsettled";
  readonly sector35_2: Settled;
}

const onList = (f: StatusFacts, pick: (s: ServiceType) => boolean): Settled =>
  f.serviceTypes === "unsettled"
    ? "unsettled"
    : SERVICE_TYPES.some(
          (s) => pick(s) && (f.serviceTypes as readonly string[]).includes(s.id),
        )
      ? "yes"
      : "no";

// ---------------------------------------------------------------------------
// The four functions
// ---------------------------------------------------------------------------

/** Whether an item addresses this company. An unsettled fact stays unsettled. */
export const applies = (addressee: Addressee, f: StatusFacts): Settled => {
  switch (addressee) {
    case "all":
      return "yes";
    case "critical_installation":
      return f.criticalInstallation;
    case "service_type_60_1":
      return onList(f, (s) => s.phrase60Abs1 !== null);
    case "sector_35_2":
      return f.sector35_2;
  }
};

/**
 * Which rulebook governs the § 30 Abs. 2 areas. For the service types § 30 Abs. 3 lists, the EU
 * implementing act "hat Vorrang" over Abs. 2, so their areas are not sized by Baustein grades.
 */
export const bindingReference = (
  f: StatusFacts,
): "bsi_baustein" | "eu_implementing_act" | "unsettled" => {
  const on303 = onList(f, (s) => s.phrase30Abs3 !== null);
  return on303 === "yes"
    ? "eu_implementing_act"
    : on303 === "unsettled"
      ? "unsettled"
      : "bsi_baustein";
};

/**
 * The decisions a control may take. `canHaveNoObject` is true only where the item names a register
 * that can be counted. An optional control takes no decision at all: it is shown, never recorded,
 * never signed, which is 24 fewer rows per company and one fewer thing to explain.
 */
export const allowedOutcomes = (
  grade: ControlGrade,
  canHaveNoObject: boolean,
): readonly ControlOutcome[] => {
  switch (grade) {
    case "required":
      return canHaveNoObject
        ? ["done", "no_object", "covered_otherwise", "deferred"]
        : ["done", "covered_otherwise", "deferred"];
    case "expected":
      return canHaveNoObject
        ? ["done", "no_object", "covered_otherwise", "justified", "deferred"]
        : ["done", "covered_otherwise", "justified", "deferred"];
    case "optional":
      return [];
  }
};

/** A justification carries all five factors, in the company's own words. */
export const justificationComplete = (j: Justification): boolean =>
  FACTORS.every((f) => (j[f.id]?.trim().length ?? 0) > 0);

/** A no-object decision is stale once the register it cited is no longer empty. */
export const noObjectStale = (evidenceCount: number, countNow: number): boolean =>
  countNow !== evidenceCount;

export interface ControlState {
  readonly grade: ControlGrade;
  readonly current: ControlOutcome | null;
  readonly stale: boolean;
}

/**
 * unmapped  no controls are mapped to the item, so it cannot be signed and says so. A hole in the
 *           crosswalk must never look like a finished item.
 * blocked   every remaining control is deferred. The step is waiting on something external and the
 *           flow moves past it; the next session returns here.
 * open      there is work left that is not waiting.
 * settled   every required and expected control has a current, non-deferred, non-stale decision.
 */
export type ItemState = "unmapped" | "blocked" | "open" | "settled";

export const itemState = (controls: readonly ControlState[]): ItemState => {
  if (controls.length === 0) return "unmapped";
  const decidable = controls.filter((c) => c.grade !== "optional");
  if (decidable.length === 0) return "settled";
  const unfinished = decidable.filter(
    (c) => c.current === null || c.current === "deferred" || c.stale,
  );
  if (unfinished.length === 0) return "settled";
  return unfinished.every((c) => c.current === "deferred") ? "blocked" : "open";
};

/**
 * Where the next session resumes: the earliest step that is open, and failing that the earliest
 * that is blocked, so nothing is lost by moving past a wait. Null when everything is settled.
 *
 * This is the rule that keeps an externally-blocked step, such as a BSI registration that comes
 * back by post, from stopping the whole Durchgang on day one.
 */
export const resumeAt = <T>(
  items: readonly T[],
  stateOf: (item: T) => ItemState,
): T | null =>
  items.find((i) => stateOf(i) === "open") ??
  items.find((i) => stateOf(i) === "blocked") ??
  null;

// ---------------------------------------------------------------------------
// The rules, each with its anchor and an honest label
// ---------------------------------------------------------------------------

export interface Rule {
  readonly id: string;
  readonly rule: string;
  /** "statute": follows from the anchor. "product": the statute permits it and does not contradict it. */
  readonly basis: "statute" | "product";
  /** Paragraph keys as the vendored statute names them, e.g. "§ 31". */
  readonly paragraphs: readonly string[];
  /** Phrases that must appear verbatim in one of those paragraphs. */
  readonly phrases: readonly string[];
}

export const RULES: readonly Rule[] = [
  {
    id: "status_fact",
    basis: "statute",
    rule: "an item addressed to critical installations, § 60 service types or § 35 sectors applies only where the status fact says so",
    paragraphs: ["§ 31", "§ 39", "§ 34", "§ 60", "§ 35"],
    phrases: [
      "Betreiber kritischer Anlagen sind verpflichtet",
      "in § 60 Absatz 1 Satz 1 genannten Einrichtungsart",
      "aus den Sektoren Finanzwesen",
    ],
  },
  {
    id: "unsettled_asserts_nothing",
    basis: "statute",
    rule: "an unsettled status fact asserts nothing and cannot be signed; the status arises by operation of law, not by notice",
    paragraphs: ["§ 28", "§ 33"],
    phrases: ["Als besonders wichtige Einrichtung gelten", "Pflicht zur Registrierung nicht erfüllt"],
  },
  {
    id: "required_choices",
    basis: "product",
    rule: "a required control is done, has no object, or is covered another way; it is not argued down on proportionality alone, although the statute would allow that argument",
    paragraphs: ["§ 30"],
    phrases: ["müssen zumindest Folgendes umfassen"],
  },
  {
    id: "no_object_evidence",
    basis: "statute",
    rule: "no object needs a server-counted zero from the item's register, stored with the decision",
    paragraphs: ["§ 30"],
    phrases: ["ist durch die Einrichtungen zu dokumentieren"],
  },
  {
    id: "five_factors",
    basis: "statute",
    rule: "justified needs all five factors and a reason, on an expected control only",
    paragraphs: ["§ 30"],
    phrases: FACTORS.map((f) => f.statutory),
  },
  {
    id: "optional_never_blocks",
    basis: "product",
    rule: "an optional control is shown, never recorded, never signed",
    paragraphs: ["§ 30"],
    phrases: ["verhältnismäßige"],
  },
  {
    id: "signature",
    basis: "product",
    rule: "an item is signable only when every required and expected control is settled; management-bound items need a management signer",
    paragraphs: ["§ 38", "§ 30"],
    phrases: [
      "Geschäftsleitungen besonders wichtiger Einrichtungen und wichtiger Einrichtungen sind verpflichtet",
    ],
  },
  {
    id: "stale_on_read",
    basis: "product",
    rule: "a no-object decision whose register is no longer empty is stale on read and blocks the signature",
    paragraphs: ["§ 30"],
    phrases: ["Die Einhaltung der Verpflichtung nach Satz 1"],
  },
  {
    id: "eu_act_precedence",
    basis: "statute",
    rule: "for a company in scope as one of the § 30 Abs. 3 service types the EU implementing act is the binding reference for the areas",
    paragraphs: ["§ 30"],
    phrases: ["hat für die vorgenannten Einrichtungsarten Vorrang"],
  },
  {
    id: "deferral_never_blocks_the_flow",
    basis: "product",
    rule: "a step waiting on something external is left waiting, the flow continues, and the next session resumes at the earliest step still waiting",
    paragraphs: ["§ 30"],
    phrases: ["ist durch die Einrichtungen zu dokumentieren"],
  },
  {
    id: "unmapped_is_not_done",
    basis: "product",
    rule: "an item with no mapped controls cannot be signed",
    paragraphs: ["§ 30"],
    phrases: ["müssen zumindest Folgendes umfassen"],
  },
];
