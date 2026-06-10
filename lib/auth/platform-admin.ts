import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * Platform admins are configured via the `PLATFORM_ADMIN_EMAILS` env var
 * (comma-separated). Example: `PLATFORM_ADMIN_EMAILS=alice@example.com,bob@example.com`.
 *
 * Returns an empty list if unset — meaning no one has platform-admin access
 * until you configure it. Lockout-by-default is the safe failure mode.
 */
export function getPlatformAdminEmails(): readonly string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getPlatformAdminEmails().includes(email.toLowerCase());
}

/**
 * Gate a server component (page or layout) on platform-admin access.
 * Redirects unauthenticated users to /auth/signin and non-admins to /dashboard.
 * Returns the session for downstream use.
 */
export async function requirePlatformAdmin() {
  const session = await getSession();
  if (!session?.user.email) redirect("/auth/signin");
  if (!isPlatformAdmin(session.user.email)) {
    redirect("/dashboard");
  }
  return session;
}
