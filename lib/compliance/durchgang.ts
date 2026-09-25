import { JOURNEY_ORDER } from "./journey-position";

/**
 * The items the Durchgang walks today: the opening of the journey order, one requirement per
 * screen. Ten for now; the rest of the 49 follow once these screens have been watched in use.
 * Extending the walk is this one number plus the step notes in messages/durchgang.
 */
export const DURCHGANG_LENGTH = 10;

export const DURCHGANG_CODES: readonly string[] = JOURNEY_ORDER.slice(
  0,
  DURCHGANG_LENGTH,
);

export interface DurchgangStep {
  /** 1-based, for "Schritt 3 von 10". */
  number: number;
  total: number;
  prevCode: string | null;
  nextCode: string | null;
}

/** Where a requirement sits in the walk, or null when the walk does not reach it yet. */
export function durchgangStep(code: string): DurchgangStep | null {
  const index = DURCHGANG_CODES.indexOf(code);
  if (index === -1) return null;
  return {
    number: index + 1,
    total: DURCHGANG_CODES.length,
    prevCode: DURCHGANG_CODES[index - 1] ?? null,
    nextCode: DURCHGANG_CODES[index + 1] ?? null,
  };
}

/** Message key for a requirement code: the message files cannot carry dots in keys. */
export function stepKey(code: string): string {
  return code.split(".").join("_");
}
