import { TRPCError } from "@trpc/server";
import { addYears } from "date-fns";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  ne,
  notInArray,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { isBackupSystem } from "@/lib/asset-inventory/catalog-labels";
import { toDateString } from "@/lib/compliance/deadlines";
import { isDoneStatus } from "@/lib/compliance/journey-position";
import type { Database, DbOrTx } from "@/lib/db";
import {
  type AnyItem,
  asksSecondFactor,
  type DurchgangEvent,
  type GapFacts,
  type ItemState,
  type JourneyEntry,
  journeyStates,
  MANAGEMENT_ROLE,
  STATE_ACTIONS,
  WALK_POLICIES,
  walkItemState,
  walkOf,
} from "@/lib/durchgang";
import {
  asset,
  auditLog,
  company,
  companyAssessment,
  companyCategoryIntake,
  companyMembership,
  companyRequirementStatus,
  complianceFramework,
  policy,
  requirement,
  requirementCategory,
  supplier,
  trainingRecord,
  user,
} from "@/schema";
import { enforceAssignment } from "../guards";
import { getNis2Assessment, NIS2_FRAMEWORK_CODE } from "./nis2-scope";
import type { SignableRow } from "./sign-off-rows";

/**
 * The items this company walks, read off its profile (`walkOf`): an item for operators of
 * critical facilities is in it only when the company operates one. A session's company always
 * exists, so a missing one is a broken invariant, not a "not found" a caller could handle.
 */
export async function companyWalk(
  db: DbOrTx,
  companyId: string,
): Promise<readonly AnyItem[]> {
  const row = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { entityType: true, criticalInstallation: true },
  });
  if (!row) throw new Error(`No company ${companyId}.`);
  return walkOf(row);
}

export interface DurchgangItemRef {
  readonly code: string;
  readonly requirementId: string;
  readonly statusId: string;
  /** The status column, for the acts a signed item no longer takes. */
  readonly status: string;
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
          columns: { id: true, status: true },
        })
      : undefined;
  if (!assessment || !req || !status) {
    throw new TRPCError({ code: "NOT_FOUND", message: `No status row for ${code}.` });
  }
  return {
    code,
    requirementId: req.id,
    statusId: status.id,
    status: status.status,
    assessmentId: assessment.id,
    categoryId: req.categoryId,
  };
}

/**
 * Refuses setting aside or deciding against an item that is signed off or recorded not
 * applicable: either would stop the requirements it covers reading done while it stays signed.
 * Such an item is reopened on its requirement page first.
 */
export function refuseSettled(ref: DurchgangItemRef): void {
  if (isDoneStatus(ref.status)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `${ref.code} is signed off; reopen it before setting it aside or deciding against it.`,
    });
  }
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

/** The company's own status rows: every write below is limited to them. */
const ofCompany = (db: DbOrTx, companyId: string) =>
  inArray(
    companyRequirementStatus.assessmentId,
    db
      .select({ id: companyAssessment.id })
      .from(companyAssessment)
      .where(eq(companyAssessment.companyId, companyId)),
  );

/** Rows already decided: signed off, approved, or recorded not applicable. */
const DECIDED = ["completed", "approved", "not_applicable"] as const;

/**
 * The reason a decision not to do an item will be signed with, or null once the item is filled
 * in or picked up again. A row already decided keeps what it has.
 */
export async function declineReason(
  db: DbOrTx,
  companyId: string,
  statusId: string,
  reason: string | null,
): Promise<void> {
  await db
    .update(companyRequirementStatus)
    .set({ notApplicableReason: reason })
    .where(
      and(
        eq(companyRequirementStatus.id, statusId),
        ofCompany(db, companyId),
        notInArray(companyRequirementStatus.status, [...DECIDED]),
      ),
    );
}

/** The reasons the company's given rows were decided against with, by status row id. */
export async function declineReasonsOf(
  db: DbOrTx,
  companyId: string,
  statusIds: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  if (statusIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: companyRequirementStatus.id,
      reason: companyRequirementStatus.notApplicableReason,
    })
    .from(companyRequirementStatus)
    .where(
      and(inArray(companyRequirementStatus.id, [...statusIds]), ofCompany(db, companyId)),
    );
  return new Map(rows.flatMap((r) => (r.reason ? [[r.id, r.reason] as const] : [])));
}

/**
 * Management's signature on decisions not to do an item: recorded the way the requirement page
 * records "not applicable", with the walk's written reason, management as the one who decided,
 * now, and a review in a year. Only a decision with its written reason is signed; a row decided
 * meanwhile is left alone. Returns the ids of the rows it recorded.
 */
export async function signDeclined(
  db: DbOrTx,
  args: {
    readonly companyId: string;
    readonly userId: string;
    readonly statusIds: readonly string[];
    readonly now: Date;
  },
): Promise<readonly string[]> {
  if (args.statusIds.length === 0) return [];
  const rows = await db
    .update(companyRequirementStatus)
    .set({
      status: "not_applicable",
      isApplicable: false,
      notApplicableBy: args.userId,
      notApplicableAt: args.now,
      lastReviewedAt: args.now,
      nextReviewDate: toDateString(addYears(args.now, 1)),
      updatedAt: args.now,
    })
    .where(
      and(
        inArray(companyRequirementStatus.id, [...args.statusIds]),
        ofCompany(db, args.companyId),
        notInArray(companyRequirementStatus.status, [...DECIDED]),
        isNotNull(companyRequirementStatus.notApplicableReason),
        ne(companyRequirementStatus.notApplicableReason, ""),
      ),
    )
    .returning({ id: companyRequirementStatus.id });
  return rows.map((r) => r.id);
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

/**
 * Where each NIS 2 requirement stands on the journey (`journeyStates`), by code, for each of these
 * companies: for readers outside the journey, the export and the emails, so they name what the
 * journey shows. Three queries whatever the number of companies.
 */
export async function journeyStatesByCompany(
  db: DbOrTx,
  companyIds: readonly string[],
): Promise<ReadonlyMap<string, ReadonlyMap<string, JourneyEntry>>> {
  if (companyIds.length === 0) return new Map();
  const ids = [...companyIds];
  const [rows, events, companies] = await Promise.all([
    db
      .select({
        companyId: companyAssessment.companyId,
        code: requirement.code,
        requirementId: companyRequirementStatus.requirementId,
        status: companyRequirementStatus.status,
        signedOffAt: companyRequirementStatus.signedOffAt,
        reviewedAt: companyRequirementStatus.reviewedAt,
      })
      .from(companyRequirementStatus)
      .innerJoin(
        companyAssessment,
        eq(companyAssessment.id, companyRequirementStatus.assessmentId),
      )
      .innerJoin(
        complianceFramework,
        and(
          eq(complianceFramework.id, companyAssessment.frameworkId),
          eq(complianceFramework.code, NIS2_FRAMEWORK_CODE),
        ),
      )
      .innerJoin(requirement, eq(requirement.id, companyRequirementStatus.requirementId))
      .where(inArray(companyAssessment.companyId, ids)),
    db
      .selectDistinctOn([auditLog.companyId, auditLog.entityId], {
        companyId: auditLog.companyId,
        entityId: auditLog.entityId,
        action: auditLog.action,
        newValue: auditLog.newValue,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(
        and(
          inArray(auditLog.companyId, ids),
          eq(auditLog.entityType, "requirement"),
          inArray(auditLog.action, [...STATE_ACTIONS]),
        ),
      )
      .orderBy(auditLog.companyId, auditLog.entityId, desc(auditLog.createdAt)),
    db
      .select({
        id: company.id,
        sector: company.sector,
        entityType: company.entityType,
        criticalInstallation: company.criticalInstallation,
      })
      .from(company)
      .where(inArray(company.id, ids)),
  ]);
  return new Map(
    companies.map((co) => [
      co.id,
      journeyStates(
        rows.filter((r) => r.companyId === co.id),
        new Map(events.filter((e) => e.companyId === co.id).map((e) => [e.entityId, e])),
        { sector: co.sector, walks: walkOf(co).map((item) => item.code) },
      ),
    ]),
  );
}

/** `journeyStatesByCompany` for one company. */
export async function journeyStatesOf(
  db: DbOrTx,
  companyId: string,
): Promise<ReadonlyMap<string, JourneyEntry>> {
  return (await journeyStatesByCompany(db, [companyId])).get(companyId) ?? new Map();
}

/** 3.3's answer as the intake stores it; anything else reads as unanswered. */
const REPORTING = z.object({ bsiReportingRegistered: z.boolean().optional() }).catch({});

/**
 * The facts `gapsOf` reads, for one company: its programs with a sign-in, suppliers, backup
 * systems, 3.3's answer, who holds the management role and the management trainings, and the
 * steps set aside. Every query is filtered by the company.
 */
export async function gapFactsOf(
  db: DbOrTx,
  companyId: string,
  today: Date,
): Promise<GapFacts> {
  const [assets, suppliers, managers, trainings, assessment, states] = await Promise.all([
    db
      .select({
        name: asset.name,
        type: asset.type,
        catalogId: asset.catalogId,
        description: asset.description,
        hasMfa: asset.hasMfa,
        lastRestore: asset.lastBackupTestDate,
      })
      .from(asset)
      .where(eq(asset.companyId, companyId)),
    db
      .select({
        name: supplier.name,
        riskLevel: supplier.riskLevel,
        security: supplier.hasSecurityClauses,
        incidents: supplier.hasIncidentNotificationClause,
      })
      .from(supplier)
      .where(eq(supplier.customerCompanyId, companyId)),
    db
      .select({ n: count() })
      .from(companyMembership)
      .where(
        and(
          eq(companyMembership.companyId, companyId),
          eq(companyMembership.jobTitle, MANAGEMENT_ROLE),
        ),
      ),
    db
      .select({
        name: trainingRecord.participantName,
        completedAt: trainingRecord.completedAt,
      })
      .from(trainingRecord)
      .where(
        and(
          eq(trainingRecord.companyId, companyId),
          eq(trainingRecord.isManagement, true),
        ),
      ),
    getNis2Assessment(db, companyId),
    walkStates(db, companyId),
  ]);
  const [intake] = assessment
    ? await db
        .select({ answers: companyCategoryIntake.answers })
        .from(companyCategoryIntake)
        .innerJoin(
          requirementCategory,
          eq(requirementCategory.id, companyCategoryIntake.categoryId),
        )
        .where(
          and(
            eq(companyCategoryIntake.assessmentId, assessment.id),
            eq(requirementCategory.code, "INC"),
          ),
        )
    : [];
  return {
    signIns: assets
      .filter(asksSecondFactor)
      .map((a) => ({ name: a.name, hasMfa: a.hasMfa === true })),
    suppliers: suppliers.map((s) => ({
      name: s.name,
      riskLevel: s.riskLevel,
      security: s.security === true,
      incidents: s.incidents === true,
    })),
    backups: assets
      .filter(isBackupSystem)
      .map((a) => ({ name: a.name, lastRestore: a.lastRestore })),
    reporting: REPORTING.parse(intake?.answers ?? {}).bsiReportingRegistered ?? null,
    managers: managers[0]?.n ?? 0,
    managementTrainings: trainings,
    setAside: states.filter((s) => s.state.kind === "waiting").map((s) => s.code),
    today,
  };
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
                state: walkItemState(r.code, status, events.get(r.id) ?? null),
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

/**
 * The company's policies the walk wrote, in walk order: each one of an item's template on that
 * item's requirement, so a policy of the same type added by hand elsewhere is not among them.
 * With who approved each, when, in which role, and the version that approval set.
 */
export async function walkPolicyRows(db: DbOrTx, companyId: string) {
  const rows = await db
    .select({
      code: requirement.code,
      type: policy.type,
      title: policy.title,
      content: policy.content,
      status: policy.status,
      version: policy.version,
      effectiveFrom: policy.effectiveFrom,
      approvedAt: policy.approvedAt,
      approverRole: policy.approverRole,
      approver: user.name,
    })
    .from(policy)
    .innerJoin(requirement, eq(requirement.id, policy.requirementId))
    .leftJoin(user, eq(user.id, policy.approvedBy))
    .where(
      and(
        eq(policy.companyId, companyId),
        inArray(
          policy.type,
          WALK_POLICIES.map((p) => p.policy),
        ),
      ),
    );
  return WALK_POLICIES.flatMap((p) =>
    rows
      .filter((row) => row.code === p.code && row.type === p.policy)
      .map((row) => ({ ...row, type: p.policy })),
  );
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
