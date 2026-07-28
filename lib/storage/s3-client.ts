import "@/lib/server-guard";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export const s3 = new S3Client({
  region: env.AWS_S3_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  // MinIO (local e2e stack) needs an explicit endpoint and path-style URLs;
  // unset in every real environment.
  ...(env.AWS_S3_ENDPOINT
    ? { endpoint: env.AWS_S3_ENDPOINT, forcePathStyle: true }
    : {}),
});

export const BUCKET = env.AWS_S3_BUCKET;
