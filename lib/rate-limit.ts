const windows = new Map<string, number[]>();

/**
 * In-memory sliding window rate limiter.
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const timestamps = windows.get(key) ?? [];
  const recent = timestamps.filter((t) => t > cutoff);

  if (recent.length >= limit) {
    windows.set(key, recent);
    return false;
  }

  recent.push(now);
  windows.set(key, recent);
  return true;
}
