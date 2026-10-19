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

/**
 * The role that signs off a requirement naming none. The app's default, not the law's: no text
 * names a CISO, and NIS 2 and the BSIG give the measures to management.
 */
export const DEFAULT_SIGN_OFF_ROLE: RoleKey = "ciso";
