import "@/lib/server-guard";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { env } from "@/lib/env";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const TAG_BYTES = 16;
/** Names what the derived key is for; a new version of the label is a new key. */
const KEY_INFO = "open-isms two-factor secret v1";

let derived: Buffer | undefined;

/**
 * The key that encrypts the authenticator app secrets: HKDF-SHA256 of AUTH_SECRET (required, at
 * least 32 characters, lib/env.ts) under its own label, so it is never the session key itself and
 * nothing extra has to be configured. Derived once per process.
 *
 * Rotating AUTH_SECRET makes every stored app secret unreadable. Those people are refused with
 * TWO_FACTOR_UNREADABLE and sign in with a recovery code (hashed, so not tied to the key), or a
 * platform admin resets their second factor; either way they then set the app up again.
 */
export function twoFactorKey(): Buffer {
  derived ??= Buffer.from(
    hkdfSync("sha256", env.AUTH_SECRET, Buffer.alloc(0), KEY_INFO, 32),
  );
  return derived;
}

/**
 * An app secret as stored: `v1:<nonce>:<tag>:<ciphertext>`, each part base64. The person's id is
 * bound in as associated data, so a secret copied onto another person's row does not decrypt.
 */
export function encryptSecret(plain: string, key: Buffer, userId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(userId, "utf8"));
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const parts = [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64"));
  return [VERSION, ...parts].join(":");
}

/**
 * The app secret, or null for a value this key did not write for this person (other key, other
 * person's row, changed, unknown form).
 */
export function decryptSecret(
  stored: string,
  key: Buffer,
  userId: string,
): string | null {
  const [version, iv, tag, body, ...rest] = stored.split(":");
  if (version !== VERSION || !iv || !tag || !body || rest.length > 0) return null;
  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"), {
      authTagLength: TAG_BYTES,
    });
    decipher.setAAD(Buffer.from(userId, "utf8"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(body, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** How a recovery code is stored: its SHA-256. Codes carry about 59 random bits each. */
export const hashRecoveryCode = (normalised: string): string =>
  createHash("sha256").update(normalised).digest("hex");
