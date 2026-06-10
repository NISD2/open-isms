/**
 * Best-effort client IP for rate-limiting and audit logging.
 *
 * open-isms ships on Coolify behind Traefik. Traefik sets `X-Real-IP` to the
 * immediate peer IP — the value the upstream client cannot forge — and
 * APPENDS to `X-Forwarded-For`, so the LAST segment of XFF is the trusted
 * hop and the leading segments may be attacker-supplied.
 *
 * Previous versions trusted `cf-connecting-ip` and the FIRST XFF segment,
 * both attacker-set on the wire when no Cloudflare sits in front. That
 * silently defeated every per-IP rate limit in the codebase. If you put
 * Cloudflare in front of this deployment later, re-add the
 * `cf-connecting-ip` branch here — under CF that header IS the trusted
 * source — and configure Traefik with `forwardedHeaders.trustedIPs`.
 */
export function getClientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const segments = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) return last;
  }

  return "unknown";
}
