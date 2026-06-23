/**
 * Feature-flag predicate for the /portal/journey route + journey.getItems
 * tRPC procedure. Single source of truth for "is this user allowed to use
 * the journey UX." Backed by the JOURNEY_ALLOWED_DOMAINS env var.
 *
 * Pure function — no side effects, easy to unit-test, works on server.
 */
export function isJourneyAllowed(
  email: string | null | undefined,
  allowedDomainsEnv: string | undefined,
): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  // The journey path view is now the default post-login surface for everyone,
  // so the gate defaults OPEN ("*"). Set JOURNEY_ALLOWED_DOMAINS to an explicit
  // comma-separated allowlist only to re-narrow it (e.g. during a staged rollout).
  const allowed = (allowedDomainsEnv ?? "*")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
  // "*" opens the journey to all domains.
  if (allowed.includes("*")) return true;
  return allowed.includes(domain);
}
