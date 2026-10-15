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
import { UPLOAD_ENCRYPTION } from "@/lib/storage";
import { loggableFailure } from "@/lib/trpc/loggable-failure";
import { getAppUrl } from "@/lib/utils";
import cs from "@/messages/durchgang/cs.json";
import de from "@/messages/durchgang/de.json";
import en from "@/messages/durchgang/en.json";
import { enforceAssignment } from "@/server/trpc/guards";
import type { KeyHolder } from "./context";
import { describeError } from "./errors";
import { type FillableKind, isFillableKind, SCREEN_FILLS } from "./screens";
import {
  answersProblem,
  changesProblem,
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
 * The two tools: read the company's walkthrough, and fill an item: its fields, its register and
 * its other screens (the asset list, ratings, agreements, sign-ins, backups, critical processes,
 * policies). Each is a thin layer over the procedures the walk's own screens call, so the company,
 * role, plan and category gates are the app's. Nothing here signs an item, decides against it,
 * takes a signature back or deletes anything: the person finishes each item in the app, and
 * management signs it there.
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
  changes: z
    .array(
      z.object({
        id: z
          .string()
          .uuid()
          .describe("The id of a row get_walkthrough lists in the register."),
        fields: z
          .record(z.string(), z.unknown())
          .describe(
            "The fields to change, as the register's changeSchema describes them.",
          ),
      }),
    )
    .max(MAX_ROWS)
    .optional()
    .describe(
      "Corrections to rows already in the item's register; fields left out stay.",
    ),
  files: z
    .array(
      z.object({
        evidenceId: z.string().uuid().describe("The evidenceId upload_file returned."),
        contentHash: z
          .string()
          .length(64)
          .optional()
          .describe("The file's SHA-256 as hex, recorded with it."),
      }),
    )
    .max(20)
    .optional()
    .describe(
      "Files uploaded with upload_file (purpose evidence), attached to the item as evidence once their bytes are uploaded.",
    ),
  screens: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Input for the item's other screens, by screen kind (assets, specify, rate, agreements, logins, backups, critical, policy, crypto, adopt), each as get_walkthrough's screens[].input describes it. Use the ids get_walkthrough lists under screens[].now.",
    ),
});

export const UploadFileInput = z.object({
  code: z.string().max(10).describe('The item the file belongs to, for example "8.2".'),
  language,
  purpose: z
    .enum(["evidence", "training_certificate"])
    .describe(
      "evidence: a document that shows the item is done, attached to it. training_certificate: the certificate of a training row on an item that keeps training records.",
    ),
  fileName: z.string().min(1).max(500),
  contentType: z.string().min(1).max(100).describe('For example "application/pdf".'),
  fileSize: z.number().int().positive().describe("The file's size in bytes."),
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

/** The screen's own save, when an assistant fills this kind of screen on this item. */
const assistantFill = (item: AnyItem, kind: string): FillableKind | null =>
  isFillableKind(kind) && filledBy(item, kind) === "assistant" ? kind : null;

/** What each screen an assistant fills on the item shows now, by kind. */
async function screenContents(
  holder: KeyHolder,
  item: AnyItem,
  code: string,
  language: WalkLocale,
): Promise<ReadonlyMap<FillableKind, unknown>> {
  const kinds = [
    ...new Set(item.screens.flatMap((s) => assistantFill(item, s.kind) ?? [])),
  ];
  const contents = await Promise.all(
    kinds.map((kind) => SCREEN_FILLS[kind].shows(holder.caller, code, language)),
  );
  return new Map(kinds.map((kind, i) => [kind, contents[i]]));
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
  const [answers, rows, nows] = await Promise.all([
    schema ? answersOf(holder, code, assessment?.id ?? null, categoryId) : {},
    register ? register.rows(holder.caller) : [],
    screenContents(holder, item, code, language),
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
      screens: words.screens.map((s) => {
        const fills = assistantFill(item, s.kind);
        return {
          kind: s.kind,
          filledBy: filledBy(item, s.kind),
          words: s.copy,
          ...(fills
            ? { input: jsonSchemaOf(SCREEN_FILLS[fills].input), now: nows.get(fills) }
            : {}),
        };
      }),
      fields: schema ? { schema: jsonSchemaOf(schema), answers } : null,
      register: register
        ? {
            name: register.name,
            rowSchema: jsonSchemaOf(register.row),
            changeSchema: register.change ? jsonSchemaOf(register.change.patch) : null,
            rows: rows.map(withoutEmpty),
          }
        : null,
      link: linkOf(code, language),
    },
  };
}

/** What an assistant is told when the company's plan does not include the walkthrough yet. */
const NOT_IN_PLAN: Record<WalkLocale, (link: string) => string> = {
  en: (link) =>
    `The NIS 2 walkthrough is not part of this company's plan yet, so an assistant can read and fill in nothing. The person unlocks it here: ${link}`,
  de: (link) =>
    `Der NIS 2 Durchgang ist noch nicht Teil des Plans dieses Unternehmens, deshalb kann ein Assistent nichts lesen und nichts ausfüllen. Freischalten lässt er sich hier: ${link}`,
  cs: (link) =>
    `Průvodce NIS 2 zatím není součástí plánu této společnosti, proto asistent nemůže nic číst ani vyplňovat. Odemknout ho lze zde: ${link}`,
};

/** The refusal for a plan without the walkthrough, in the assistant's language, or null. */
const notInPlan = (holder: KeyHolder, language: WalkLocale): ToolOutcome | null =>
  holder.mayWalk
    ? null
    : refuse(
        NOT_IN_PLAN[language](
          `${getAppUrl()}${getPathname({ href: "/pricing", locale: language })}`,
        ),
      );

export async function getWalkthrough(
  holder: KeyHolder,
  input: z.output<typeof GetWalkthroughInput>,
): Promise<ToolOutcome> {
  const locked = notInPlan(holder, input.language);
  if (locked) return locked;
  return input.code
    ? readItem(holder, input.code, input.language)
    : listWalk(holder, input.language);
}

type FoundItem = Extract<Awaited<ReturnType<typeof itemOf>>, { ok: true }>;

/** The item's status row in the company's assessment, or null before it has one. */
async function statusOf(holder: KeyHolder, found: FoundItem) {
  const { req, categoryId, assessment } = found;
  const statuses = assessment
    ? await holder.caller.assessment.getStatusesByCategory({
        assessmentId: assessment.id,
        categoryId,
      })
    : [];
  return statuses.find((s) => s.requirementId === req.id)?.status ?? null;
}

/** Why an assistant may not change this item now (`closedFor`), in words, or null. */
function refusalOf(
  found: FoundItem,
  row: Awaited<ReturnType<typeof statusOf>>,
  link: string,
): string | null {
  const { item, state } = found;
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
 * Why changing these registers would take back a signature, or null. A change sends every signed
 * item that relies on a register back to management (`invalidateModuleSignOffs`), the item being
 * filled and any other, such as 1.1 for a training row sent to 8.2. An assistant never takes a
 * signature back, so those changes are made in the app.
 */
async function signaturesTakenBack(
  holder: KeyHolder,
  modules: readonly string[],
  link: string,
): Promise<string | null> {
  const signed = (
    await Promise.all(modules.map((m) => signedOffByModule(db, holder.companyId, m)))
  ).flat();
  if (signed.length === 0) return null;
  const codes = [...new Set(signed.map((s) => s.requirementCode))].join(", ");
  return `Changing the ${modules.join(" and ")} register would take management's signature back from ${codes}, so it is changed in the app: ${link}`;
}

/**
 * Why rewriting this item's policy would take back management's approval of it, or null: a text
 * that changes goes back to draft (writePolicy), and an assistant never takes an approval back.
 */
async function approvalTakenBack(
  holder: KeyHolder,
  code: string,
  link: string,
): Promise<string | null> {
  const policies = await holder.caller.durchgang.walkPolicies();
  // The approval date too: a status set back by hand on the policies page keeps it.
  return policies.some(
    (p) => p.code === code && (p.status === "approved" || p.approvedAt !== null),
  )
    ? `Management approved the policy of ${code}. Rewriting it takes that approval back, so it is changed in the app: ${link}`
    : null;
}

/** The screens sent, each checked against the item and its own schema, or why not. */
function screensOf(
  item: AnyItem,
  sent: Readonly<Record<string, unknown>>,
  link: string,
):
  | { readonly ok: true; readonly screens: ReadonlyArray<[FillableKind, unknown]> }
  | { readonly ok: false; readonly message: string } {
  const entries = Object.entries(sent);
  const notHere = entries.filter(
    ([kind]) => !item.screens.some((s) => s.kind === kind) || !isFillableKind(kind),
  );
  if (notHere.length > 0) {
    return {
      ok: false,
      message: `${item.code} has no screen an assistant fills called ${notHere.map(([k]) => k).join(", ")}.`,
    };
  }
  // In the item's own order, as the person goes through it: the 9.1 list before the policy that
  // prints it, the 4.2 processes before the plan.
  const position = (kind: string) => item.screens.findIndex((s) => s.kind === kind);
  const screens = entries
    .flatMap(([kind, input]) =>
      isFillableKind(kind) ? [[kind, input] as [FillableKind, unknown]] : [],
    )
    .sort(([a], [b]) => position(a) - position(b));
  const inApp = screens.filter(([kind]) => filledBy(item, kind) !== "assistant");
  if (inApp.length > 0) {
    return {
      ok: false,
      message: `${inApp.map(([k]) => k).join(", ")} on ${item.code} is filled in the app: ${link}`,
    };
  }
  const problems = screens.flatMap(([kind, input]) => {
    const checked = SCREEN_FILLS[kind].input.safeParse(input);
    return checked.success ? [] : [`${kind}: ${z.prettifyError(checked.error)}`];
  });
  return problems.length > 0
    ? { ok: false, message: problems.join("\n") }
    : { ok: true, screens };
}

/**
 * The screens, saved one after the other in the item's order, each through its screen's own
 * procedure and each saved or refused on its own.
 */
async function saveScreens(
  holder: KeyHolder,
  code: string,
  screens: ReadonlyArray<[FillableKind, unknown]>,
) {
  const results: Array<
    { kind: FillableKind; saved: unknown } | { kind: FillableKind; refused: string }
  > = [];
  for (const [kind, input] of screens) {
    try {
      results.push({
        kind,
        saved: await SCREEN_FILLS[kind].save(holder.caller, code, input),
      });
    } catch (error) {
      const refused = describeError(error);
      if (!refused) {
        console.error(
          `[mcp] the ${kind} screen failed:`,
          error instanceof Error ? loggableFailure(error) : error,
        );
      }
      results.push({ kind, refused: refused ?? "Could not be saved." });
    }
  }
  return results;
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

/**
 * Whether the holder's assistant may change this item now, or why not: closed for it, a company
 * not set up yet, a reviewer's role, or an area that is not the person's own (the rule the app's
 * answer saves apply, held here for every write, including those whose procedures do not check
 * it). Returns the item's status row and assessment for the writes that need them.
 */
async function mayChange(holder: KeyHolder, found: FoundItem, link: string) {
  const { categoryId, assessment } = found;
  const row = await statusOf(holder, found);
  const refusal = refusalOf(found, row, link);
  if (refusal) return { ok: false as const, message: refusal };
  if (!assessment) {
    return {
      ok: false as const,
      message: `Finish setting up the company in the app first: ${link}`,
    };
  }
  if (isReviewerRole(holder.role)) {
    return {
      ok: false as const,
      message: "Your role reviews the walkthrough; it does not fill it in.",
    };
  }
  await enforceAssignment(db, {
    role: holder.role,
    userId: holder.userId,
    assessmentId: assessment.id,
    categoryId,
  });
  return { ok: true as const, assessment, statusRow: row };
}

/** The corrections, one after the other, each saved or refused on its own. */
async function saveChanges(
  holder: KeyHolder,
  register: Register,
  changes: ReadonlyArray<{ readonly id: string; readonly fields: unknown }>,
) {
  const { change } = register;
  if (!change) return [];
  const results: Array<{ id: string; changed: true } | { id: string; refused: string }> =
    [];
  for (const { id, fields } of changes) {
    try {
      await change.save(holder.caller, id, fields);
      results.push({ id, changed: true });
    } catch (error) {
      const refused = describeError(error);
      if (!refused) {
        console.error(
          "[mcp] a register change failed:",
          error instanceof Error ? loggableFailure(error) : error,
        );
      }
      results.push({ id, refused: refused ?? "Could not be saved." });
    }
  }
  return results;
}

/**
 * The uploaded files, each confirmed as the item's evidence or refused on its own. Only a file
 * started for this item (`upload_file` on this code) and not confirmed yet is attached: the item's
 * own checks, closed and signed among them, are the ones that ran for this call.
 */
async function confirmFiles(
  holder: KeyHolder,
  statusRowId: string | null,
  files: ReadonlyArray<{ readonly evidenceId: string; readonly contentHash?: string }>,
) {
  const drafts = statusRowId
    ? new Set(
        (
          await holder.caller.evidence.listByRequirementStatus({
            requirementStatusId: statusRowId,
          })
        )
          .filter((e) => e.status === "draft")
          .map((e) => e.id),
      )
    : new Set<string>();
  const results: Array<
    { evidenceId: string; attached: true } | { evidenceId: string; refused: string }
  > = [];
  for (const { evidenceId, contentHash } of files) {
    if (!drafts.has(evidenceId)) {
      results.push({
        evidenceId,
        refused: "Not a file upload_file started for this item, or already attached.",
      });
      continue;
    }
    try {
      const confirmed = await holder.caller.evidence.confirmUpload({
        evidenceId,
        contentHash,
      });
      results.push(
        confirmed
          ? { evidenceId, attached: true }
          : {
              evidenceId,
              refused: "Already attached, or not uploaded through upload_file.",
            },
      );
    } catch (error) {
      results.push({
        evidenceId,
        refused: describeError(error) ?? "Could not be attached.",
      });
    }
  }
  return results;
}

export async function fillItem(
  holder: KeyHolder,
  input: z.output<typeof FillItemInput>,
): Promise<ToolOutcome> {
  const { code, answers = {}, rows = [], changes = [], files = [] } = input;
  const locked = notInPlan(holder, input.language);
  if (locked) return locked;
  const found = await itemOf(holder, code);
  if (!found.ok) return refuse(found.message);
  const { item, state, categoryId } = found;
  const link = linkOf(code, input.language);
  const keys = fieldKeysOf(item);
  const register = registerOfItem(item);
  const answering = Object.keys(answers).length > 0;
  const sent = screensOf(item, input.screens ?? {}, link);
  if (!sent.ok) return refuse(sent.message);
  const { screens } = sent;
  const touchesRegister = rows.length > 0 || changes.length > 0;

  if (!answering && !touchesRegister && screens.length === 0 && files.length === 0)
    return refuse("Send answers, rows, changes, screens or files.");
  if (touchesRegister && !register)
    return refuse(`${code} has no register to add rows to or change.`);
  if (touchesRegister && filledBy(item, "register") !== "assistant") {
    return refuse(
      `Rows on ${code} are added in the app, where management approves the item: ${link}`,
    );
  }
  const listed =
    register && changes.length > 0
      ? new Map((await register.rows(holder.caller)).map((r) => [r.id, r] as const))
      : new Map();
  const problem =
    (answering ? answersProblem(item, answers) : null) ??
    (register && rows.length > 0 ? rowsProblem(register, rows) : null) ??
    (register && changes.length > 0 ? changesProblem(register, listed, changes) : null);
  if (problem) return refuse(problem);
  const allowed = await mayChange(holder, found, link);
  if (!allowed.ok) return refuse(allowed.message);
  const { assessment } = allowed;
  const modules = [
    ...new Set([
      ...(register && touchesRegister ? [register.module] : []),
      ...screens.flatMap(([kind]) => SCREEN_FILLS[kind].modules),
    ]),
  ];
  const takesBack =
    (modules.length > 0 ? await signaturesTakenBack(holder, modules, link) : null) ??
    (screens.some(([kind]) => kind === "policy")
      ? await approvalTakenBack(holder, code, link)
      : null);
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
  const changed =
    register && changes.length > 0 ? await saveChanges(holder, register, changes) : null;
  const saved = screens.length > 0 ? await saveScreens(holder, code, screens) : null;
  const attached =
    files.length > 0
      ? await confirmFiles(holder, allowed.statusRow?.id ?? null, files)
      : null;
  const stored = await answersOf(holder, code, assessment.id, categoryId);
  return {
    ok: true,
    data: {
      code,
      savedAnswers: Object.keys(answers),
      rows: added,
      changes: changed,
      screens: saved,
      files: attached,
      stillEmpty: keys.filter((key) => stored[key] == null || stored[key] === ""),
      appOnly: screensFilledBy(item, "app"),
      next: `The person finishes ${code} in the app, where management also signs it: ${link}`,
    },
  };
}

/**
 * The request an assistant sends the file's bytes with, with the headers the app's own upload
 * sends (FileUpload): the encryption is part of the signature, so storage refuses a PUT without it.
 */
const putRequest = (url: string, contentType: string) => ({
  method: "PUT",
  url,
  headers: {
    "content-type": contentType,
    "x-amz-server-side-encryption": UPLOAD_ENCRYPTION,
  },
});

/**
 * An address to upload one file to, from the procedure the app's own upload calls, after the
 * same checks as filling the item. The bytes go from the assistant straight to storage; the app
 * only signs the address, for this company's own prefix and this size. Evidence counts once the
 * file is stored: confirming it checks the object is there at that size.
 */
export async function uploadFile(
  holder: KeyHolder,
  input: z.output<typeof UploadFileInput>,
): Promise<ToolOutcome> {
  const { code, fileName, contentType, fileSize } = input;
  const locked = notInPlan(holder, input.language);
  if (locked) return locked;
  const found = await itemOf(holder, code);
  if (!found.ok) return refuse(found.message);
  const link = linkOf(code, input.language);
  const allowed = await mayChange(holder, found, link);
  if (!allowed.ok) return refuse(allowed.message);

  if (input.purpose === "training_certificate") {
    const register = registerOfItem(found.item);
    if (register?.module !== "training_record")
      return refuse(`${code} keeps no training records to attach a certificate to.`);
    const signed = await holder.caller.training.getCertificateUploadUrl({
      fileName,
      contentType,
      fileSize,
    });
    return {
      ok: true,
      data: {
        upload: putRequest(signed.uploadUrl, signed.contentType),
        fileKey: signed.fileKey,
        next: "Send the file's bytes with that request, then put fileKey into certificateFileKey of the training row, in rows or changes of fill_walkthrough_item.",
      },
    };
  }

  if (!allowed.statusRow)
    return refuse(`${code} has no record in the company's assessment yet: ${link}`);
  const signed = await holder.caller.evidence.createUploadUrl({
    requirementStatusId: allowed.statusRow.id,
    fileName,
    fileType: contentType,
    fileSize,
  });
  return {
    ok: true,
    data: {
      upload: putRequest(signed.uploadUrl, signed.contentType),
      evidenceId: signed.evidenceId,
      next: "Send the file's bytes with that request, then call fill_walkthrough_item with files: [{ evidenceId }] to attach it.",
    },
  };
}
