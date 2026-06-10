import "next-auth";

/**
 * NextAuth type augmentation — extends Session with our custom fields.
 *
 * All custom fields (id, companyId, role) are resolved from the DB
 * in getSession() — not via JWT callbacks. The JWT only holds the
 * email from Google OAuth; everything else is always fresh from DB.
 */
declare module "next-auth" {
  interface Session {
    companyId: string | null;
    role: string;
    jobTitle: string | null;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
