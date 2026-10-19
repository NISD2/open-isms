import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import { and, eq, notInArray } from "drizzle-orm";
import { DONE_STATUS_LIST } from "@/lib/compliance/journey-position";
import type { Database, DbOrTx } from "@/lib/db";
import { companyRequirementStatus } from "@/schema";
import { buildSignOffSnapshot } from "./assessment-helpers";
import { rosteredOf } from "./roster";
import { type RecordSignOffParams, recordSignOffChainEntry } from "./sign-off-chain";
import { completedSignOffValues, snapshotForVersion } from "./sign-off-completion";

export type SignableRow = {
  readonly statusId: string;
  readonly requirementId: string;
  readonly code: string;
  readonly templateVersion: number;
};

/** A row as signed: the snapshot it was signed against comes back with it. */
export type Signed<R extends SignableRow> = R & { readonly snapshot: SignOffSnapshot };

/**
 * Sign several requirements at once, as one person: the category bulk sign-off, the bulk module
 * confirmation and the walk's approval all do this. The caller decides who may sign which row;
 * this leaves out the rows `rosteredOf` names.
 *
 * Every row gets its chain entry in the same transaction as its status, and the status guard is
 * repeated on the write, so a row another writer completed or marked not applicable between the
 * read and the write is skipped rather than signed under this caller's name.
 */
export async function signOffRows<R extends SignableRow>(
  db: DbOrTx,
  args: {
    readonly companyId: string;
    readonly userId: string;
    readonly signedOffRole: string;
    readonly rows: readonly R[];
    readonly source: RecordSignOffParams["source"];
    /** What the chain entry records about how this row came to be signed. */
    readonly chainData: (row: R) => Record<string, unknown>;
  },
): Promise<readonly Signed<R>[]> {
  const pending = await rosteredOf(
    db,
    args.rows.map((r) => r.statusId),
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
    const signed: Signed<R>[] = [];
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
            notInArray(companyRequirementStatus.status, [...DONE_STATUS_LIST]),
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
        source: args.source,
        templateVersion: row.templateVersion,
        companyProfile: snapshot.companyProfile ?? {},
        data: args.chainData(row),
      });
      signed.push({ ...row, snapshot });
    }
    return signed;
  });
}
