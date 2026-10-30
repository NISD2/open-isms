import { randomInt } from "node:crypto";
import { Secret, TOTP } from "otpauth";

/** The usual authenticator app settings (RFC 6238 defaults), which every common app reads. */
const PERIOD_S = 30;
const DIGITS = 6;
/** One step either side, for a phone clock a little off. */
const WINDOW = 1;

const totpOf = (base32: string, issuer?: string, label?: string) =>
  new TOTP({
    issuer,
    label,
    algorithm: "SHA1",
    digits: DIGITS,
    period: PERIOD_S,
    secret: Secret.fromBase32(base32),
  });

/** A fresh app secret, 160 random bits, base32 as the apps take it. */
export const newAppSecret = (): string => new Secret({ size: 20 }).base32;

/** The otpauth:// address the QR code holds, named after the instance and the person. */
export const appUri = (base32: string, issuer: string, account: string): string =>
  totpOf(base32, issuer, account).toString();

/**
 * The 30-second step a six-digit code belongs to, or null when it matches none within a step of
 * now. The caller refuses a step already used (lib/auth/two-factor/store.ts).
 */
export function stepOfCode(base32: string, code: string, nowMs: number): number | null {
  const totp = totpOf(base32);
  const delta = totp.validate({ token: code, timestamp: nowMs, window: WINDOW });
  return delta === null ? null : totp.counter({ timestamp: nowMs }) + delta;
}

/** The current code, for tests and for nothing else. */
export const currentCode = (base32: string, nowMs: number): string =>
  totpOf(base32).generate({ timestamp: nowMs });

/** No 0/o, 1/i/l: a recovery code is often typed from paper. */
const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const RECOVERY_LENGTH = 12;
export const RECOVERY_CODE_COUNT = 10;

const isDigits = (value: string) => [...value].every((c) => c >= "0" && c <= "9");

/** What someone typed, as a code from the app, a recovery code, or neither. */
export type TypedCode =
  | { readonly kind: "app"; readonly code: string }
  | { readonly kind: "recovery"; readonly code: string }
  | { readonly kind: "none" };

/** Spaces and dashes dropped, lower case: how people copy codes from an app or a printout. */
export function readTypedCode(raw: string | null | undefined): TypedCode {
  const value = (raw ?? "").toLowerCase().split(/[\s-]/).join("");
  if (value.length === DIGITS && isDigits(value)) return { kind: "app", code: value };
  if (
    value.length === RECOVERY_LENGTH &&
    [...value].every((c) => RECOVERY_ALPHABET.includes(c))
  ) {
    return { kind: "recovery", code: value };
  }
  return { kind: "none" };
}

/** Ten new recovery codes, shown as xxxx-xxxx-xxxx. */
export function newRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const chars = Array.from(
      { length: RECOVERY_LENGTH },
      () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)],
    ).join("");
    return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
  });
}

/** A displayed recovery code as it is hashed. */
export const normaliseRecoveryCode = (shown: string): string =>
  shown.toLowerCase().split("-").join("");
