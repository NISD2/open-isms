import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database, DbOrTx } from "@/lib/db";
import {
  type AnyItem,
  type DurchgangEvent,
  type ItemState,
  itemState,
  STATE_ACTIONS,
  walkOf,
} from "@/lib/durchgang";
import { auditLog, company, companyRequirementStatus, requirement } from "@/schema";
import { enforceAssignment } from "../guards";
import { getNis2Assessment } from "./nis2-scope";
import type { SignableRow } from "./sign-off-rows";

/**
 * The items this company walks, read off the entity type on its profile: an item for operators
 * of critical facilities is in it only when the profile says the company is one.
 */
export async function companyWalk(
  db: DbOrTx,
  companyId: string,
): Promise<readonly AnyItem[]> {
  const row = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { entityType: true },
  });
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No such company." });
  return walkOf(row.entityType);
}

export interface DurchgangItemRef {
  readonly code: string;
  readonly requirementId: string;
  readonly statusId: string;
  /** Where the item's answers are kept: the intake row of this assessment and category. */
  readonly assessmentId: string;
  readonly categoryId: string;
}

/** Who writes: the session's company, the person, and their role in it. */
export interface DurchgangActor {
  readonly companyId: string;
  readonly userId: string;
  readonly role: string;
}

/**
 * One item of the walk, for the caller's company: its requirement and its NIS 2 status row. The
 * company comes from the session and the code from a fixed list, so there is no id a caller could
 * pass to reach another company's row. Writing to an item takes what writing its answers takes:
 * the category's owner or an admin.
 */
export async function durchgangItem(
  db: Database,
  actor: DurchgangActor,
  code: string,
): Promise<DurchgangItemRef> {
  const ref = await walkItemRef(db, actor.companyId, code);
  await enforceAssignment(db, {
    role: actor.role,
    userId: actor.userId,
    assessmentId: ref.assessmentId,
    categoryId: ref.categoryId,
  });
  return ref;
}

/**
 * The same item without the category check, for an act whose authority is a role rather than a
 * category: management approving the walk's documents, which the caller checks first.
 */
export async function walkItemRef(
  db: Database,
  companyId: string,
  code: string,
): Promise<DurchgangItemRef> {
  const walk = await companyWalk(db, companyId);
  if (!walk.some((item) => item.code === code)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${code} is not in this company's Durchgang.`,
    });
  }
  const assessment = await getNis2Assessment(db, companyId);
  const req = await db.query.requirement.findFirst({
    where: eq(requirement.code, code),
    columns: { id: true, categoryId: true },
  });
  const status =
    assessment && req
      ? await db.query.companyRequirementStatus.findFirst({
          where: and(
            eq(companyRequirementStatus.assessmentId, assessment.id),
            eq(companyRequirementStatus.requirementId, req.id),
          ),
          columns: { id: true },
        })
      : undefined;
  if (!assessment || !req || !status) {
    throw new TRPCError({ code: "NOT_FOUND", message: `No status row for ${code}.` });
  }
  return {
    code,
    requirementId: req.id,
    statusId: status.id,
    assessmentId: assessment.id,
    categoryId: req.categoryId,
  };
}

/**
 * Appends one line to the item's own trail, in one statement, so two appends never overwrite
 * each other. The row's `updatedAt` stays: a note is not work on the requirement.
 */
export async function appendNote(
  db: DbOrTx,
  statusId: string,
  line: string,
): Promise<void> {
  await db
    .update(companyRequirementStatus)
    .set({
      internalNotes: sql`coalesce(${companyRequirementStatus.internalNotes} || E'\n', '') || ${line}`,
    })
    .where(eq(companyRequirementStatus.id, statusId));
}

/**
 * The newest audit row per requirement among the actions that move a walk item, for the company:
 * what `itemState` reads beside the status row. Without `requirementIds` it reads every
 * requirement of the company, so the journey can run it beside its own rows.
 */
export async function latestWalkEvents(
  db: DbOrTx,
  companyId: string,
  requirementIds?: readonly string[],
): Promise<ReadonlyMap<string | null, DurchgangEvent>> {
  if (requirementIds?.length === 0) return new Map();
  const events = await db
    .selectDistinctOn([auditLog.entityId], {
      entityId: auditLog.entityId,
      action: auditLog.action,
      newValue: auditLog.newValue,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.companyId, companyId),
        eq(auditLog.entityType, "requirement"),
        requirementIds ? inArray(auditLog.entityId, [...requirementIds]) : undefined,
        inArray(auditLog.action, [...STATE_ACTIONS]),
      ),
    )
    .orderBy(auditLog.entityId, desc(auditLog.createdAt));
  return new Map(events.map((e) => [e.entityId, e]));
}

/** One item of the walk for a company: where it stands, and its NIS 2 status row if it has one. */
export interface WalkRow {
  readonly state: ItemState;
  readonly row: SignableRow | null;
}

/**
 * Every item of the company's walk (`companyWalk`), its codes in walk order: its status row and
 * the newest audit row among the actions that move an item. An item without a status row is open.
 */
export async function walkRows(
  db: DbOrTx,
  companyId: string,
): Promise<{
  readonly assessmentId: string | null;
  readonly codes: readonly string[];
  readonly items: ReadonlyMap<string, WalkRow>;
}> {
  const none: WalkRow = { state: { kind: "open" }, row: null };
  const [assessment, walk] = await Promise.all([
    getNis2Assessment(db, companyId),
    companyWalk(db, companyId),
  ]);
  const codes = walk.map((item) => item.code);
  const reqs = await db.query.requirement.findMany({
    where: inArray(requirement.code, codes),
    columns: { id: true, code: true, templateVersion: true },
  });
  const ids = reqs.map((r) => r.id);
  if (!assessment || ids.length === 0) {
    return { assessmentId: null, codes, items: new Map(codes.map((c) => [c, none])) };
  }

  const [rows, events] = await Promise.all([
    db.query.companyRequirementStatus.findMany({
      where: and(
        eq(companyRequirementStatus.assessmentId, assessment.id),
        inArray(companyRequirementStatus.requirementId, ids),
      ),
      columns: {
        id: true,
        requirementId: true,
        status: true,
        signedOffAt: true,
        reviewedAt: true,
      },
    }),
    latestWalkEvents(db, companyId, ids),
  ]);

  const rowOf = new Map(rows.map((r) => [r.requirementId, r]));
  return {
    assessmentId: assessment.id,
    codes,
    items: new Map(
      reqs.map((r): [string, WalkRow] => {
        const status = rowOf.get(r.id);
        return [
          r.code,
          status
            ? {
                state: itemState(status, events.get(r.id) ?? null),
                row: {
                  statusId: status.id,
                  requirementId: r.id,
                  code: r.code,
                  templateVersion: r.templateVersion,
                },
              }
            : none,
        ];
      }),
    ),
  };
}

/** Where every item of the company's walk stands, in walk order (see `walkRows`). */
export async function walkStates(
  db: DbOrTx,
  companyId: string,
): Promise<ReadonlyArray<{ readonly code: string; readonly state: ItemState }>> {
  const { codes, items } = await walkRows(db, companyId);
  return codes.map((code) => ({
    code,
    state: items.get(code)?.state ?? { kind: "open" },
  }));
}
