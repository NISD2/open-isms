/**
 * Content-Security-Policy, built from the environment at call time.
 *
 * next.config.ts `headers()` runs when the image is built, so every value it
 * reads from the environment freezes to whatever the build machine had. That
 * is wrong for the one directive that is operator-specific: evidence uploads
 * PUT straight from the browser to a presigned URL, so `connect-src` has to
 * name the storage origin, and a self-hoster's origin is their MinIO or their
 * own S3 — never the origin this image was built with.
 *
 * The failure is silent and expensive. Presigning is offline, so the server
 * never learns the PUT was blocked; the confirm step still writes the row, and
 * the instance ends up holding evidence records whose objects do not exist.
 *
 * So proxy.ts calls this per request and overwrites the baked header. Both
 * callers share this module so the two policies cannot drift.
 */

/** Index-signature shaped so `process.env` satisfies it directly. */
export type CspEnv = { readonly [key: string]: string | undefined };

const originOf = (url: string): string => URL.parse(url)?.origin ?? "";

/**
 * Where the browser is allowed to PUT evidence to.
 *
 * A custom endpoint wins: that is MinIO, or any S3-compatible server. Failing
 * that, a configured bucket implies the AWS virtual-host origin. With neither
 * set, storage is not configured and the directive names nothing — an unset
 * instance must not inherit somebody else's bucket.
 */
export const storageOrigin = (env: CspEnv): string => {
  if (env.AWS_S3_ENDPOINT) return originOf(env.AWS_S3_ENDPOINT);
  if (env.AWS_S3_BUCKET) {
    const region = env.AWS_S3_REGION ?? "eu-north-1";
    return `https://${env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com`;
  }
  return "";
};

const directive = (name: string, sources: readonly string[]): string =>
  [name, ...sources.filter((s) => s !== "")].join(" ");

export const buildCsp = (env: CspEnv): string => {
  // HSTS and upgrade-insecure-requests both pin HTTPS for two years once a
  // user reaches the host over TLS, so they stay off until the operator says
  // the deployment is HTTPS-only.
  const httpsHardened = env.CSP_UPGRADE_INSECURE === "1";
  const analytics = env.ANALYTICS_SCRIPT_URL ? originOf(env.ANALYTICS_SCRIPT_URL) : "";
  const storage = storageOrigin(env);

  return [
    directive("default-src", ["'self'"]),
    directive("script-src", ["'self'", "'unsafe-inline'", "'unsafe-eval'", analytics, "https://accounts.google.com"]),
    directive("style-src", ["'self'", "'unsafe-inline'"]),
    directive("img-src", ["'self'", "data:", "blob:", "https:"]),
    directive("font-src", ["'self'", "data:"]),
    directive("connect-src", ["'self'", analytics, "https://accounts.google.com", storage]),
    directive("frame-src", ["'self'", "https://accounts.google.com", "https://www.youtube.com", "https://www.youtube-nocookie.com"]),
    directive("frame-ancestors", ["'none'"]),
    directive("base-uri", ["'self'"]),
    directive("form-action", ["'self'", "https://accounts.google.com"]),
    ...(httpsHardened ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
};
