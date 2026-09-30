/**
 * Removing the stored file of a record that was just deleted.
 *
 * Deleting a training record or a certification used to drop the row and
 * leave its file in the bucket for good, so a certificate naming an employee
 * outlived the record the company deleted. Import-free, so the rules below
 * can be tested without a bucket.
 */

export type ReleasedObjectOutcome = "removed" | "kept" | "failed";

/**
 * Delete the object a deleted row pointed at, once nothing else points at it.
 *
 * Only a key inside `prefix`, the company's own upload folder, is deleted: a
 * row written before keys were checked on write may name any object,
 * including another tenant's. `stillReferenced` is asked first because some
 * rows share a file (a batch of training records carries one certificate).
 *
 * Never throws. The row is already gone, which is what the person asked for;
 * a file that could not be deleted is logged by record and error name, never
 * by key or message: keys carry the uploaded file's name, and an S3 access
 * error quotes the key it refused.
 */
export async function removeReleasedObject(input: {
  key: string | null | undefined;
  prefix: string;
  stillReferenced: (key: string) => Promise<boolean>;
  remove: (key: string) => Promise<void>;
  /** Names the deleted row in the log line, e.g. "training_record <id>". */
  record: string;
}): Promise<ReleasedObjectOutcome> {
  const { key } = input;
  if (!key?.startsWith(input.prefix)) return "kept";
  try {
    if (await input.stillReferenced(key)) return "kept";
    await input.remove(key);
    return "removed";
  } catch (err) {
    console.error(
      `[storage] file of deleted ${input.record} not removed: ${err instanceof Error ? err.name : "unknown error"}`,
    );
    return "failed";
  }
}
