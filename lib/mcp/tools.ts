import "@/lib/server-guard";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import {
  type AnyItem,
  type ItemState,
  resolveItem,
  WALK,
  type WalkLocale,
} from "@/lib/durchgang";
import { getAppUrl } from "@/lib/utils";
import de from "@/messages/durchgang/de.json";
import en from "@/messages/durchgang/en.json";
import type { KeyHolder } from "./context";
import { describeError } from "./errors";
import {
  FILLED_BY,
  fieldKeysOf,
  fieldsSchemaOf,
  jsonSchemaOf,
  registerOfItem,
  screensFilledBy,
} from "./walk";

/**
 * The two tools: read the company's walkthrough, and fill an item's fields and register. Each is
 * a thin layer over the procedures the walk's own screens call, so the company, role, plan and
 * category gates are the app's. Nothing here decides an item, signs it or deletes anything: the
 * person finishes each item in the app, and management signs it there.
 */

const LANGUAGES = ["de", "en"] as const satisfies readonly WalkLocale[];
/** The walk's words per language: the `durchgang` namespace, as the page reads it. */
const COPY = { de: de.durchgang, en: en.durchgang } as const;

/** Rows one call may add: enough for a register, small enough to read back. */
const MAX_ROWS = 50;

const language = z
  .enum(LANGUAGES)
  .default("de")
  .describe("The language of the walkthrough's own words and links: de or en.");

export const GetWalkthroughInput = z.object({
  code: z
    .string()
    .max(10)
    .optional()
    .describe(
      'An item\'s code, for example "5.1", to read that item in full. Without it: every item.',
    ),
  language,
});

export const FillItemInput = z.object({
  code: z.string().max(10).describe('The item\'s code, for example "5.1".'),
  language,
  answers: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Answers to the item's fields, by field key, as get_walkthrough describes them.",
    ),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .max(MAX_ROWS)
    .optional()
    .describe(
      "New rows for the item's register, each as get_walkthrough's rowSchema describes it. The rows already in the register are listed there: do not add them again.",
    ),
});

export type ToolOutcome =
  | { readonly ok: true; readonly data: Record<string, unknown> }
  | { readonly ok: false; readonly message: string };

const refuse = (message: string): ToolOutcome => ({ ok: false, message });

/** The item's page in the app, where the person finishes it. */
const linkOf = (code: string, language: WalkLocale): string =>
  `${getAppUrl()}${getPathname({
    href: { pathname: "/durchgang/nis2/[code]", params: { code } },
    locale: language,
  })}`;

function wordsOf(item: AnyItem, language: WalkLocale) {
  const resolved = resolveItem(COPY[language], item);
  if (!resolved.ok)
    throw new Error(`Durchgang ${item.code}: ${resolved.errors.join("; ")}`);
  return resolved.value;
}

const withoutEmpty = (row: unknown): unknown =>
  typeof row === "object" && row !== null
    ? Object.fromEntries(Object.entries(row).filter(([, value]) => value != null))
    : row;

/**
 * One item of the holder's walk with its state, requirement and the company's assessment, or why
 * not: not in this company's walk, or in an area the holder is not assigned to (the rule the
 * item's page applies).
 */
async function itemOf(holder: KeyHolder, code: string) {
  const { caller } = holder;
  const states = await caller.durchgang.walk();
  const entry = states.find((s) => s.code === code);
  const item = entry && WALK.find((i) => i.code === code);
  if (!entry || !item)
    return {
      ok: false as const,
      message: `${code} is not an item of this company's walkthrough.`,
    };
  const [req, assessment] = await Promise.all([
    caller.requirement.getByCode({ code }),
    caller.assessment.getActiveAssessment(),
  ]);
  if (!req?.category)
    return {
      ok: false as const,
      message: `${code} is not an item of this company's walkthrough.`,
    };
  if (assessment) {
    const access = await getUserAccess(assessment.id, holder.userId, holder.role);
    if (!canSeeCategory(access, req.category.id)) {
      return {
        ok: false as const,
        message: `${code} is in an area that is not assigned to you.`,
      };
    }
  }
  return {
    ok: true as const,
    item,
    state: entry.state,
    req,
    categoryId: req.category.id,
    assessment,
  };
}

async function answersOf(
  holder: KeyHolder,
  code: string,
  assessmentId: string | null,
  categoryId: string,
): Promise<Record<string, unknown>> {
  if (!assessmentId) return {};
  const { answers } = await holder.caller.intake.getRequirementAnswers({
    assessmentId,
    categoryId,
    requirementCode: code,
  });
  return answers;
}

async function listWalk(holder: KeyHolder, language: WalkLocale): Promise<ToolOutcome> {
  const states = await holder.caller.durchgang.walk();
  const items = states.flatMap(({ code, state }) => {
    const item = WALK.find((i) => i.code === code);
    if (!item) return [];
    const words = wordsOf(item, language);
    return [
      {
        code,
        headline: words.headline,
        teaser: words.teaser,
        area: item.category,
        state,
        assistantFills: screensFilledBy(item, "assistant"),
        appOnly: screensFilledBy(item, "app"),
        link: linkOf(code, language),
      },
    ];
  });
  return { ok: true, data: { items } };
}

async function readItem(
  holder: KeyHolder,
  code: string,
  language: WalkLocale,
): Promise<ToolOutcome> {
  const found = await itemOf(holder, code);
  if (!found.ok) return refuse(found.message);
  const { item, state, req, categoryId, assessment } = found;
  const words = wordsOf(item, language);
  const schema = fieldsSchemaOf(item);
  const register = registerOfItem(item);
  const [answers, rows] = await Promise.all([
    schema ? answersOf(holder, code, assessment?.id ?? null, categoryId) : {},
    register ? register.rows(holder.caller) : [],
  ]);
  return {
    ok: true,
    data: {
      code,
      headline: words.headline,
      teaser: words.teaser,
      area: item.category,
      state,
      law: { bsig: req.legalRef, directive: req.frameworkRef },
      screens: words.screens.map((s) => ({
        kind: s.kind,
        filledBy: FILLED_BY[s.kind],
        words: s.copy,
      })),
      fields: schema ? { schema: jsonSchemaOf(schema), answers } : null,
      register: register
        ? {
            name: register.name,
            rowSchema: jsonSchemaOf(register.row),
            rows: rows.map(withoutEmpty),
          }
        : null,
      link: linkOf(code, language),
    },
  };
}

export const getWalkthrough = (
  holder: KeyHolder,
  input: z.output<typeof GetWalkthroughInput>,
): Promise<ToolOutcome> =>
  input.code
    ? readItem(holder, input.code, input.language)
    : listWalk(holder, input.language);

/** States in which the item is management's: changing it would take their signature back. */
const SIGNED: ReadonlySet<ItemState["kind"]> = new Set(["signed", "not_applicable"]);

async function addRows(holder: KeyHolder, item: AnyItem, rows: readonly unknown[]) {
  const register = registerOfItem(item);
  if (!register) return null;
  // Async, so a row its schema refuses before any promise exists is reported as that row's.
  const results = await Promise.allSettled(
    rows.map(async (row) => register.add(holder.caller, row)),
  );
  return results.map((result, index) =>
    result.status === "fulfilled"
      ? { index, id: result.value.id }
      : { index, refused: describeError(result.reason) ?? "Could not be saved." },
  );
}

export async function fillItem(
  holder: KeyHolder,
  input: z.output<typeof FillItemInput>,
): Promise<ToolOutcome> {
  const { code, answers = {}, rows = [] } = input;
  const found = await itemOf(holder, code);
  if (!found.ok) return refuse(found.message);
  const { item, state, categoryId, assessment } = found;
  const link = linkOf(code, input.language);

  if (SIGNED.has(state.kind)) {
    return refuse(
      `Management has signed ${code}. Changing it takes that signature back, so it is changed in the app: ${link}`,
    );
  }
  const keys = fieldKeysOf(item);
  const unknown = Object.keys(answers).filter((key) => !keys.includes(key));
  if (unknown.length > 0) {
    return refuse(
      `${code} asks no field ${unknown.join(", ")}. Its fields: ${keys.join(", ") || "none"}.`,
    );
  }
  if (rows.length > 0 && !registerOfItem(item)) {
    return refuse(`${code} has no register to add rows to.`);
  }
  if (Object.keys(answers).length === 0 && rows.length === 0) {
    return refuse("Send answers, rows or both.");
  }
  if (Object.keys(answers).length > 0) {
    if (!assessment)
      return refuse(`Finish setting up the company in the app first: ${link}`);
    await holder.caller.intake.saveRequirementAnswers({
      assessmentId: assessment.id,
      categoryId,
      requirementCode: code,
      answers,
    });
  }
  const added = rows.length > 0 ? await addRows(holder, item, rows) : null;
  const stored = await answersOf(holder, code, assessment?.id ?? null, categoryId);
  return {
    ok: true,
    data: {
      code,
      savedAnswers: Object.keys(answers),
      rows: added,
      stillEmpty: keys.filter((key) => stored[key] == null || stored[key] === ""),
      appOnly: screensFilledBy(item, "app"),
      next: `The person finishes ${code} in the app, where management also signs it: ${link}`,
    },
  };
}
