import "@/lib/server-guard";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, s3Signer, BUCKET } from "./s3-client";
import { MAX_UPLOAD_BYTES } from "./limits";

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

/** Generate a presigned GET URL for file download (1 hour expiry) */
export async function createPresignedGet(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
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
