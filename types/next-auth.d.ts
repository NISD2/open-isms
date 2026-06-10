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
