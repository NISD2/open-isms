import "@/lib/server-guard";
import { z } from "zod";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import {
  type AnyItem,
  type AnyScreen,
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

const isDate = (type: z.core.$ZodType): boolean =>
  type instanceof z.core.$ZodDate ||
  ((type instanceof z.core.$ZodNullable || type instanceof z.core.$ZodOptional) &&
    isDate(type._zod.def.innerType));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The schema, taking its timestamps as text too: the app sends Date objects over superjson, an
 * assistant sends JSON. Text that is no date becomes an invalid date, which the schema refuses.
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
                return typeof value === "string" ? [[key, new Date(value)]] : [];
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

/** The register an item shows; the walk gives no item more than one (walk.test.ts). */
export function registerOfItem(item: AnyItem): Register | null {
  const screen = item.screens.find((s): s is RegisterScreen => s.kind === "register");
  return screen ? registerOf(screen) : null;
}
