import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database, DbOrTx } from "@/lib/db";
import { type ItemState, itemState, STATE_ACTIONS, WALK } from "@/lib/durchgang";
import { auditLog, companyRequirementStatus, requirement } from "@/schema";
import { enforceAssignment } from "../guards";
import { getNis2Assessment } from "./nis2-scope";

const WALK_CODES: readonly string[] = WALK.map((item) => item.code);

export interface DurchgangItemRef {
  readonly code: string;
  readonly requirementId: string;
  readonly statusId: string;
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
  if (!WALK_CODES.includes(code)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${code} is not in the Durchgang.`,
    });
  }
  const assessment = await getNis2Assessment(db, actor.companyId);
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
  await enforceAssignment(db, {
    role: actor.role,
    userId: actor.userId,
    assessmentId: assessment.id,
    categoryId: req.categoryId,
  });
  return { code, requirementId: req.id, statusId: status.id };
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
 * Where every item of the walk stands for one company: its status row and the newest audit row
 * among the actions that move an item, one query each. An item without a status row is open.
 */
export async function walkStates(
  db: DbOrTx,
  companyId: string,
): Promise<ReadonlyMap<string, ItemState>> {
  const open: ItemState = { kind: "open" };
  const assessment = await getNis2Assessment(db, companyId);
  const reqs = await db.query.requirement.findMany({
    where: inArray(requirement.code, [...WALK_CODES]),
    columns: { id: true, code: true },
  });
  const ids = reqs.map((r) => r.id);
  if (!assessment || ids.length === 0) return new Map(WALK_CODES.map((c) => [c, open]));

  const [rows, events] = await Promise.all([
    db.query.companyRequirementStatus.findMany({
      where: and(
        eq(companyRequirementStatus.assessmentId, assessment.id),
        inArray(companyRequirementStatus.requirementId, ids),
      ),
      columns: { requirementId: true, status: true, signedOffAt: true, reviewedAt: true },
    }),
    db
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
          inArray(auditLog.entityId, ids),
          inArray(auditLog.action, [...STATE_ACTIONS]),
        ),
      )
      .orderBy(auditLog.entityId, desc(auditLog.createdAt)),
  ]);

  const rowOf = new Map(rows.map((r) => [r.requirementId, r]));
  const eventOf = new Map(events.map((e) => [e.entityId, e]));
  return new Map(
    reqs.map((r) => {
      const row = rowOf.get(r.id);
      return [r.code, row ? itemState(row, eventOf.get(r.id) ?? null) : open];
    }),
  );
}
