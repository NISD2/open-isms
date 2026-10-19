import "@/lib/server-guard";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import {
  itemHref,
  NIS2_WALK,
  WALK_LOCALES,
  WALK_ROUTES,
  type WalkLocale,
} from "@/lib/durchgang";
import { getAppUrl } from "@/lib/utils";
import type { KeyHolder } from "./context";

/** What every tool checks before it reads or writes, and the shape of its answer. */

/**
 * The walk an assistant reads and fills: NIS 2's, until one server serves every walk with a
 * framework parameter (NIS2 product-design/compliance-schema.md, step S4).
 */
export const MCP_WALK = NIS2_WALK;
/** The input that names it to the walk's own procedures. */
export const ON_WALK = { framework: MCP_WALK.framework } as const;

export const language = z
  .enum(WALK_LOCALES)
  .default("de")
  .describe("The language of the walkthrough's own words and links: de, en or cs.");

export type ToolOutcome =
  | { readonly ok: true; readonly data: Record<string, unknown> }
  | { readonly ok: false; readonly message: string };

export const refuse = (message: string): ToolOutcome => ({ ok: false, message });

/** The item's page in the app, where the person finishes it. */
export const linkOf = (code: string, language: WalkLocale): string =>
  `${getAppUrl()}${getPathname({
    href: itemHref(MCP_WALK.framework, code),
    locale: language,
  })}`;

/**
 * One item of the holder's walk with its state, requirement and the company's assessment, or why
 * not: not in this company's walk, or in an area the holder is not assigned to (the rule the
 * item's page applies).
 */
export async function itemOf(holder: KeyHolder, code: string) {
  const { caller } = holder;
  const states = await caller.durchgang.walk(ON_WALK);
  const entry = states.find((s) => s.code === code);
  const item = entry && MCP_WALK.items.find((i) => i.code === code);
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

/**
 * What an assistant is told when the walkthrough is not unlocked for the account yet, as Settings
 * says it (`settings.mcp.locked`). The link is the walkthrough's own page, which shows each
 * account its next step (`walkLockFor`): the offer, the order page, or only the journey where
 * nothing can be ordered.
 */
const NOT_IN_PLAN: Record<WalkLocale, (link: string) => string> = {
  en: (link) =>
    `The NIS 2 walkthrough is not unlocked for this account yet. Until it is, an assistant can read and fill in nothing. Its page in the app shows the person the next step: ${link}`,
  de: (link) =>
    `Der NIS 2 Durchgang ist für dieses Konto noch nicht freigeschaltet. Bis dahin kann ein Assistent nichts lesen und nichts ausfüllen. Seine Seite in der App zeigt den nächsten Schritt: ${link}`,
  cs: (link) =>
    `Průvodce NIS 2 pro tento účet zatím není odemčen. Do té doby asistent nemůže nic číst ani vyplňovat. Jeho stránka v aplikaci ukazuje další krok: ${link}`,
};

/** The refusal for an account the walkthrough is locked for, in the assistant's language, or null. */
export const notInPlan = (holder: KeyHolder, language: WalkLocale): ToolOutcome | null =>
  holder.mayWalk
    ? null
    : refuse(
        NOT_IN_PLAN[language](
          `${getAppUrl()}${getPathname({ href: WALK_ROUTES[MCP_WALK.framework].home, locale: language })}`,
        ),
      );
