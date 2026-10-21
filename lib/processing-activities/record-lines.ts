import {
  type DpoRecord,
  isYesNoFact,
  legalBasesIn,
  type ThroughSupplier,
} from "@/lib/durchgang";
import { processingActivityCreateSchema } from "@/schema/processing-activity-validators";

/**
 * The record of processing activities as words and lines, written once for the register page and
 * for the export file, which run in the browser and on the server. Both pass their own translator,
 * so the two files can never say different things.
 */

/** A translator as next-intl gives it, on the client and on the server. */
export type Say = (key: string, values?: Record<string, string | number>) => string;

export interface RecordWords {
  /** The `processingActivities` messages. */
  readonly say: Say;
  /** A day as the reader's language writes it. */
  readonly day: (date: Date | string) => string;
}

/** What the record states beside its activities (`controllerOf`), as far as the words need it. */
export interface RecordController {
  readonly name: string | null;
  readonly address: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly dpo: DpoRecord;
  readonly measures: {
    readonly title: string;
    readonly approvedAt: Date | string | null;
  } | null;
}

/** The record's columns, in the table's order: what a company writes of each activity. */
const COLUMNS = Object.keys(processingActivityCreateSchema.shape);

const textOf = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

/**
 * How the record words an activity's transfers through one supplier (Art. 30(1)(e)): the same
 * line on the walk's screen, the record page and its download.
 */
export function throughLine(
  say: Say,
  basis: Say,
  name: string,
  through: ThroughSupplier,
): string {
  switch (through.kind) {
    case "outside":
      return say("through.outside", {
        name,
        countries: through.countries || say("through.noCountries"),
        // The supplier list words "none" as "No transfer", which is not what it means here.
        basis:
          through.mechanism && through.mechanism !== "none"
            ? basis(through.mechanism)
            : say("through.noBasis"),
      });
    case "inside":
      return say("through.inside", { name });
    case "open":
      return say("through.open", { name });
    default:
      return through satisfies never;
  }
}

/** The controller, the officer and the security measures as one line each (Art. 30(1)(a), (g)). */
export function recordFacts({ say, day }: RecordWords, controller: RecordController) {
  const { dpo } = controller;
  return {
    controllerLine: [
      controller.name,
      controller.address,
      controller.email,
      controller.phone,
    ]
      .filter(Boolean)
      .join(", "),
    dpoLine:
      dpo.kind === "none"
        ? say("record.dpoNone")
        : dpo.kind === "designated"
          ? [dpo.name, dpo.contact].filter(Boolean).join(", ") || say("record.dpoUnnamed")
          : say("record.dpoOpen"),
    measuresLine: !controller.measures
      ? say("record.measuresNone")
      : controller.measures.approvedAt
        ? say("record.measuresApproved", {
            title: controller.measures.title,
            date: day(controller.measures.approvedAt),
          })
        : say("record.measuresDraft", { title: controller.measures.title }),
  };
}

/**
 * The record as a table's lines, for the supervisory authority (Art. 30(4)): who the controller
 * is, the officer, the measures and the day, then one line per activity with the suppliers that
 * receive its data.
 */
export function recordLines(
  words: RecordWords,
  controller: RecordController,
  items: readonly Record<string, unknown>[],
  suppliersOf: (id: unknown) => readonly string[],
): (string | null)[][] {
  const { say, day } = words;
  const { controllerLine, dpoLine, measuresLine } = recordFacts(words, controller);
  const yesNo = (value: unknown) =>
    value === true ? say("record.yes") : value === false ? say("record.no") : null;
  const cell = (column: string, value: unknown) =>
    column === "legalBases"
      ? legalBasesIn(value)
          .map((b) => say(`bases.${b}`))
          .join("; ") || null
      : isYesNoFact(column)
        ? yesNo(value)
        : textOf(value);
  return [
    [say("record.title")],
    [say("record.controller"), controllerLine || null],
    [say("record.dpo"), dpoLine],
    [say("record.measures"), measuresLine],
    [say("record.asOf"), day(new Date())],
    [],
    [...COLUMNS.map((c) => say(`fields.${c}`)), say("fields.suppliers")],
    ...items.map((item) => [
      ...COLUMNS.map((c) => cell(c, item[c])),
      suppliersOf(item.id).join("; ") || null,
    ]),
  ];
}
