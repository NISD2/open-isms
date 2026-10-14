import "@/lib/server-guard";
import { z } from "zod";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { hasSignOffToWithdraw, type SignOffState } from "@/lib/compliance/sign-off-state";
import {
  type AnyItem,
  type AnyScreen,
  type ItemState,
  inAudience,
  type ScreenKind,
  TRAINING_ROW,
} from "@/lib/durchgang";
import {
  managementReviewCreateSchema,
  supplierCreateSchema,
  trainingCreateSchema,
} from "@/schema/validators";
import type { Caller } from "./context";

/**
 * The MCP tools read everything about an item off the walk itself (lib/durchgang): which screens
 * it has, which fields they ask, which register they show. What they write goes through the
 * procedures the screens call, validated by the same schemas. This file holds the one thing the
 * walk keeps in its components rather than in data: which procedure saves which kind of screen.
 */

/**
 * Who fills each kind of screen. "assistant": an AI assistant may, over MCP. "app": it takes
 * input only in the app (a choice, an upload, a custom editor, a signature). "none": it only
 * shows something. Every kind must be named, so a new kind cannot reach the walk undecided.
 */
export const FILLED_BY = {
  learn: "none",
  prepare: "none",
  compare: "none",
  sample: "none",
  reading: "none",
  provision: "none",
  fields: "assistant",
  evidence: "app",
  adopt: "app",
  register: "assistant",
  assets: "app",
  specify: "app",
  rate: "app",
  agreements: "app",
  logins: "app",
  policy: "app",
  approve: "app",
  riskmap: "none",
  critical: "app",
  backups: "app",
  crypto: "app",
  ongoing: "none",
  done: "none",
} as const satisfies Record<ScreenKind, "assistant" | "app" | "none">;

export const screensFilledBy = (item: AnyItem, by: "assistant" | "app"): ScreenKind[] => [
  ...new Set(item.screens.map((s) => s.kind).filter((kind) => FILLED_BY[kind] === by)),
];

/**
 * A Zod schema as JSON Schema for an assistant. A date is sent as text: the field schemas coerce
 * it and `textDates` makes the registers' timestamps do the same.
 */
export const jsonSchemaOf = (schema: z.ZodType) =>
  z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
    override: ({ zodSchema, jsonSchema }) => {
      if (zodSchema._zod.def.type === "date") {
        jsonSchema.type = "string";
        jsonSchema.format = "date";
      }
    },
  });

/** The intake fields an assistant may fill on an item: those its field screens ask. */
export const fieldKeysOf = (item: AnyItem): readonly string[] =>
  item.screens.flatMap((s) => (s.kind === "fields" ? s.fields : []));

/** Those fields' schema, each optional: the category's own, narrowed to the item's fields. */
export function fieldsSchemaOf(item: AnyItem): z.ZodObject | null {
  const keys = fieldKeysOf(item);
  const schema = CATEGORY_SCHEMAS[item.category];
  if (!schema || keys.length === 0) return null;
  return schema
    .pick(Object.fromEntries(keys.map((key) => [key, true as const])))
    .partial();
}

/** Why these answers cannot be saved for the item, or null: unknown keys, empty values, wrong types. */
export function answersProblem(
  item: AnyItem,
  answers: Readonly<Record<string, unknown>>,
): string | null {
  const keys = fieldKeysOf(item);
  const unknown = Object.keys(answers).filter((key) => !keys.includes(key));
  if (unknown.length > 0) {
    return `${item.code} asks no field ${unknown.join(", ")}. Its fields: ${keys.join(", ") || "none"}.`;
  }
  // The app reads an empty value as "clear this field", which would erase what the person wrote.
  const empty = Object.entries(answers)
    .filter(
      ([, value]) => value === null || (typeof value === "string" && value.trim() === ""),
    )
    .map(([key]) => key);
  if (empty.length > 0) {
    return `An answer cannot be empty (${empty.join(", ")}). Leave a field out to keep what is there.`;
  }
  const schema = fieldsSchemaOf(item);
  // The schema coerces, so it would pass "01.03.2026", and the text is saved as sent.
  const notIso = Object.entries(answers)
    .filter(
      ([key, value]) =>
        schema?.shape[key] !== undefined &&
        isDate(schema.shape[key]) &&
        !ISO_DAY.safeParse(value).success,
    )
    .map(([key]) => key);
  if (notIso.length > 0) {
    return `A date is sent as YYYY-MM-DD (${notIso.join(", ")}).`;
  }
  const checked = schema?.safeParse(answers);
  return checked && !checked.success ? z.prettifyError(checked.error) : null;
}

/**
 * Why an assistant may not change an item now, or null. Only an item the person is still working
 * on (open, or set aside as waiting) is open to it. A filled or declined item is the person's
 * finished word; a signed one is management's, and saving into it would withdraw the signature
 * (`hasSignOffToWithdraw`, the rule intake applies). An item whose review came due still carries
 * its signature while the walk shows it as filled, so `row`, its status row, is read too. A
 * rejected item keeps its old signature too, but was sent back for rework: working on it is what
 * the rejection asks, in the app as here.
 */
export function closedFor(
  state: ItemState,
  row: SignOffState | null,
): "signed" | "filled" | "declined" | null {
  if (state.kind === "signed" || state.kind === "not_applicable") return "signed";
  if (row && row.status !== "rejected" && hasSignOffToWithdraw(row)) return "signed";
  if (state.kind === "filled" || state.kind === "declined") return state.kind;
  return null;
}

const isDate = (type: z.core.$ZodType): boolean =>
  type instanceof z.core.$ZodDate ||
  ((type instanceof z.core.$ZodNullable || type instanceof z.core.$ZodOptional) &&
    isDate(type._zod.def.innerType));

/**
 * A date an assistant sends, read only in ISO form. JavaScript reads "01.03.2026" as 3 January,
 * and the app's date input shows nothing for text it cannot read.
 */
const ISO_DAY = z.iso.date();
const ISO_DATE = z.union([ISO_DAY, z.iso.datetime({ offset: true })]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The schema, taking its timestamps as text too: the app sends Date objects over superjson, an
 * assistant sends JSON. Text that is no ISO date becomes an invalid date, which the schema refuses.
 */
export const textDates = <S extends z.ZodObject>(schema: S) => {
  const dates = Object.keys(schema.shape).filter((key) => isDate(schema.shape[key]));
  return z.preprocess(
    (input) =>
      isRecord(input)
        ? {
            ...input,
            ...Object.fromEntries(
              dates.flatMap((key) => {
                const value = input[key];
                if (typeof value !== "string") return [];
                const valid = ISO_DATE.safeParse(value).success;
                return [[key, new Date(valid ? value : Number.NaN)]];
              }),
            ),
          }
        : input,
    schema,
  );
};

/** A register as an assistant reads it and adds to it. */
export interface Register {
  /** What the register is called in the tools' answers. */
  readonly name: string;
  /** One new row, as the assistant sends it; dates as text. */
  readonly row: z.ZodObject;
  readonly rows: (caller: Caller) => Promise<readonly unknown[]>;
  readonly add: (caller: Caller, row: unknown) => Promise<{ readonly id: string }>;
}

type RegisterScreen = Extract<AnyScreen, { kind: "register" }>;

/**
 * Which procedure lists and adds the rows of the register a screen shows: the ones the screen's
 * own component calls (SupplierList, TrainingRecords, ManagementReviews). Files are uploaded in
 * the app, so no row takes a file key.
 */
function registerOf(screen: RegisterScreen): Register {
  switch (screen.module) {
    case "supplier": {
      const row = supplierCreateSchema;
      return {
        name: "supplier",
        row,
        rows: (caller) => caller.supplier.list(),
        add: (caller, input) => caller.supplier.create(textDates(row).parse(input)),
      };
    }
    case "training_record": {
      const { audience } = screen;
      const row = trainingCreateSchema.omit({
        trainingType: true,
        isManagement: true,
        certificateFileKey: true,
      });
      return {
        name: `training_record:${audience}`,
        row,
        rows: async (caller) =>
          (await caller.training.list()).filter((r) => inAudience(r, audience)),
        add: (caller, input) =>
          caller.training.create({
            ...textDates(row).parse(input),
            ...TRAINING_ROW[audience],
          }),
      };
    }
    case "management_review": {
      const row = managementReviewCreateSchema.omit({ minutesFileKey: true });
      return {
        name: "management_review",
        row,
        rows: (caller) => caller.managementReview.list(),
        add: (caller, input) =>
          caller.managementReview.create(textDates(row).parse(input)),
      };
    }
  }
}

/**
 * Why these rows cannot be added, or null. Checked before anything is written, so a call whose
 * rows all fail does not pick a waiting item up again for nothing.
 */
export function rowsProblem(register: Register, rows: readonly unknown[]): string | null {
  const row = textDates(register.row);
  const problems = rows.flatMap((input, index) => {
    const checked = row.safeParse(input);
    return checked.success ? [] : [`Row ${index}: ${z.prettifyError(checked.error)}`];
  });
  return problems.length > 0 ? problems.join("\n") : null;
}

/** The register an item shows; the walk gives no item more than one (walk.test.ts). */
export function registerOfItem(item: AnyItem): Register | null {
  const screen = item.screens.find((s): s is RegisterScreen => s.kind === "register");
  return screen ? registerOf(screen) : null;
}
