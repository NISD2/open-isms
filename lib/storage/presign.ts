import "@/lib/server-guard";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MAX_UPLOAD_BYTES } from "./limits";
import { BUCKET, s3, s3Signer } from "./s3-client";

/**
 * The server-side encryption every upload is signed with. It is part of the signature, so the
 * PUT has to send it back as the `x-amz-server-side-encryption` header or storage refuses it.
 */
export const UPLOAD_ENCRYPTION = "AES256";

/** Generate a presigned PUT URL for direct client upload (15 min expiry) */
export async function createPresignedPut(
  key: string,
  contentType: string,
  fileSize: number,
): Promise<string> {
  if (fileSize > MAX_UPLOAD_BYTES) {
    throw new Error(`File size ${fileSize} exceeds maximum of ${MAX_UPLOAD_BYTES} bytes`);
  }
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
    ServerSideEncryption: UPLOAD_ENCRYPTION,
  });
  // The presigner leaves content-type out of the signature unless told otherwise, so a PUT could
  // store the object under any type it likes. Signed, the type the server chose (normalized, or
  // forced to PDF) is the one stored; every uploader already sends it back.
  return getSignedUrl(s3Signer, command, {
    expiresIn: 900,
    signableHeaders: new Set(["content-type"]),
  });
}

/**
 * The size of an uploaded object, or null when there is none: a presigned PUT that was never
 * sent, or was refused, leaves nothing to confirm. AWS answers a missing key with 403 rather than
 * 404 when the credentials may not list the bucket, so both mean "not there"; an existing object
 * answers 200 to the same credentials that sign its downloads.
 */
export async function storedSize(key: string): Promise<number | null> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return head.ContentLength ?? null;
  } catch (error) {
    const status =
      error instanceof S3ServiceException ? error.$metadata.httpStatusCode : undefined;
    if (status === 404 || status === 403) return null;
    throw error;
  }
}

/**
 * Generate a presigned GET URL for file download (1 hour expiry).
 *
 * Audit F-4 (2026-09-10): the response is forced to `attachment`. Pinning the
 * content type at upload time only helps objects uploaded after that change —
 * everything already in the bucket still carries whatever type the client
 * claimed when it was stored, and the evidence list opens these URLs with
 * `target="_blank"`. Overriding the disposition here covers the objects
 * already written, the ones written from here on, and any future presign
 * site that forgets, because it is the one door they all leave through.
 *
 * Every caller today is a download control, so this matches what the UI
 * already promises. If something ever needs to render an object inline, give
 * it its own presigner rather than widening this one.
 */
export async function createPresignedGet(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: "attachment",
  });
  return getSignedUrl(s3Signer, command, { expiresIn: 3600 });
}

/** Store an object the server itself produced, such as an archived invoice PDF. */
export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  });
  await s3.send(command);
}

/** Delete an object from S3 */
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3.send(command);
}

/**
 * Every key under a prefix. S3 answers in pages of up to 1,000, so the
 * continuation token is followed until the listing is complete. Needs
 * s3:ListBucket on the bucket, which the upload and download paths never did.
 */
export async function listObjectKeys(prefix: string): Promise<string[]> {
  const page = async (continuationToken?: string): Promise<string[]> => {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (res.Contents ?? []).flatMap((object) =>
      object.Key ? [object.Key] : [],
    );
    if (!res.IsTruncated || !res.NextContinuationToken) return keys;
    return [...keys, ...(await page(res.NextContinuationToken))];
  };
  return page();
}
