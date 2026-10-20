import "@/lib/server-guard";
import { isReviewerRole } from "@/lib/auth/roles";
import { signedOffByModule } from "@/lib/compliance/module-recheck";
import { db } from "@/lib/db";
import { enforceAssignment } from "@/server/trpc/guards";
import type { KeyHolder } from "./context";
import { type itemOf, ON_WALK } from "./gates";
import { closedFor } from "./walk";

/**
 * Whether an assistant may change an item now, and why not: the item is closed for it, a write
 * would take a signature or an approval back, or the holder may not write there. An assistant
 * never takes a signature back, so each refusal sends the person to the app.
 */

export type FoundItem = Extract<Awaited<ReturnType<typeof itemOf>>, { ok: true }>;

/** The item's status row in the company's assessment, or null before it has one. */
export async function statusOf(holder: KeyHolder, found: FoundItem) {
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
export function refusalOf(
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
export async function signaturesTakenBack(
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
export async function approvalTakenBack(
  holder: KeyHolder,
  code: string,
  link: string,
): Promise<string | null> {
  const policies = await holder.caller.durchgang.walkPolicies(ON_WALK);
  // The approval date too: a status set back by hand on the policies page keeps it.
  return policies.some(
    (p) => p.code === code && (p.status === "approved" || p.approvedAt !== null),
  )
    ? `Management approved the policy of ${code}. Rewriting it takes that approval back, so it is changed in the app: ${link}`
    : null;
}

/**
 * Whether the holder's assistant may change this item now, or why not: closed for it, a company
 * not set up yet, a reviewer's role, or an area that is not the person's own (the rule the app's
 * answer saves apply, held here for every write, including those whose procedures do not check
 * it). Returns the item's status row and assessment for the writes that need them.
 */
export async function mayChange(holder: KeyHolder, found: FoundItem, link: string) {
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
