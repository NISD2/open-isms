import { eq } from "drizzle-orm";
import { scheduleDeadlineReminders } from "@/lib/compliance/schedule-notifications";
import { signerRoleOf } from "@/lib/compliance/signer-role";
import type { Database, DbOrTx } from "@/lib/db";
import {
  type AnyScreen,
  approvalOf,
  awaitingSignature,
  gapsOf,
  type ItemState,
  itemOf,
  recordDay,
  reviewedWithinYear,
  signLast,
  type Walk,
  type WalkLocale,
} from "@/lib/durchgang";
import { managementReview } from "@/schema";
import { propagateSatisfaction, recalculateProgress } from "./assessment-helpers";
import { declineReasonsOf, signDeclined, walkPolicyRows, walkRows } from "./durchgang";
import { gapFactsOf } from "./durchgang-gaps";
import { headlineOf } from "./durchgang-words";
import { rosteredOf } from "./roster";
import { signOffRows } from "./sign-off-rows";

/**
 * What the company's own NIS 2 answers still leave open (`gapsOf`), as the approval and the export
 * show it: a step set aside comes with its headline in `locale`.
 */
export const shownGapsOf = async (db: DbOrTx, companyId: string, locale: WalkLocale) =>
  gapsOf(await gapFactsOf(db, companyId, new Date())).map((gap) =>
    gap.kind === "set_aside"
      ? { ...gap, headlines: gap.codes.map((c) => headlineOf(c, locale)) }
      : gap,
  );

/**
 * Whether a walk's approval waits for a management review on record: only where its approval item
 * has the review register among its screens, as NIS 2's 7.3 does.
 */
const approvalNeedsReview = (walk: Walk): boolean => {
  const approval = approvalOf(walk);
  const screens: readonly AnyScreen[] = approval
    ? (itemOf(approval.code)?.screens ?? [])
    : [];
  return screens.some((s) => s.kind === "register" && s.module === "management_review");
};

/**
 * The company's items of a walk waiting for management's signature (see `awaitingSignature`), each
 * with its status row: what the approval screen lists and what the approval may sign, from one
 * computation. Items whose assigned signers still owe a signature are left to them.
 *
 * A decision not to do an item carries no document to approve, even where the walk drafted one
 * before the decision; and it waits only with its written reason, which the signature records.
 */
export const waitingForManagement = async (
  db: Database,
  companyId: string,
  walk: Walk,
) => {
  const needsReview = approvalNeedsReview(walk);
  const [rows, policies, reviews] = await Promise.all([
    walkRows(db, companyId, walk),
    walkPolicyRows(db, companyId, walk),
    needsReview
      ? db
          .select({ day: managementReview.reviewDate })
          .from(managementReview)
          .where(eq(managementReview.companyId, companyId))
      : [],
  ]);
  const order = {
    codes: rows.codes,
    stateOf: (code: string): ItemState => rows.items.get(code)?.state ?? { kind: "open" },
    approvalCode: approvalOf(walk)?.code ?? null,
  };
  const waiting = awaitingSignature({
    ...order,
    drafts: policies.filter(
      (p) => p.status === "draft" && order.stateOf(p.code).kind !== "declined",
    ),
    reviewed:
      !needsReview ||
      reviewedWithinYear(
        reviews.map((r) => r.day),
        recordDay(new Date()),
      ),
  });
  const located = waiting.flatMap((item) => {
    const row = rows.items.get(item.code)?.row;
    return row ? [{ ...item, row }] : [];
  });
  const reasons = await declineReasonsOf(
    db,
    companyId,
    located.filter((item) => item.declined).map((item) => item.row.statusId),
  );
  const signable = located.flatMap((item) => {
    const reason = item.declined ? (reasons.get(item.row.statusId) ?? null) : null;
    return item.declined && !reason ? [] : [{ ...item, reason }];
  });
  const rostered = await rosteredOf(
    db,
    signable.map((item) => item.row.statusId),
  );
  return {
    assessmentId: rows.assessmentId,
    items: signLast(
      signable.filter((item) => !rostered.has(item.row.statusId)),
      order,
    ),
    order,
  };
};

/**
 * Management signs off the waiting items it was shown whose documents are now all approved, as
 * the category bulk sign-off signs (snapshot and chain entry per row), then sets each one's
 * review date and credits linked frameworks as a single sign-off does. One row after another:
 * two rows can credit the same linked requirement, and that write checks its target outside a
 * transaction.
 *
 * Management signs every walk item, whatever role a single sign-off names: the walk ends in one
 * signature. § 38 Abs. 1 BSIG grounds that for the § 30 measures; for 1.1, 3.3 and 12.2 to 12.4,
 * and for every GDPR item, it is ours (the GDPR asks to be able to demonstrate, Art. 5(2), 24(1)).
 *
 * An item the company decided not to do is signed as that decision: recorded not applicable,
 * with its written reason and management as the one who decided (`signDeclined`).
 */
export const signWaiting = async (
  ctx: {
    db: Database;
    companyId: string;
    userId: string;
    session: Parameters<typeof signerRoleOf>[0];
  },
  walk: Walk,
  shown: readonly string[],
  now: Date,
) => {
  if (shown.length === 0) return { signed: [], declined: [] };
  const { assessmentId, items, order } = await waitingForManagement(
    ctx.db,
    ctx.companyId,
    walk,
  );
  // Checked again on what this click signs: an item whose document stayed a draft stays open,
  // and then the item holding the approval waits too.
  const chosen = signLast(
    items.filter((item) => item.drafts.length === 0 && shown.includes(item.code)),
    order,
  );
  const signedOffRole = signerRoleOf(ctx.session);
  // One transaction: decisions and signatures land together, so a failed signature never
  // leaves decisions recorded that no progress count or trail entry followed.
  const { decided, signed } = await ctx.db.transaction(async (tx) => ({
    decided: await signDeclined(tx, {
      companyId: ctx.companyId,
      userId: ctx.userId,
      statusIds: chosen.filter((item) => item.declined).map((item) => item.row.statusId),
      now,
    }),
    signed: await signOffRows(tx, {
      companyId: ctx.companyId,
      userId: ctx.userId,
      signedOffRole,
      rows: chosen.filter((item) => !item.declined).map((item) => item.row),
      source: "editor",
      chainData: (row) => ({
        code: row.code,
        bulkOf: "walk",
        walkApproval: order.approvalCode,
      }),
    }),
  }));
  const declined = chosen
    .filter((item) => decided.includes(item.row.statusId))
    .map((item) => item.row);
  if (!assessmentId || signed.length + declined.length === 0) return { signed, declined };

  await recalculateProgress(ctx.db, assessmentId);
  for (const row of signed) {
    await propagateSatisfaction(ctx.db, {
      sourceRequirementId: row.requirementId,
      companyId: ctx.companyId,
      userId: ctx.userId,
      signedOffRole,
      snapshot: row.snapshot,
    }).catch((err) => console.error("[durchgang] propagate:", err));
    await scheduleDeadlineReminders(ctx.db, {
      statusId: row.statusId,
      anchorDate: now,
      companyId: ctx.companyId,
      userId: ctx.userId,
    }).catch((err) => console.error("[durchgang] deadlines:", err));
  }
  return { signed, declined };
};
