/**
 * An erased organization's stored files.
 *
 * Tearing a company down deleted its evidence, training, certification and
 * policy rows and the company row with its logo key, but the files those rows
 * pointed at live in object storage, which the erasure transaction cannot
 * reach. They stayed in the bucket for good, training certificates with
 * employees' names included, while the erasure certificate said everything
 * had been deleted.
 *
 * The keys are read inside the erasure transaction, before the rows go, and
 * the files are deleted only after it commits: deleting first would destroy
 * them for good if the transaction then rolled back. A deletion that fails
 * neither undoes nor fails the erasure. It is recorded, retried, and stated on
 * the certificate as outstanding.
 *
 * Free of the S3 client and the database handle, so the rules can be tested
 * with a fake store.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { DbOrTx } from "@/lib/db";
import { companyUploadFolders } from "@/lib/storage/object-key";
import {
  company,
  companyAssessment,
  companyCertification,
  companyRequirementStatus,
  evidence,
  policy,
  trainingRecord,
} from "@/schema";

/** The audit action that records what happened to an erasure's files, keyed by the erasure record. */
export const ERASURE_FILES_ACTION = "gdpr.erasure_files";

export interface FileStore {
  list(prefix: string): Promise<readonly string[]>;
  remove(key: string): Promise<void>;
}

/** What a teardown leaves in object storage. */
export interface StoredFiles {
  /**
   * The company's upload folders. Listing them also finds files no row points
   * at any more, such as a replaced logo or an upload never attached.
   */
  readonly prefixes: readonly string[];
  /** The keys the company's rows held, which can be deleted even where listing is not permitted. */
  readonly keys: readonly string[];
}

export const fileDeletionSchema = z.object({
  deleted: z.number().int().min(0),
  pendingPrefixes: z.array(z.string()),
});

export type FileDeletion = z.infer<typeof fileDeletionSchema>;

export interface Retry {
  readonly attempts: number;
  readonly wait: () => Promise<void>;
}

export const STORAGE_RETRY: Retry = {
  attempts: 3,
  wait: () => new Promise((resolve) => setTimeout(resolve, 500)),
};

/** Read, inside the erasure transaction, where a company's files are. */
export async function collectCompanyFiles(
  tx: DbOrTx,
  companyId: string,
): Promise<StoredFiles> {
  const evidenceKeys = await tx
    .select({ key: evidence.storageKey })
    .from(evidence)
    .innerJoin(
      companyRequirementStatus,
      eq(companyRequirementStatus.id, evidence.requirementStatusId),
    )
    .innerJoin(
      companyAssessment,
      eq(companyAssessment.id, companyRequirementStatus.assessmentId),
    )
    .where(eq(companyAssessment.companyId, companyId));
  const certificateKeys = await tx
    .select({ key: trainingRecord.certificateFileKey })
    .from(trainingRecord)
    .where(eq(trainingRecord.companyId, companyId));
  const certificationKeys = await tx
    .select({ key: companyCertification.storageKey })
    .from(companyCertification)
    .where(eq(companyCertification.companyId, companyId));
  const policyKeys = await tx
    .select({ key: policy.fileKey })
    .from(policy)
    .where(eq(policy.companyId, companyId));
  const logoKeys = await tx
    .select({ key: company.logoStorageKey })
    .from(company)
    .where(eq(company.id, companyId));
  return {
    prefixes: companyUploadFolders(companyId),
    keys: [
      ...evidenceKeys,
      ...certificateKeys,
      ...certificationKeys,
      ...policyKeys,
      ...logoKeys,
    ].flatMap((row) => (row.key ? [row.key] : [])),
  };
}

type Attempt<T> = { ok: true; value: T } | { ok: false };

async function attempt<T>(
  run: () => Promise<T>,
  retry: Retry,
  left = retry.attempts,
): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await run() };
  } catch {
    if (left <= 1) return { ok: false };
    await retry.wait();
    return attempt(run, retry, left - 1);
  }
}

/**
 * Delete every file in the company's folders. A key outside all of them is
 * never deleted, whichever row held it: a row written before keys were
 * checked on write may name another tenant's object. A folder that could not
 * be listed, or holds a file that could not be deleted, comes back pending.
 */
export async function deleteStoredFiles(
  store: FileStore,
  files: StoredFiles,
  retry: Retry = STORAGE_RETRY,
): Promise<FileDeletion> {
  const folders = await Promise.all(
    files.prefixes.map(async (prefix) => {
      const listed = await attempt(() => store.list(prefix), retry);
      const keys = new Set(
        [...files.keys, ...(listed.ok ? listed.value : [])].filter((key) =>
          key.startsWith(prefix),
        ),
      );
      const removed = await Promise.all(
        [...keys].map((key) => attempt(() => store.remove(key), retry)),
      );
      return {
        prefix,
        deleted: removed.filter((r) => r.ok).length,
        complete: listed.ok && removed.every((r) => r.ok),
      };
    }),
  );
  return {
    deleted: folders.reduce((sum, folder) => sum + folder.deleted, 0),
    pendingPrefixes: folders.filter((f) => !f.complete).map((f) => f.prefix),
  };
}

/**
 * Delete a committed erasure's files and record how that went. Never throws:
 * the erasure has committed, and an error now would tell the operator that it
 * had not. What is still outstanding is logged by folder, which names only
 * the company id; keys are never logged, since they carry uploaded file names.
 */
export async function settleStoredFiles(
  store: FileStore,
  files: StoredFiles,
  record: (outcome: FileDeletion) => Promise<void>,
  label: string,
  retry: Retry = STORAGE_RETRY,
): Promise<FileDeletion> {
  const outcome = await deleteStoredFiles(store, files, retry).catch(
    (): FileDeletion => ({ deleted: 0, pendingPrefixes: [...files.prefixes] }),
  );
  await record(outcome).catch((err: unknown) =>
    console.error(
      `[gdpr] ${label}: file deletion outcome not recorded:`,
      err instanceof Error ? err.name : "unknown error",
    ),
  );
  if (outcome.pendingPrefixes.length > 0) {
    console.error(
      `[gdpr] ${label}: stored files not yet deleted under ${outcome.pendingPrefixes.join(", ")}; retried by the deadlines cron`,
    );
  }
  return outcome;
}

/** What an erasure certificate may say about the organization's stored files. */
export type StoredFileState =
  | { kind: "not_applicable" }
  | { kind: "unrecorded" }
  | { kind: "pending"; deleted: number; pendingPrefixes: string[] }
  | { kind: "complete"; deleted: number };

/**
 * Read the latest recorded outcome. A teardown with no outcome on record,
 * which is every teardown made before files were deleted at all, is
 * "unrecorded", never "complete".
 */
export function storedFileState(
  companyTornDown: boolean,
  latestOutcome: unknown,
): StoredFileState {
  if (!companyTornDown) return { kind: "not_applicable" };
  const parsed = fileDeletionSchema.safeParse(latestOutcome);
  if (!parsed.success) return { kind: "unrecorded" };
  return parsed.data.pendingPrefixes.length > 0
    ? { kind: "pending", ...parsed.data }
    : { kind: "complete", deleted: parsed.data.deleted };
}
