import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const PLATFORM_ADMIN_EMAILS = [
  "simon@nisd2.eu",
  "cory@nisd2.eu",
] as const;

/**
 * Gate a server component (page or layout) on platform-admin access.
 * Redirects unauthenticated users to /auth/signin and non-admins to /dashboard.
 * Returns the session for downstream use.
 */
export async function requirePlatformAdmin() {
  const session = await getSession();
  if (!session?.user.email) redirect("/auth/signin");
  if (!(PLATFORM_ADMIN_EMAILS as readonly string[]).includes(session.user.email)) {
    redirect("/dashboard");
  }
  return session;
}
