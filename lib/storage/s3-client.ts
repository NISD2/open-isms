import "@/lib/server-guard";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

// A custom endpoint means an S3-compatible server rather than AWS itself
// (MinIO in the bundled self-host stack and in the e2e stack). Those need
// path-style URLs; AWS uses virtual-host style and must not get the flag.
const clientFor = (endpoint: string | undefined) =>
  new S3Client({
    region: env.AWS_S3_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });

/**
 * Signs URLs that the browser opens directly. Presigning never calls out; it
 * binds a signature to this endpoint's host, and the browser has to hit that
 * exact host or the signature is rejected. So this carries the PUBLIC address.
 */
export const s3Signer = clientFor(env.AWS_S3_ENDPOINT);

/**
 * Sends real requests from the server. When the object store runs beside the
 * app on a container network its reachable address differs from the public
 * one, which is what AWS_S3_INTERNAL_ENDPOINT is for. Unset everywhere the
 * two addresses are the same, including every AWS deployment.
 */
export const s3 = clientFor(env.AWS_S3_INTERNAL_ENDPOINT ?? env.AWS_S3_ENDPOINT);

export const BUCKET = env.AWS_S3_BUCKET;
