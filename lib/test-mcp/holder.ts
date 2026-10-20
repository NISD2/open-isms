/**
 * Whether a key's claims still stand against the person's row today. Pure: the caller reads the
 * row and says whether the address is on the operator list.
 */

export interface KeyClaimsToCheck {
  readonly ver: number;
  readonly sv: number;
}

export interface PersonRow {
  readonly email: string | null;
  readonly emailVerifiedAt: Date | null;
  readonly mcpKeyVersion: number;
  readonly sessionVersion: number;
}

export type Refusal =
  | "no such person"
  | "address not verified"
  | "assistants were disconnected"
  | "signed out since"
  | "not an operator";

/** Null when the key still opens the endpoint, else the first reason it does not. */
export function holderRefusal(
  claims: KeyClaimsToCheck,
  row: PersonRow | undefined,
  isOperator: (email: string) => boolean,
): Refusal | null {
  if (!row?.email) return "no such person";
  if (row.emailVerifiedAt === null) return "address not verified";
  if (row.mcpKeyVersion !== claims.ver) return "assistants were disconnected";
  if (row.sessionVersion !== claims.sv) return "signed out since";
  return isOperator(row.email) ? null : "not an operator";
}
