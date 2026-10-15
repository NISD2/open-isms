import "@/lib/server-guard";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import { isReviewerRole } from "@/lib/auth/roles";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import { signedOffByModule } from "@/lib/compliance/module-recheck";
import { db } from "@/lib/db";
import {
  type AnyItem,
  resolveItem,
  WALK,
  WALK_LOCALES,
  type WalkLocale,
} from "@/lib/durchgang";
import { loggableFailure } from "@/lib/trpc/loggable-failure";
import { getAppUrl } from "@/lib/utils";
import cs from "@/messages/durchgang/cs.json";
import de from "@/messages/durchgang/de.json";
import en from "@/messages/durchgang/en.json";
import { enforceAssignment } from "@/server/trpc/guards";
import type { KeyHolder } from "./context";
import { describeError } from "./errors";
import {
  answersProblem,
  closedFor,
  fieldKeysOf,
  fieldsSchemaOf,
  filledBy,
  jsonSchemaOf,
  type Register,
  registerOfItem,
  rowsProblem,
  screensFilledBy,
} from "./walk";

/**
 * The two tools: read the company's walkthrough, and fill an item's fields and register. Each is
 * a thin layer over the procedures the walk's own screens call, so the company, role, plan and
 * category gates are the app's. Nothing here decides an item, signs it or deletes anything: the
 * person finishes each item in the app, and management signs it there.
 */

/** The walk's words per language: the `durchgang` namespace, as the page reads it. */
const COPY = {
  de: de.durchgang,
  en: en.durchgang,
  cs: cs.durchgang,
} as const satisfies Record<WalkLocale, unknown>;

/** Rows one call may add: enough for a register, small enough to read back. */
const MAX_ROWS = 50;

const language = z
  .enum(WALK_LOCALES)
  .default("de")
  .describe("The language of the walkthrough's own words and links: de, en or cs.");

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
        filledBy: filledBy(item, s.kind),
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

/** Why an assistant may not change this item now (`closedFor`), in words, or null. */
async function refusalOf(
  holder: KeyHolder,
  found: Extract<Awaited<ReturnType<typeof itemOf>>, { ok: true }>,
  link: string,
): Promise<string | null> {
  const { item, state, req, categoryId, assessment } = found;
  const statuses = assessment
    ? await holder.caller.assessment.getStatusesByCategory({
        assessmentId: assessment.id,
        categoryId,
      })
    : [];
  const row = statuses.find((s) => s.requirementId === req.id)?.status ?? null;
  switch (closedFor(state, row)) {
    case "signed":
      return `Management has signed ${item.code}. Changing it takes that signature back, so it is changed in the app: ${link}`;
    case "filled":
      return `The person has finished ${item.code} and it waits for management's signature. Changes to it are made in the app: ${link}`;
    case "declined":
      return `The company decided not to do ${item.code}. That decision is changed in the app: ${link}`;
    case null:
      return null;
  }
}

/**
 * Why adding rows to this register would take back a signature, or null. A new row sends every
 * signed item that relies on the register back to management (`invalidateModuleSignOffs`), the
 * item the rows are for and any other, such as 1.1 for a training row sent to 8.2. An assistant
 * never takes a signature back, so those rows are added in the app.
 */
async function signaturesRowsTakeBack(
  holder: KeyHolder,
  register: Register,
  link: string,
): Promise<string | null> {
  const signed = await signedOffByModule(db, holder.companyId, register.module);
  if (signed.length === 0) return null;
  const codes = signed.map((s) => s.requirementCode).join(", ");
  return `A new row in the ${register.name} register would take management's signature back from ${codes}, so it is added in the app: ${link}`;
}

/**
 * The rows, one after the other in the order sent, each saved or refused on its own, so the
 * answer lists them in that order and an unexpected failure is logged against its row.
 */
async function addRows(holder: KeyHolder, register: Register, rows: readonly unknown[]) {
  const results: Array<
    { index: number; id: string } | { index: number; refused: string }
  > = [];
  for (const [index, row] of rows.entries()) {
    try {
      const { id } = await register.add(holder.caller, row);
      results.push({ index, id });
    } catch (error) {
      const refused = describeError(error);
      if (!refused) {
        console.error(
          "[mcp] a register row failed:",
          error instanceof Error ? loggableFailure(error) : error,
        );
      }
      results.push({ index, refused: refused ?? "Could not be saved." });
    }
  }
  return results;
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
  const keys = fieldKeysOf(item);
  const register = registerOfItem(item);
  const answering = Object.keys(answers).length > 0;

  if (!answering && rows.length === 0) return refuse("Send answers, rows or both.");
  if (rows.length > 0 && !register)
    return refuse(`${code} has no register to add rows to.`);
  if (rows.length > 0 && filledBy(item, "register") !== "assistant") {
    return refuse(
      `Rows on ${code} are added in the app, where management approves the item: ${link}`,
    );
  }
  const problem =
    (answering ? answersProblem(item, answers) : null) ??
    (register && rows.length > 0 ? rowsProblem(register, rows) : null);
  if (problem) return refuse(problem);
  const refusal = await refusalOf(holder, found, link);
  if (refusal) return refuse(refusal);
  if (!assessment) {
    return refuse(`Finish setting up the company in the app first: ${link}`);
  }
  if (isReviewerRole(holder.role)) {
    return refuse("Your role reviews the walkthrough; it does not fill it in.");
  }
  // The rule the app's answer saves apply (intake), held here for rows too, whose procedures in
  // the app do not check it: the person's own area, or an admin.
  await enforceAssignment(db, {
    role: holder.role,
    userId: holder.userId,
    assessmentId: assessment.id,
    categoryId,
  });
  const takesBack =
    register && rows.length > 0
      ? await signaturesRowsTakeBack(holder, register, link)
      : null;
  if (takesBack) return refuse(takesBack);

  // As in the app, and before any write: working on an item set aside picks it up again, and a
  // resume the person may not make stops the call before anything is saved.
  if (state.kind === "waiting") await holder.caller.durchgang.resume({ code });
  if (answering) {
    await holder.caller.intake.saveRequirementAnswers({
      assessmentId: assessment.id,
      categoryId,
      requirementCode: code,
      answers,
    });
  }
  const added =
    register && rows.length > 0 ? await addRows(holder, register, rows) : null;
  const stored = await answersOf(holder, code, assessment.id, categoryId);
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
