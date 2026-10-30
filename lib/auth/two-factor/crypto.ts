import "@/lib/server-guard";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

/**
 * The key that encrypts the authenticator app secrets, or null when this instance has none, which
 * switches two-factor sign-in off (lib/env.ts TWO_FACTOR_ENCRYPTION_KEY).
 */
export function twoFactorKey(): Buffer | null {
  const raw = env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw.trim(), "base64");
  return key.length === 32 ? key : null;
}

/** An app secret as stored: `v1:<nonce>:<tag>:<ciphertext>`, each part base64. */
export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const parts = [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64"));
  return [VERSION, ...parts].join(":");
}

/** The app secret, or null for a value this key did not write (other key, changed, unknown form). */
export function decryptSecret(stored: string, key: Buffer): string | null {
  const [version, iv, tag, body, ...rest] = stored.split(":");
  if (version !== VERSION || !iv || !tag || !body || rest.length > 0) return null;
  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
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
