import "@/lib/server-guard";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MAX_UPLOAD_BYTES } from "./limits";
import { BUCKET, s3, s3Signer } from "./s3-client";

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
    ServerSideEncryption: "AES256",
  });
  return getSignedUrl(s3Signer, command, { expiresIn: 900 });
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

/** Delete an object from S3 */
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3.send(command);
}
