import "next-auth";
import "next-auth/jwt";

/**
 * NextAuth type augmentation — extends Session with our custom fields.
 *
 * companyId / role / jobTitle are resolved from the DB in getSession()
 * — not via JWT callbacks. The JWT only holds the email and the
 * session revocation marker (audit M-1, 2026-06-10); everything else
 * is always fresh from DB.
 */
declare module "next-auth" {
  interface Session {
    companyId: string | null;
    /**
     * Whether the company is ACTIVATED (past the draft shell auto-provisioned at
     * email verification). false when companyId is null or still a draft. Single
     * source of truth for "has a real organization" across page/layout gates, so
     * they never regress to a bare `companyId != null` check (which is now true
     * for every verified user).
     */
    companyActivated: boolean;
    role: string;
    jobTitle: string | null;
    /**
     * Session revocation counter copied from the JWT. getSession
     * compares this against the live user row; if the row's
     * sessionVersion has been bumped since the token was issued, the
     * session is treated as revoked.
     */
    sessionVersion: number | null;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionVersion?: number;
  }
}
