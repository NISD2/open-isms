import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { companyRequirementStatus, requirementAssignment } from "@/schema";
import { buildSignOffSnapshot } from "./assessment-helpers";
import { recordSignOffChainEntry } from "./sign-off-chain";
import { completedSignOffValues, snapshotForVersion } from "./sign-off-completion";

export type SignableRow = {
  readonly statusId: string;
  readonly requirementId: string;
  readonly code: string;
  readonly templateVersion: number;
};

export type SignedRow = SignableRow & { readonly snapshot: SignOffSnapshot };

/**
 * Sign several requirements at once, as one person: the category bulk sign-off and the walk's
 * approval both do this. The caller decides who may sign which row; this leaves out the rows
 * whose assigned signers still owe a signature, because those are signed one by one through the
 * assignment flow.
 *
 * Every row gets its chain entry in the same transaction as its status, and the status guard is
 * repeated on the write, so a row another writer completed between the read and the write is
 * skipped rather than re-signed under this caller's name.
 */
export async function signOffRows(
  db: Database,
  args: {
    readonly companyId: string;
    readonly userId: string;
    readonly signedOffRole: string;
    readonly rows: readonly SignableRow[];
    /** What the chain entry records about how this row came to be signed. */
    readonly chainData: (row: SignableRow) => Record<string, unknown>;
  },
): Promise<readonly SignedRow[]> {
  if (args.rows.length === 0) return [];

  // Rows still owed a signature, the SQL spelling of pendingSignersOf in
  // lib/compliance/sign-off-roster. A receipt from a past sign-off is not a roster.
  const pending = new Set(
    (
      await db
        .select({ statusId: requirementAssignment.statusId })
        .from(requirementAssignment)
        .where(
          and(
            inArray(
              requirementAssignment.statusId,
              args.rows.map((r) => r.statusId),
            ),
            isNull(requirementAssignment.signedOffAt),
          ),
        )
    ).map((a) => a.statusId),
  );
  // A stable lock order, the one bulkConfirmModuleRef takes.
  const rows = args.rows
    .filter((row) => !pending.has(row.statusId))
    .toSorted((a, b) => a.statusId.localeCompare(b.statusId));
  const [first] = rows;
  if (!first) return [];

  const now = new Date();
  // The company half of the snapshot is built once; each row re-stamps its own templateVersion.
  const base = await buildSignOffSnapshot(db, args.companyId, first.templateVersion);

  return db.transaction(async (tx) => {
    const signed: SignedRow[] = [];
    for (const row of rows) {
      const snapshot = snapshotForVersion(base, row.templateVersion);
      const [updated] = await tx
        .update(companyRequirementStatus)
        .set(
          completedSignOffValues({
            userId: args.userId,
            signedOffRole: args.signedOffRole,
            templateVersion: row.templateVersion,
            snapshot,
            now,
          }),
        )
        .where(
          and(
            eq(companyRequirementStatus.id, row.statusId),
            sql`${companyRequirementStatus.status} NOT IN ('completed', 'approved')`,
          ),
        )
        .returning({ id: companyRequirementStatus.id });
      if (!updated) continue;

      await recordSignOffChainEntry(tx as unknown as Database, {
        companyId: args.companyId,
        statusId: row.statusId,
        requirementId: row.requirementId,
        signedOffBy: args.userId,
        signedOffRole: args.signedOffRole,
        source: "editor",
        templateVersion: row.templateVersion,
        companyProfile: snapshot.companyProfile ?? {},
        data: args.chainData(row),
      });
      signed.push({ ...row, snapshot });
    }
    return signed;
  });
}
