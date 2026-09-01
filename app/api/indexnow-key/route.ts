/**
 * IndexNow ownership key file.
 *
 * The IndexNow protocol proves you control a host by serving the key as
 * plain text somewhere on that host, and naming that location as
 * `keyLocation` in the submission. The spec's default location is
 * `https://<host>/<key>.txt`; a custom `keyLocation` is explicitly
 * allowed and is what we use, because a literal `<key>.txt` file would
 * have to be committed to `public/` — baking one deployment's key into
 * an open-source repo every self-hoster clones.
 *
 * Returns 404 when INDEXNOW_KEY is unset so a self-hosted instance
 * exposes nothing by default.
 *
 * Security: the key is not a secret in the confidentiality sense — it is
 * published by design, and its only power is "may submit URLs for this
 * host to a search index". It is still per-deployment.
 */
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = env.INDEXNOW_KEY;
  if (!key) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // The verifier fetches this right after a submission; a stale CDN
      // copy after a key rotation would fail every submission until it
      // expired.
      "Cache-Control": "no-store",
    },
  });
}
