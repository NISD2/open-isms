/**
 * Upload limits shared by the browser and the server.
 *
 * Deliberately free of imports: `presign.ts` pulls in `@/lib/server-guard`
 * and the AWS SDK, so a client component that wants to check a file size
 * before asking for a presigned URL cannot import from there. Without a
 * shared constant the browser either guesses the limit or skips the check
 * and lets the server reject the upload with an opaque 500 — which is what
 * "upload failed" with no reason looked like from the outside.
 */

/** Largest object a presigned PUT will sign. Enforced on both sides. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Human-readable form of {@link MAX_UPLOAD_BYTES}, for error copy. */
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/**
 * Whether the server will refuse to sign an upload of this size.
 *
 * Worth checking in the browser first. `createPresignedPut` throws a plain
 * Error past the limit, which reaches the client as an unlabelled tRPC
 * failure and gets rendered as "upload failed" — true, useless, and
 * indistinguishable from a network problem or a storage misconfiguration.
 */
export function exceedsUploadLimit(fileSize: number): boolean {
  return fileSize > MAX_UPLOAD_BYTES;
}
