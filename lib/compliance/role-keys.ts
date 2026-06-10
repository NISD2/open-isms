/**
 * Compliance role keys — shared between server and client code.
 *
 * Kept in a separate module from role-mapping.ts so client components
 * can import these constants without pulling in drizzle-orm / schema.
 */

export const ALL_ROLE_KEYS = [
  "ceo",
  "ciso",
  "cto",
  "coo",
  "cpo",
  "hr_director",
  "legal",
  "dpo",
] as const;

export type RoleKey = (typeof ALL_ROLE_KEYS)[number];

/** Default sign-off role when no specific role is required. CISO owns all NIS2 requirements. */
export const DEFAULT_SIGN_OFF_ROLE: RoleKey = "ciso";
