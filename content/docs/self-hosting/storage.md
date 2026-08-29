Evidence files do not go in Postgres. They go to S3-compatible object storage, uploaded straight from the browser with a presigned URL, and Postgres keeps only the storage key.

That has two consequences worth knowing before you configure anything. The upload never passes through the application server, so nothing server-side notices when one fails. And a database restored without its objects points at documents that no longer exist, which is why [backups](/docs/self-hosting/backup-and-restore) treat the two stores as one unit.

## Option 1: the bundled MinIO

The default, and no external account. The `minio` profile is already in `COMPOSE_PROFILES` in the example `.env`, and the storage block already points at it. Two secrets are all that is left:

```ini
AWS_S3_BUCKET=evidence
AWS_ACCESS_KEY_ID=openisms
AWS_SECRET_ACCESS_KEY=   # openssl rand -hex 16, at least 8 characters
MINIO_KMS_KEY=           # openssl rand -base64 32, exactly 32 bytes
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_INTERNAL_ENDPOINT=http://minio:9000
```

A one-shot container creates the bucket on first start. It is idempotent, so it is a no-op afterwards:

```bash
docker compose logs minio-init
# bucket evidence ready
```

MinIO's community server is AGPL-3.0, the same licence as this project, so running it changes nothing about your obligations for internal use. Community builds no longer ship the web console, so administration is through the `mc` CLI.

## Option 2: your own S3

Drop `minio` from `COMPOSE_PROFILES`, set `AWS_S3_REGION` and your own bucket and credentials, and leave **both** endpoint variables empty. Any other S3-compatible provider works the same way: set `AWS_S3_ENDPOINT` to their address and leave the internal one unset.

## Three things that produce confusing failures

### The two endpoints are different on purpose

`AWS_S3_ENDPOINT` is the address the **browser** uses. A presigned URL is signed for one specific host, and the browser has to hit that exact host or the signature is rejected.

`AWS_S3_INTERNAL_ENDPOINT` is the address the **server** uses to reach the same store over the container network. On AWS, and anywhere the two addresses are the same, leave it unset and it falls back to the public one.

Get the internal one wrong and uploads still work, because presigning is offline cryptography and needs no round trip. The first call the server actually makes is a delete, so the symptom is "upload fine, deleting an evidence file fails".

### The public endpoint has to be a real address

`http://localhost:9000` works only while you are evaluating on the machine itself. On a server it becomes something like `https://storage.example.com`, and that origin has to be reachable by your users' browsers. It is also the origin the application names in its Content-Security-Policy, computed per request, so a wrong value blocks the upload in the browser rather than failing on the server:

```bash
curl -sI https://isms.example.com/ | grep -i content-security-policy
```

Under the `proxy` profile, `STORAGE_DOMAIN` in `.env` and `AWS_S3_ENDPOINT` must be the same `https://` name.

### MINIO_KMS_KEY is not decorative

Every upload sends `x-amz-server-side-encryption: AES256`, and MinIO answers SSE-S3 out of a KMS. With no key configured, every upload is rejected. Exactly 32 bytes, base64: `openssl rand -base64 32`.

## Test one upload

Whichever option you choose, upload one evidence file before you consider the instance finished. It exercises the credentials, the presigned URL, the CSP and the bucket in a single action, and it is the one feature that fails visibly in the browser rather than degrading quietly.

A row that appears with no file in the bucket means the browser's upload was refused and the server never learned. Check the CSP first, then that the bucket exists.
