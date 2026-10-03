/**
 * What the company's own answers in the walk still leave open, for management to see before it
 * signs (§ 38 Abs. 1 BSIG: management implements and oversees; Art. 21(4) NIS 2: corrective
 * measures without undue delay). Pure: the server reads the facts, this decides the gaps.
 *
 * Every gap is a fact the company recorded, never a guess, and each names the step where it is
 * changed.
 */

/** The records the gaps are read from. */
export interface GapFacts {
  /** 11.1: every program people sign in to, and whether a second factor is on. */
  readonly signIns: ReadonlyArray<{ readonly name: string; readonly hasMfa: boolean }>;
  /** 2.3 and 5.2: each supplier's rated risk and what its contract settles. */
  readonly suppliers: ReadonlyArray<{
    readonly name: string;
    readonly riskLevel: string | null;
    readonly security: boolean;
    readonly incidents: boolean;
  }>;
  /** 4.4: each backup system and the day of its last restore that worked. */
  readonly backups: ReadonlyArray<{
    readonly name: string;
    readonly lastRestore: string | null;
  }>;
  /** 3.3: whether the company can sign in to the BSI's portal and report; null unanswered. */
  readonly reporting: boolean | null;
  /** How many people hold the management role in the app. */
  readonly managers: number;
  /** 1.1: the management trainings on record. */
  readonly managementTrainings: ReadonlyArray<{
    readonly name: string;
    readonly completedAt: Date | null;
  }>;
  /** Steps set aside with "Geht noch nicht". */
  readonly setAside: readonly string[];
  readonly today: Date;
}

export type Gap =
  /** Programs with a sign-in and no second factor; `all` when none has one. */
  | {
      readonly kind: "second_factor";
      readonly names: readonly string[];
      readonly all: boolean;
    }
  /** Suppliers rated high or critical whose contract settles neither security nor incidents. */
  | { readonly kind: "supplier"; readonly names: readonly string[] }
  /** Backup systems without a restore that worked. */
  | { readonly kind: "restore"; readonly names: readonly string[] }
  /** The company cannot report to the BSI yet. */
  | { readonly kind: "reporting" }
  /**
   * Management training: who was trained in the last three years, against how many hold the
   * role. BT-Drs. 21/1501 p. 154 reads „regelmäßig“ in § 38 Abs. 3 BSIG as at least every three
   * years.
   */
  | {
      readonly kind: "training";
      readonly trained: readonly string[];
      readonly managers: number;
    }
  /** Steps set aside, which this approval does not sign. */
  | { readonly kind: "set_aside"; readonly codes: readonly string[] };

/** The step where each gap is changed. */
export const GAP_STEP: Readonly<Record<Exclude<Gap["kind"], "set_aside">, string>> = {
  second_factor: "11.1",
  supplier: "5.2",
  restore: "4.4",
  reporting: "3.3",
  training: "1.1",
};

const HIGH_RISK: ReadonlySet<string> = new Set(["high", "critical"]);

/** The same calendar day three years earlier, in UTC. */
const threeYearsBefore = (day: Date): Date =>
  new Date(Date.UTC(day.getUTCFullYear() - 3, day.getUTCMonth(), day.getUTCDate()));

export function gapsOf(facts: GapFacts): readonly Gap[] {
  const unprotected = facts.signIns.filter((s) => !s.hasMfa).map((s) => s.name);
  const unregulated = facts.suppliers
    .filter((s) => HIGH_RISK.has(s.riskLevel ?? "") && !s.security && !s.incidents)
    .map((s) => s.name);
  const untested = facts.backups.filter((b) => b.lastRestore === null).map((b) => b.name);
  const since = threeYearsBefore(facts.today);
  const trained = [
    ...new Set(
      facts.managementTrainings
        .filter((t) => t.completedAt !== null && t.completedAt >= since)
        .map((t) => t.name),
    ),
  ];
  return [
    ...(unprotected.length > 0
      ? [
          {
            kind: "second_factor" as const,
            names: unprotected,
            all: unprotected.length === facts.signIns.length,
          },
        ]
      : []),
    ...(unregulated.length > 0
      ? [{ kind: "supplier" as const, names: unregulated }]
      : []),
    ...(untested.length > 0 ? [{ kind: "restore" as const, names: untested }] : []),
    ...(facts.reporting === false ? [{ kind: "reporting" as const }] : []),
    ...(trained.length === 0 || trained.length < facts.managers
      ? [{ kind: "training" as const, trained, managers: facts.managers }]
      : []),
    ...(facts.setAside.length > 0
      ? [{ kind: "set_aside" as const, codes: facts.setAside }]
      : []),
  ];
}

/** A gap as the approval and the export show it: a step set aside also carries its headline. */
export type ShownGap =
  | Exclude<Gap, { readonly kind: "set_aside" }>
  | (Extract<Gap, { readonly kind: "set_aside" }> & {
      readonly headlines: readonly string[];
    });

type GapKey =
  | "secondFactorAll"
  | "secondFactor"
  | "supplier"
  | "restore"
  | "reporting"
  | "trainingNone"
  | "training"
  | "setAside";

/**
 * The open points as sentences, each with the step where it changes, in the wording of
 * `durchgang.ui.approve.gaps`, which `t` reads. The approval screen and the export print these.
 */
export function gapLines(
  gaps: readonly ShownGap[],
  t: (key: GapKey, values?: Readonly<Record<string, string | number>>) => string,
): { readonly text: string; readonly code: string }[] {
  return gaps.flatMap((gap) => {
    switch (gap.kind) {
      case "second_factor":
        return [
          {
            text: gap.all
              ? t("secondFactorAll")
              : t("secondFactor", { names: gap.names.join(", ") }),
            code: GAP_STEP.second_factor,
          },
        ];
      case "supplier":
        return [
          {
            text: t("supplier", { names: gap.names.join(", ") }),
            code: GAP_STEP.supplier,
          },
        ];
      case "restore":
        return [
          { text: t("restore", { names: gap.names.join(", ") }), code: GAP_STEP.restore },
        ];
      case "reporting":
        return [{ text: t("reporting"), code: GAP_STEP.reporting }];
      case "training":
        return [
          {
            text:
              gap.trained.length === 0
                ? t("trainingNone")
                : t("training", {
                    names: gap.trained.join(", "),
                    managers: gap.managers,
                  }),
            code: GAP_STEP.training,
          },
        ];
      case "set_aside":
        return gap.codes.map((code, i) => ({
          text: t("setAside", { headline: gap.headlines[i] ?? code }),
          code,
        }));
      default:
        return gap satisfies never;
    }
  });
}
