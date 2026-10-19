/**
 * propagateSatisfaction against a real Postgres: what a sign-off writes into another framework.
 * The unit tests cover which targets the walk reaches and which of them take the credit; only a
 * database shows that the write lands where it should, carries its history entry, leaves a
 * decided row alone, and happens once when several sign-offs race for the same target, which
 * rests on the guarded UPDATE and its row lock.
 *
 *   DATABASE_URL=postgres://... AUTH_SECRET=<32+ chars> bun scripts/ci/propagation-drill.ts
 *
 * Expects a migrated database filled with db/framework-seed.sql. Every scenario creates its own
 * user, company and assessments under a fresh run id, so runs never share rows.
 */
import { and, eq, inArray } from "drizzle-orm";
import { createBillingAccount } from "@/lib/billing/accounts";
import { db } from "@/lib/db";
import {
  company,
  companyAssessment,
  companyRequirementStatus,
  complianceFramework,
  requirement,
  requirementSatisfaction,
  signOffHistory,
  user,
} from "@/schema";
import { propagateSatisfaction } from "@/server/trpc/helpers/assessment-helpers";

/** NIS2 2.1 (risk management method), signed in the drill. */
const SOURCE = "2.1";
/** ISO 27001 6.1, the same method document: a same-record link to 2.1. */
const SAME_RECORD = "IS-6.1";
/** ISO 27001 A.5.7, which ENISA lists for CIR point 2.1: an overlap, never credit. */
const OVERLAP = "A.5.7";

const RUN = crypto.randomUUID().slice(0, 8);

type Status = (typeof companyRequirementStatus.$inferInsert)["status"];

const one = <T>(rows: readonly T[], what: string): T => {
  const [row] = rows;
  if (row === undefined) throw new Error(`${what}: no row`);
  return row;
};

const requirementIds = async (): Promise<Readonly<Record<string, string>>> => {
  const rows = await db
    .select({ id: requirement.id, code: requirement.code })
    .from(requirement)
    .where(inArray(requirement.code, [SOURCE, SAME_RECORD, OVERLAP]));
  return Object.fromEntries(rows.map((r) => [r.code, r.id]));
};

const idOf = (ids: Readonly<Record<string, string>>, code: string): string => {
  const id = ids[code];
  if (id === undefined) throw new Error(`requirement ${code} is not seeded`);
  return id;
};

/** The links the drill rests on, read from the database rather than assumed. */
async function linksAreSeeded(
  ids: Readonly<Record<string, string>>,
): Promise<string | null> {
  const kindOf = async (iso: string) => {
    const rows = await db
      .select({ kind: requirementSatisfaction.equivalenceKind })
      .from(requirementSatisfaction)
      .where(
        and(
          eq(requirementSatisfaction.requirementAId, idOf(ids, iso)),
          eq(requirementSatisfaction.requirementBId, idOf(ids, SOURCE)),
        ),
      );
    return rows[0]?.kind;
  };
  const [sameRecord, overlap] = [await kindOf(SAME_RECORD), await kindOf(OVERLAP)];
  return sameRecord === "equivalent" && overlap === "overlapping"
    ? null
    : `seeded links: ${SAME_RECORD} is ${sameRecord}, ${OVERLAP} is ${overlap}; expected equivalent and overlapping`;
}

interface Tenant {
  readonly companyId: string;
  readonly userId: string;
  /** Status row id per requirement code, for the two ISO items. */
  readonly statusOf: Readonly<Record<string, string>>;
}

/** A company with a NIS2 and an ISO 27001 assessment, the two ISO items in the given state. */
async function tenant(
  label: string,
  iso: Partial<Record<string, Status>>,
): Promise<Tenant> {
  const ids = await requirementIds();
  const owner = one(
    await db
      .insert(user)
      .values({
        email: `propagation-${RUN}-${label}@example.test`,
        name: "Propagation drill",
      })
      .returning({ id: user.id }),
    "user",
  );
  const org = one(
    await db
      .insert(company)
      .values({
        name: `Propagation drill ${RUN} ${label}`,
        sector: "drill",
        entityType: "important",
        ownerId: owner.id,
        billingAccountId: await createBillingAccount(db, owner.id),
      })
      .returning({ id: company.id }),
    "company",
  );
  const frameworks = await db
    .select({ id: complianceFramework.id, code: complianceFramework.code })
    .from(complianceFramework)
    .where(inArray(complianceFramework.code, ["nis2", "iso27001"]));
  const assessmentFor = async (code: string) => {
    const framework = one(
      frameworks.filter((f) => f.code === code),
      `framework ${code}`,
    );
    return one(
      await db
        .insert(companyAssessment)
        .values({ companyId: org.id, frameworkId: framework.id })
        .returning({ id: companyAssessment.id }),
      `assessment ${code}`,
    ).id;
  };
  const [nis2, iso27001] = [await assessmentFor("nis2"), await assessmentFor("iso27001")];
  await db
    .insert(companyRequirementStatus)
    .values({
      assessmentId: nis2,
      requirementId: idOf(ids, SOURCE),
      status: "in_progress",
    });
  const statusOf = Object.fromEntries(
    await Promise.all(
      [SAME_RECORD, OVERLAP].map(async (code) => {
        const status = iso[code] ?? "not_started";
        const row = one(
          await db
            .insert(companyRequirementStatus)
            .values({
              assessmentId: iso27001,
              requirementId: idOf(ids, code),
              status,
              ...(status === "not_applicable"
                ? { notApplicableReason: "Drill: set aside before the sign-off." }
                : {}),
            })
            .returning({ id: companyRequirementStatus.id }),
          `status ${code}`,
        );
        return [code, row.id] as const;
      }),
    ),
  );
  return { companyId: org.id, userId: owner.id, statusOf };
}

const signSource = async (t: Tenant, signedOffRole: string) =>
  propagateSatisfaction(db, {
    sourceRequirementId: idOf(await requirementIds(), SOURCE),
    companyId: t.companyId,
    userId: t.userId,
    signedOffRole,
    snapshot: { templateVersion: 1 },
  });

const statusRow = async (id: string) =>
  one(
    await db
      .select({
        status: companyRequirementStatus.status,
        signedOffBy: companyRequirementStatus.signedOffBy,
        signedOffRole: companyRequirementStatus.signedOffRole,
      })
      .from(companyRequirementStatus)
      .where(eq(companyRequirementStatus.id, id)),
    "status row",
  );

const historyOf = (statusId: string) =>
  db
    .select({ snapshot: signOffHistory.snapshot })
    .from(signOffHistory)
    .where(eq(signOffHistory.statusId, statusId));

const statusIdOf = (t: Tenant, code: string): string => {
  const id = t.statusOf[code];
  if (id === undefined) throw new Error(`no status row for ${code}`);
  return id;
};

async function creditsTheSameRecordOnly(): Promise<string | null> {
  const t = await tenant("credit", {});
  await signSource(t, "ciso");
  const sameRecord = await statusRow(statusIdOf(t, SAME_RECORD));
  const overlap = await statusRow(statusIdOf(t, OVERLAP));
  const history = await historyOf(statusIdOf(t, SAME_RECORD));
  if (sameRecord.status !== "completed" || sameRecord.signedOffBy !== t.userId) {
    return `${SAME_RECORD} is ${sameRecord.status}, signed by ${sameRecord.signedOffBy}; expected completed by the signer`;
  }
  if (sameRecord.signedOffRole !== "ciso") {
    return `${SAME_RECORD} carries role ${sameRecord.signedOffRole}; expected ciso`;
  }
  if (history.length !== 1 || history[0]?.snapshot.source !== "module") {
    return `${SAME_RECORD} has ${history.length} history entries; expected one, from the module`;
  }
  return overlap.status === "not_started"
    ? null
    : `${OVERLAP}, an overlap, became ${overlap.status}; an overlap credits nothing`;
}

async function leavesASetAsideRowAlone(): Promise<string | null> {
  const t = await tenant("set-aside", { [SAME_RECORD]: "not_applicable" });
  const credited = await signSource(t, "ciso");
  const row = await statusRow(statusIdOf(t, SAME_RECORD));
  const history = await historyOf(statusIdOf(t, SAME_RECORD));
  return credited.length === 0 && row.status === "not_applicable" && history.length === 0
    ? null
    : `a set-aside ${SAME_RECORD} became ${row.status} with ${history.length} history entries`;
}

async function needsTheTargetsRole(): Promise<string | null> {
  const t = await tenant("role", {});
  const credited = await signSource(t, "dpo");
  const row = await statusRow(statusIdOf(t, SAME_RECORD));
  return credited.length === 0 && row.status === "not_started"
    ? null
    : `a DPO signature made ${SAME_RECORD} ${row.status}; it names no role, so the CISO default applies`;
}

async function racingSignOffsWriteOnce(): Promise<string | null> {
  const t = await tenant("race", {});
  await Promise.all(Array.from({ length: 5 }, () => signSource(t, "ciso")));
  const history = await historyOf(statusIdOf(t, SAME_RECORD));
  return history.length === 1
    ? null
    : `5 parallel sign-offs wrote ${history.length} history entries for ${SAME_RECORD}; expected 1`;
}

const seeded = await linksAreSeeded(await requirementIds());
const failures = (
  seeded !== null
    ? [seeded]
    : [
        await creditsTheSameRecordOnly(),
        await leavesASetAsideRowAlone(),
        await needsTheTargetsRole(),
        await racingSignOffsWriteOnce(),
      ]
).filter((f): f is string => f !== null);

for (const f of failures) console.error(`[drill] FAIL: ${f}`);
if (failures.length === 0) {
  console.log(
    "[drill] OK: a sign-off credits the same record once, with its history entry, and never an overlap, a set-aside row or a role it does not hold",
  );
}
process.exit(failures.length === 0 ? 0 : 1);
