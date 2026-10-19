import "@/lib/server-guard";
import { z } from "zod";
import { isReviewerRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { WALK } from "@/lib/durchgang";
import { canRequestAnswers } from "@/lib/supplier-portal/register-row";
import { loggableFailure } from "@/lib/trpc/loggable-failure";
import { enforceAssignment } from "@/server/trpc/guards";
import type { KeyHolder } from "./context";
import { describeError } from "./errors";
import { itemOf, language, linkOf, notInPlan, refuse, type ToolOutcome } from "./gates";
import { registerOfItem } from "./walk";

/** Suppliers one call may send to: a whole list, small enough to read the answer back. */
const MAX_SUPPLIERS = 50;

export const SendQuestionnaireInput = z.object({
  suppliers: z
    .array(z.string().uuid())
    .min(1)
    .max(MAX_SUPPLIERS)
    .describe(
      "The ids of rows on the company's supplier list, as get_walkthrough lists them in the supplier register. Each supplier is sent the questionnaire at the contact email on its row.",
    ),
  language,
});

/** Where a listed supplier is sent the questionnaire, or why it is not. */
function askable(row: {
  readonly name: string;
  readonly contactEmail: string | null;
  readonly supplierCompanyId: string | null;
  readonly source: string | null;
}):
  | { readonly ok: true; readonly email: string }
  | { readonly ok: false; readonly message: string } {
  if (row.supplierCompanyId !== null) {
    return {
      ok: false,
      message: `${row.name} is linked to its own company in the supplier portal and keeps its answers there.`,
    };
  }
  if (!canRequestAnswers(row)) {
    return {
      ok: false,
      message: `${row.name} runs this instance; its answers are already on its row.`,
    };
  }
  if (!row.contactEmail) {
    return {
      ok: false,
      message: `${row.name} has no contact email. Add it to the row with fill_walkthrough_item (changes), then send again.`,
    };
  }
  return { ok: true, email: row.contactEmail };
}

/**
 * The security questionnaire, mailed to suppliers on the company's list through the procedure the
 * app's own button calls (supplierInvite.create): the same mail, the same budgets, and not again
 * within a day. It goes only to the contact email on a supplier's row, never to an address the
 * assistant names, so every recipient stands in the register where the person sees it. The answer
 * leaves out the invite link: whoever holds it can answer as the supplier.
 */
export async function sendQuestionnaire(
  holder: KeyHolder,
  input: z.output<typeof SendQuestionnaireInput>,
): Promise<ToolOutcome> {
  const locked = notInPlan(holder, input.language);
  if (locked) return locked;
  const listItem = WALK.find((item) => registerOfItem(item)?.module === "supplier");
  const answersItem = WALK.find((item) =>
    item.screens.some((s) => s.kind === "agreements"),
  );
  if (!listItem || !answersItem)
    return refuse("This walkthrough keeps no supplier list.");
  const found = await itemOf(holder, listItem.code);
  if (!found.ok) return refuse(found.message);
  if (isReviewerRole(holder.role)) {
    return refuse("Your role reviews the walkthrough; it sends nothing.");
  }
  if (!found.assessment) {
    return refuse(
      `Finish setting up the company in the app first: ${linkOf(listItem.code, input.language)}`,
    );
  }
  await enforceAssignment(db, {
    role: holder.role,
    userId: holder.userId,
    assessmentId: found.assessment.id,
    categoryId: found.categoryId,
  });

  const listed = new Map(
    (await holder.caller.supplier.list()).map((row) => [row.id, row] as const),
  );
  const results: Array<
    | { supplierId: string; name: string; sentTo: string; linkValidUntil: Date }
    | { supplierId: string; refused: string }
  > = [];
  for (const supplierId of new Set(input.suppliers)) {
    const row = listed.get(supplierId);
    if (!row) {
      results.push({ supplierId, refused: "Not a row on the company's supplier list." });
      continue;
    }
    const target = askable(row);
    if (!target.ok) {
      results.push({ supplierId, refused: target.message });
      continue;
    }
    try {
      const sent = await holder.caller.supplierInvite.create({
        toEmail: target.email,
        supplierId,
      });
      results.push({
        supplierId,
        name: row.name,
        sentTo: target.email,
        linkValidUntil: sent.expiresAt,
      });
    } catch (error) {
      const refused = describeError(error);
      if (!refused) {
        console.error(
          "[mcp] a questionnaire failed:",
          error instanceof Error ? loggableFailure(error) : error,
        );
      }
      results.push({ supplierId, refused: refused ?? "Could not be sent." });
    }
  }
  return {
    ok: true,
    data: {
      suppliers: results,
      next: `Each supplier sent the questionnaire gets an email with a link to it. Once it answers, its row shows as linked: ${linkOf(answersItem.code, input.language)}`,
    },
  };
}
