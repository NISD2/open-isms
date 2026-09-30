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
 * The keys are read inside the erasure transaction, before the rows go, and a
 * pending outcome naming every folder is written in that same transaction, so
 * every committed erasure is retried until it settles, even if the process
 * dies right after the commit. The files are deleted only after the commit:
 * deleting first would destroy them for good if the transaction then rolled
 * back. A deletion still unfinished after {@link ERASURE_FILE_RETRY_DAYS} days
 * goes to an operator by mail, retried daily until the mail has gone out, and
 * only then does the certificate say an operator has it.
 *
 * Free of the S3 client and the database handle, so the rules can be tested
 * with a fake store.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { DbOrTx } from "@/lib/db";
import { companyUploadFolders, isOwnObjectKey } from "@/lib/storage/object-key";
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

/**
 * How long after the erasure a deletion is retried. Without s3:ListBucket, or
 * with a file the folder check refuses, it can never finish by itself, and a
 * daily retry forever would only add a row a day and keep the certificate
 * saying "retried".
 */
export const ERASURE_FILE_RETRY_DAYS = 14;

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
  /** Keys known to hold the company's files, which can be deleted even where listing is refused. */
  readonly keys: readonly string[];
}

export const fileOutcomeSchema = z.object({
  /** "manual": retried for {@link ERASURE_FILE_RETRY_DAYS} days and handed to an operator. */
  state: z.enum(["pending", "complete", "manual"]),
  deleted: z.number().int().min(0),
  pendingPrefixes: z.array(z.string()),
  /**
   * Files known to be still in place. Only the newest outcome row keeps them:
   * keys carry uploaded file names, so each new row drops them from the rows
   * before it.
   */
  keys: z.array(z.string()).default([]),
  /** Files in the company's folders whose keys fail isOwnObjectKey, so they are never deleted automatically. */
  refused: z.number().int().min(0).default(0),
  /**
   * For "manual": whether the mail to the operators actually went out. With
   * no admin address, mail disabled or a failed send it has not, and until it
   * has, nobody has been handed anything.
   */
  alerted: z.boolean().default(false),
});

export type FileOutcome = z.infer<typeof fileOutcomeSchema>;

export interface Retry {
  readonly attempts: number;
  readonly wait: () => Promise<void>;
}

export const STORAGE_RETRY: Retry = {
  attempts: 3,
  wait: () => new Promise((resolve) => setTimeout(resolve, 500)),
};

/**
 * Whether a key names a file inside one of the folders, without climbing out
 * of it. A row written before keys were checked on write (#222) may hold
 * `companies/A/training-certs/../../B/x`, which a store that resolves dot
 * segments would read as company B's file.
 */
const isOwnKey = (prefixes: readonly string[], key: string) =>
  prefixes.some((prefix) => isOwnObjectKey(prefix, key));

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

/** The outcome written inside the erasure transaction: nothing deleted yet, every folder to go. */
export function pendingOutcome(files: StoredFiles): FileOutcome {
  return {
    state: "pending",
    deleted: 0,
    pendingPrefixes: [...files.prefixes],
    keys: [...new Set(files.keys.filter((key) => isOwnKey(files.prefixes, key)))],
    refused: 0,
    alerted: false,
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
 * Delete every file in the company's folders. A key outside all of them, or
 * one that climbs out of its folder, is never deleted, whichever row held it.
 * A folder comes back pending when it could not be listed, or still holds a
 * file that could not be deleted or that the folder check refused.
 */
export async function deleteStoredFiles(
  store: FileStore,
  files: StoredFiles,
  retry: Retry = STORAGE_RETRY,
): Promise<FileOutcome> {
  const folders = await Promise.all(
    files.prefixes.map(async (prefix) => {
      const listed = await attempt(() => store.list(prefix), retry);
      const inFolder = [
        ...new Set([...files.keys, ...(listed.ok ? listed.value : [])]),
      ].filter((key) => key.startsWith(prefix));
      const own = inFolder.filter((key) => isOwnObjectKey(prefix, key));
      const removed = await Promise.all(
        own.map(async (key) => ({
          key,
          ok: (await attempt(() => store.remove(key), retry)).ok,
        })),
      );
      const left = removed.filter((r) => !r.ok).map((r) => r.key);
      const refused = inFolder.length - own.length;
      return {
        prefix,
        deleted: removed.length - left.length,
        left,
        refused,
        complete: listed.ok && left.length === 0 && refused === 0,
      };
    }),
  );
  const pendingPrefixes = folders.filter((f) => !f.complete).map((f) => f.prefix);
  return {
    state: pendingPrefixes.length === 0 ? "complete" : "pending",
    deleted: folders.reduce((sum, folder) => sum + folder.deleted, 0),
    pendingPrefixes,
    keys: folders.flatMap((folder) => folder.left),
    refused: folders.reduce((sum, folder) => sum + folder.refused, 0),
    alerted: false,
  };
}

/**
 * Delete a committed erasure's files and record how that went. Never throws:
 * the erasure has committed, and an error now would tell the operator that it
 * had not. When even the record fails, the pending outcome written inside the
 * erasure transaction is still the newest, so the cron retries. The log names
 * folders and counts only; keys are never logged, since they carry uploaded
 * file names.
 */
export async function settleStoredFiles(
  store: FileStore,
  files: StoredFiles,
  record: (outcome: FileOutcome) => Promise<void>,
  label: string,
  retry: Retry = STORAGE_RETRY,
): Promise<FileOutcome> {
  const outcome = await deleteStoredFiles(store, files, retry).catch(() =>
    pendingOutcome(files),
  );
  await record(outcome).catch((err: unknown) =>
    console.error(
      `[gdpr] ${label}: file deletion outcome not recorded:`,
      err instanceof Error ? err.name : "unknown error",
    ),
  );
  if (outcome.refused > 0) {
    console.error(
      `[gdpr] ${label}: ${outcome.refused} stored file(s) left alone, their keys climb out of the company's folder`,
    );
  }
  if (outcome.pendingPrefixes.length > 0) {
    console.error(
      `[gdpr] ${label}: stored files not yet deleted under ${outcome.pendingPrefixes.join(", ")}`,
    );
  }
  return outcome;
}

/**
 * What a retry may delete: the folders still pending, derived from the
 * erasure's company rather than read from the outcome, and only the recorded
 * keys that lie inside them. A damaged outcome row cannot widen either.
 */
export function retryFiles(companyId: string, latest: FileOutcome): StoredFiles {
  const prefixes = companyUploadFolders(companyId).filter((folder) =>
    latest.pendingPrefixes.includes(folder),
  );
  return { prefixes, keys: latest.keys.filter((key) => isOwnKey(prefixes, key)) };
}

/**
 * What the cron still owes an erasure's files: another deletion attempt, the
 * operator mail that has not gone out yet, or nothing.
 */
export function followUp(outcome: FileOutcome): "delete" | "alert" | null {
  if (outcome.state === "pending") return "delete";
  if (outcome.state === "manual" && !outcome.alerted) return "alert";
  return null;
}

/** An outcome still pending {@link ERASURE_FILE_RETRY_DAYS} days after the erasure is final: it needs a person. */
export function afterRetryWindow(
  outcome: FileOutcome,
  erasedAt: Date,
  now: Date,
): FileOutcome {
  const due = erasedAt.getTime() + ERASURE_FILE_RETRY_DAYS * 24 * 60 * 60 * 1000;
  return outcome.state === "pending" && now.getTime() >= due
    ? { ...outcome, state: "manual" }
    : outcome;
}

/**
 * What an erasure certificate may say about the organization's stored files.
 * "pending": still being retried. "outstanding": retries are over and no
 * operator has been reached yet. "manual": an operator has the rest.
 */
export type StoredFileState =
  | { kind: "not_applicable" }
  | { kind: "unrecorded" }
  | {
      kind: "pending" | "outstanding" | "manual";
      deleted: number;
      pendingPrefixes: string[];
    }
  | { kind: "complete"; deleted: number };

/**
 * Read the latest recorded outcome. A teardown with no outcome on record,
 * which is every teardown made before files were deleted at all, is
 * "unrecorded", never "complete". A manual outcome whose operator mail has
 * not gone out is "outstanding", never "manual".
 */
export function storedFileState(
  companyTornDown: boolean,
  latestOutcome: unknown,
): StoredFileState {
  if (!companyTornDown) return { kind: "not_applicable" };
  const parsed = fileOutcomeSchema.safeParse(latestOutcome);
  if (!parsed.success) return { kind: "unrecorded" };
  const { state, deleted, pendingPrefixes, alerted } = parsed.data;
  if (state === "complete") return { kind: "complete", deleted };
  const kind = state === "manual" ? (alerted ? "manual" : "outstanding") : "pending";
  return { kind, deleted, pendingPrefixes };
}
